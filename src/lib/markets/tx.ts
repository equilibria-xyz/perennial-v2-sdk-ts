import { EvmPriceServiceConnection } from '@perennial/pyth-evm-js'
import { Address, Hex, PublicClient, encodeFunctionData, getAddress } from 'viem'

import { MultiInvokerAbi, PythFactoryAbi } from '../..'
import { OrderTypes, PositionSide, SupportedChainId, TriggerComparison, addressToAsset } from '../../constants'
import { ReferrerInterfaceFeeInfo, interfaceFeeBps } from '../../constants'
import { MultiInvokerAddresses, PythFactoryAddresses } from '../../constants/contracts'
import { MultiInvokerAction } from '../../types/perennial'
import { Big6Math, BigOrZero, notEmpty, nowSeconds } from '../../utils'
import {
  EmptyInterfaceFee,
  buildCancelOrder,
  buildCommitPrice,
  buildPlaceTriggerOrder,
  buildUpdateMarket,
} from '../../utils/multiinvoker'
import { calcInterfaceFee } from '../../utils/positionUtils'
import { buildCommitmentsForOracles, getRecentVaa } from '../../utils/pythUtils'
import { getMultiInvokerContract, getOracleContract } from '../contracts'
import { MarketOracles, MarketSnapshots, fetchMarketOracles, fetchMarketSnapshots } from './chain'
import { OrderExecutionDeposit } from './constants'
import { OpenOrder } from './graph'

type WithChainIdAndPublicClient = {
  chainId: SupportedChainId
  publicClient: PublicClient
}

export type BuildModifyPositionTxArgs = {
  marketAddress: Address
  marketSnapshots?: MarketSnapshots
  marketOracles?: MarketOracles
  pythClient: EvmPriceServiceConnection
  address: Address
  collateralDelta?: bigint
  positionAbs?: bigint
  positionSide?: PositionSide
  stopLoss?: bigint
  takeProfit?: bigint
  settlementFee?: bigint
  cancelOrderDetails?: OpenOrder[]
  absDifferenceNotional?: bigint
  interfaceFee?: { interfaceFee: bigint; referrerFee: bigint; ecosystemFee: bigint }
  interfaceFeeRate?: typeof interfaceFeeBps
  referralFeeRate?: ReferrerInterfaceFeeInfo
  onCommitmentError?: () => any
} & WithChainIdAndPublicClient

export async function buildModifyPositionTx({
  chainId,
  publicClient,
  marketAddress,
  marketSnapshots,
  marketOracles,
  pythClient,
  address,
  positionSide,
  positionAbs,
  collateralDelta,
  stopLoss,
  takeProfit,
  settlementFee,
  cancelOrderDetails,
  absDifferenceNotional,
  interfaceFee,
  interfaceFeeRate = interfaceFeeBps,
  referralFeeRate,
  onCommitmentError,
}: BuildModifyPositionTxArgs) {
  const multiInvoker = getMultiInvokerContract(chainId, publicClient)

  if (!marketOracles) {
    marketOracles = await fetchMarketOracles(chainId, publicClient)
  }

  if (!marketSnapshots) {
    marketSnapshots = await fetchMarketSnapshots({
      publicClient,
      chainId,
      address,
      marketOracles,
      pythClient,
    })
  }

  let cancelOrders: { action: number; args: `0x${string}` }[] = []

  if (cancelOrderDetails?.length) {
    cancelOrders = cancelOrderDetails.map(({ market, nonce }) =>
      buildCancelOrder({ market: getAddress(market), nonce: BigInt(nonce) }),
    )
  }

  const oracleInfo = Object.values(marketOracles).find((o) => o.marketAddress === marketAddress)
  if (!oracleInfo) return

  const asset = addressToAsset(marketAddress)

  // Interface fee
  const interfaceFees: Array<typeof EmptyInterfaceFee> = []
  const feeRate = positionSide ? interfaceFeeBps[chainId].feeAmount[positionSide] : 0n
  const tradeFeeBips =
    absDifferenceNotional && interfaceFee?.interfaceFee
      ? Big6Math.div(interfaceFee.interfaceFee, absDifferenceNotional)
      : 0n
  if (interfaceFee?.interfaceFee && tradeFeeBips <= Big6Math.mul(feeRate, Big6Math.fromFloatString('1.05'))) {
    const referrerFee = interfaceFee.referrerFee
    const ecosystemFee = interfaceFee.ecosystemFee

    // If there is a referrer fee, send it to the referrer as USDC
    if (referralFeeRate && referrerFee > 0n)
      interfaceFees.push({
        unwrap: true,
        receiver: getAddress(referralFeeRate.referralTarget),
        amount: referrerFee,
      })

    if (ecosystemFee > 0n) {
      interfaceFees.push({
        unwrap: false, // default recipient holds DSU
        receiver: interfaceFeeRate[chainId].feeRecipientAddress,
        amount: ecosystemFee,
      })
    }
  } else if (tradeFeeBips > Big6Math.mul(feeRate, Big6Math.fromFloatString('1.05'))) {
    console.error('Fee exceeds rate - waiving.', address)
  }

  const updateAction = buildUpdateMarket({
    market: marketAddress,
    maker: positionSide === PositionSide.maker ? positionAbs : undefined, // Absolute position size
    long: positionSide === PositionSide.long ? positionAbs : undefined,
    short: positionSide === PositionSide.short ? positionAbs : undefined,
    collateral: collateralDelta ?? 0n, // Delta collateral
    wrap: true,
    interfaceFee: interfaceFees.at(0),
    interfaceFee2: interfaceFees.at(1),
  })

  const isNotMaker = positionSide !== PositionSide.maker && positionSide !== PositionSide.none
  let stopLossAction
  if (stopLoss && positionSide && isNotMaker && settlementFee) {
    const stopLossInterfaceFee = calcInterfaceFee({
      chainId,
      latestPrice: stopLoss,
      side: positionSide,
      referrerInterfaceFeeDiscount: referralFeeRate?.discount ?? 0n,
      referrerInterfaceFeeShare: referralFeeRate?.share ?? 0n,
      positionDelta: positionAbs ?? 0n,
    })
    stopLossAction = buildPlaceTriggerOrder({
      market: marketAddress,
      side: positionSide,
      triggerPrice: stopLoss,
      comparison: positionSide === PositionSide.short ? 'gte' : 'lte',
      maxFee: settlementFee * 2n,
      delta: -(positionAbs ?? 0n),
      interfaceFee:
        referralFeeRate && stopLossInterfaceFee.referrerFee
          ? {
              unwrap: true,
              receiver: getAddress(referralFeeRate.referralTarget),
              amount: stopLossInterfaceFee.referrerFee,
            }
          : undefined,
      interfaceFee2:
        stopLossInterfaceFee.ecosystemFee > 0n
          ? {
              unwrap: false,
              receiver: interfaceFeeRate[chainId].feeRecipientAddress,
              amount: stopLossInterfaceFee.ecosystemFee,
            }
          : undefined,
    })
  }

  let takeProfitAction
  if (takeProfit && positionSide && isNotMaker && settlementFee) {
    const takeProfitInterfaceFee = calcInterfaceFee({
      chainId,
      latestPrice: takeProfit,
      side: positionSide,
      referrerInterfaceFeeDiscount: referralFeeRate?.discount ?? 0n,
      referrerInterfaceFeeShare: referralFeeRate?.share ?? 0n,
      positionDelta: positionAbs ?? 0n,
    })

    takeProfitAction = buildPlaceTriggerOrder({
      market: marketAddress,
      side: positionSide,
      triggerPrice: takeProfit,
      comparison: positionSide === PositionSide.short ? 'lte' : 'gte',
      delta: -(positionAbs ?? 0n),
      maxFee: settlementFee * 2n,
      interfaceFee:
        referralFeeRate && takeProfitInterfaceFee.referrerFee
          ? {
              unwrap: true,
              receiver: getAddress(referralFeeRate.referralTarget),
              amount: takeProfitInterfaceFee.referrerFee,
            }
          : undefined,
      interfaceFee2:
        takeProfitInterfaceFee.ecosystemFee > 0n
          ? {
              unwrap: false,
              receiver: interfaceFeeRate[chainId].feeRecipientAddress,
              amount: takeProfitInterfaceFee.ecosystemFee,
            }
          : undefined,
    })
  }

  const actions: MultiInvokerAction[] = [updateAction, stopLossAction, takeProfitAction, ...cancelOrders].filter(
    notEmpty,
  )

  // Default to price being stale if we don't have any market snapshots
  let isPriceStale = true
  const marketSnapshot = asset && marketSnapshots?.market[asset]
  if (marketSnapshot && marketSnapshots) {
    const {
      parameter: { maxPendingGlobal, maxPendingLocal },
      riskParameter: { staleAfter },
      pendingPositions,
    } = marketSnapshot
    const lastUpdated = await getOracleContract(oracleInfo.address, publicClient).read.latest()
    isPriceStale = BigInt(nowSeconds()) - lastUpdated.timestamp > staleAfter / 2n
    // If there is a backlog of pending positions, we need to commit the price
    isPriceStale = isPriceStale || BigInt(pendingPositions.length) >= maxPendingGlobal
    // If there is a backlog of pending positions for this user, we need to commit the price
    isPriceStale = isPriceStale || BigOrZero(marketSnapshots.user?.[asset]?.pendingPositions?.length) >= maxPendingLocal
  }

  // Only add the price commit if the price is stale
  if (isPriceStale) {
    const [{ version, ids, value, updateData }] = await buildCommitmentsForOracles({
      chainId,
      pyth: pythClient,
      publicClient,
      marketOracles: [oracleInfo],
      onError: onCommitmentError,
    })
    const commitAction = buildCommitPrice({
      keeperFactory: oracleInfo.providerFactoryAddress,
      version,
      value,
      ids,
      vaa: updateData,
      revertOnFailure: false,
    })

    actions.unshift(commitAction)
  }
  const data = encodeFunctionData({
    functionName: 'invoke',
    abi: multiInvoker.abi,
    args: [actions],
  })
  return {
    data,
    to: multiInvoker.address,
    value: 1n,
  }
}

export type BuildSubmitVaaTxArgs = {
  chainId: SupportedChainId
  pythClient: EvmPriceServiceConnection
  marketAddress: Address
  marketSnapshots: MarketSnapshots
  marketOracles: MarketOracles
  address: Address
}

export async function buildSubmitVaaTx({ chainId, marketAddress, marketOracles, pythClient }: BuildSubmitVaaTxArgs) {
  const oracleInfo = Object.values(marketOracles).find((o) => o.marketAddress === marketAddress)
  if (!oracleInfo) return

  const [{ version, vaa }] = await getRecentVaa({
    pyth: pythClient,
    feeds: [oracleInfo],
  })

  const data = encodeFunctionData({
    functionName: 'commit',
    abi: PythFactoryAbi,
    args: [[oracleInfo.providerId], version, vaa as Hex],
  })
  return {
    data,
    to: PythFactoryAddresses[chainId],
    value: 1n,
  }
}

export type BuildPlaceOrderTxArgs = {
  pythClient: EvmPriceServiceConnection
  address: Address
  marketOracles?: MarketOracles
  marketAddress: Address
  marketSnapshots?: MarketSnapshots
  orderType: OrderTypes
  limitPrice?: bigint
  stopLoss?: bigint
  takeProfit?: bigint
  side: PositionSide
  collateralDelta?: bigint
  delta: bigint
  positionAbs: bigint
  selectedLimitComparison?: TriggerComparison
  referralFeeRate?: ReferrerInterfaceFeeInfo
  interfaceFeeRate?: typeof interfaceFeeBps
  cancelOrderDetails?: { market: Address; nonce: bigint }
  onCommitmentError?: () => any
} & WithChainIdAndPublicClient

export async function buildPlaceOrderTx({
  address,
  chainId,
  pythClient,
  marketOracles,
  publicClient,
  marketAddress,
  orderType,
  limitPrice,
  marketSnapshots,
  collateralDelta,
  stopLoss,
  takeProfit,
  side,
  delta = 0n,
  positionAbs,
  selectedLimitComparison,
  cancelOrderDetails,
  referralFeeRate,
  interfaceFeeRate = interfaceFeeBps,
  onCommitmentError,
}: BuildPlaceOrderTxArgs) {
  if (!address || !chainId || !pythClient) {
    return
  }

  if (!marketOracles) {
    marketOracles = await fetchMarketOracles(chainId, publicClient)
  }

  if (!marketSnapshots) {
    marketSnapshots = await fetchMarketSnapshots({
      publicClient,
      chainId,
      address,
      marketOracles,
      pythClient,
    })
  }

  const multiInvoker = getMultiInvokerContract(chainId, publicClient)

  let cancelAction
  let updateAction
  let limitOrderAction
  let stopLossAction
  let takeProfitAction

  if (cancelOrderDetails) {
    cancelAction = buildCancelOrder(cancelOrderDetails)
  }
  const asset = addressToAsset(marketAddress)
  const marketSnapshot = asset && marketSnapshots?.market[asset]

  if (orderType === OrderTypes.limit && limitPrice) {
    if (collateralDelta) {
      updateAction = buildUpdateMarket({
        market: marketAddress,
        maker: undefined,
        long: undefined,
        short: undefined,
        collateral: collateralDelta,
        wrap: true,
      })
    }
    const comparison = selectedLimitComparison ? selectedLimitComparison : side === PositionSide.long ? 'lte' : 'gte'
    const limitInterfaceFee = calcInterfaceFee({
      chainId,
      latestPrice:
        // Set interface fee price as latest price if order will execute immediately (as a market order)
        comparison === 'lte'
          ? Big6Math.min(limitPrice, marketSnapshot?.global.latestPrice ?? 0n)
          : Big6Math.max(limitPrice, marketSnapshot?.global.latestPrice ?? 0n),
      side,
      referrerInterfaceFeeDiscount: referralFeeRate?.discount ?? 0n,
      referrerInterfaceFeeShare: referralFeeRate?.share ?? 0n,
      positionDelta: delta,
    })
    limitOrderAction = buildPlaceTriggerOrder({
      market: marketAddress,
      side: side as PositionSide.long | PositionSide.short,
      triggerPrice: limitPrice,
      comparison,
      maxFee: OrderExecutionDeposit,
      delta,
      interfaceFee:
        referralFeeRate && limitInterfaceFee.referrerFee
          ? {
              unwrap: true,
              receiver: getAddress(referralFeeRate.referralTarget),
              amount: limitInterfaceFee.referrerFee,
            }
          : undefined,
      interfaceFee2:
        limitInterfaceFee.ecosystemFee > 0n
          ? {
              unwrap: false,
              receiver: interfaceFeeRate[chainId].feeRecipientAddress,
              amount: limitInterfaceFee.ecosystemFee,
            }
          : undefined,
    })
  }

  if (stopLoss && orderType !== OrderTypes.takeProfit) {
    const stopLossDelta = orderType === OrderTypes.limit ? -positionAbs : delta
    const stopLossInterfaceFee = calcInterfaceFee({
      chainId,
      latestPrice: stopLoss,
      side,
      referrerInterfaceFeeDiscount: referralFeeRate?.discount ?? 0n,
      referrerInterfaceFeeShare: referralFeeRate?.share ?? 0n,
      positionDelta: stopLossDelta,
    })
    stopLossAction = buildPlaceTriggerOrder({
      market: marketAddress,
      side: side as PositionSide.long | PositionSide.short,
      triggerPrice: stopLoss,
      comparison: side === PositionSide.short ? 'gte' : 'lte',
      maxFee: OrderExecutionDeposit,
      delta: stopLossDelta,
      interfaceFee:
        referralFeeRate && stopLossInterfaceFee.referrerFee
          ? {
              unwrap: true,
              receiver: getAddress(referralFeeRate.referralTarget),
              amount: stopLossInterfaceFee.referrerFee,
            }
          : undefined,
      interfaceFee2:
        stopLossInterfaceFee.ecosystemFee > 0n
          ? {
              unwrap: false,
              receiver: interfaceFeeBps[chainId].feeRecipientAddress,
              amount: stopLossInterfaceFee.ecosystemFee,
            }
          : undefined,
    })
  }

  if (takeProfit && orderType !== OrderTypes.stopLoss) {
    const takeProfitDelta = orderType === OrderTypes.limit ? -positionAbs : delta

    const takeProfitInterfaceFee = calcInterfaceFee({
      chainId,
      latestPrice: takeProfit,
      side,
      referrerInterfaceFeeDiscount: referralFeeRate?.discount ?? 0n,
      referrerInterfaceFeeShare: referralFeeRate?.share ?? 0n,
      positionDelta: takeProfitDelta,
    })

    takeProfitAction = buildPlaceTriggerOrder({
      market: marketAddress,
      side: side as PositionSide.long | PositionSide.short,
      triggerPrice: takeProfit,
      comparison: side === PositionSide.short ? 'lte' : 'gte',
      maxFee: OrderExecutionDeposit,
      delta: takeProfitDelta,
      interfaceFee:
        referralFeeRate && takeProfitInterfaceFee.referrerFee
          ? {
              unwrap: true,
              receiver: getAddress(referralFeeRate.referralTarget),
              amount: takeProfitInterfaceFee.referrerFee,
            }
          : undefined,
      interfaceFee2:
        takeProfitInterfaceFee.ecosystemFee > 0n
          ? {
              unwrap: false,
              receiver: interfaceFeeBps[chainId].feeRecipientAddress,
              amount: takeProfitInterfaceFee.ecosystemFee,
            }
          : undefined,
    })
  }

  const actions: MultiInvokerAction[] = [
    cancelAction,
    updateAction,
    limitOrderAction,
    stopLossAction,
    takeProfitAction,
  ].filter(notEmpty)

  if (orderType === OrderTypes.limit && collateralDelta) {
    const oracleInfo = Object.values(marketOracles).find((o) => o.marketAddress === marketAddress)
    if (!oracleInfo) return
    const asset = addressToAsset(marketAddress)
    let isPriceStale = false
    if (marketSnapshot && marketSnapshots && asset) {
      const {
        parameter: { maxPendingGlobal, maxPendingLocal },
        riskParameter: { staleAfter },
        pendingPositions,
      } = marketSnapshot
      const lastUpdated = await getOracleContract(oracleInfo.address, publicClient).read.latest()
      isPriceStale = BigInt(nowSeconds()) - lastUpdated.timestamp > staleAfter / 2n
      // If there is a backlog of pending positions, we need to commit the price
      isPriceStale = isPriceStale || BigInt(pendingPositions.length) >= maxPendingGlobal
      // If there is a backlog of pending positions for this user, we need to commit the price
      isPriceStale =
        isPriceStale || BigOrZero(marketSnapshots.user?.[asset]?.pendingPositions?.length) >= maxPendingLocal
    }

    // Only add the price commit if the price is stale
    if (isPriceStale) {
      const [{ version, ids, value, updateData }] = await buildCommitmentsForOracles({
        chainId,
        pyth: pythClient,
        publicClient,
        marketOracles: [oracleInfo],
        onError: onCommitmentError,
      })

      const commitAction = buildCommitPrice({
        keeperFactory: oracleInfo.providerAddress,
        version,
        value,
        ids,
        vaa: updateData,
        revertOnFailure: false,
      })

      actions.unshift(commitAction)
    }
  }

  const data = encodeFunctionData({
    functionName: 'invoke',
    abi: multiInvoker.abi,
    args: [actions],
  })
  return {
    data,
    to: multiInvoker.address,
    value: 1n,
  }
}

export function buildCancelOrderTx({
  chainId,
  orderDetails,
}: {
  chainId: SupportedChainId
  orderDetails: [Address, bigint][]
}) {
  const actions: MultiInvokerAction[] = orderDetails.map(([market, nonce]) =>
    buildCancelOrder({
      market,
      nonce,
    }),
  )
  const data = encodeFunctionData({
    functionName: 'invoke',
    abi: MultiInvokerAbi,
    args: [actions],
  })
  return {
    data,
    to: MultiInvokerAddresses[chainId],
    value: 0n,
  }
}
