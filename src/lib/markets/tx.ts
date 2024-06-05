import { EvmPriceServiceConnection } from '@perennial/pyth-evm-js'
import { Address, Hex, PublicClient, encodeFunctionData, getAddress } from 'viem'

import { MultiInvokerAbi, PythFactoryAbi } from '../..'
import { OrderTypes, PositionSide, SupportedChainId, TriggerComparison, addressToAsset } from '../../constants'
import { InterfaceFee } from '../../constants'
import { MultiInvokerAddresses, PythFactoryAddresses } from '../../constants/contracts'
import { MultiInvokerAction } from '../../types/perennial'
import { BigOrZero, notEmpty, nowSeconds } from '../../utils'
import { buildCancelOrder, buildCommitPrice, buildPlaceTriggerOrder, buildUpdateMarket } from '../../utils/multiinvoker'
import { buildCommitmentsForOracles, getRecentVaa } from '../../utils/pythUtils'
import { getMultiInvokerContract, getOracleContract } from '../contracts'
import { MarketOracles, MarketSnapshots, fetchMarketOracles, fetchMarketSnapshots } from './chain'
import { OrderExecutionDeposit } from './constants'
import { OpenOrder } from './graph'

type WithChainIdAndPublicClient = {
  chainId: SupportedChainId
  publicClient: PublicClient
}

export type BuildUpdateMarketTxArgs = {
  marketAddress: Address
  marketSnapshots?: MarketSnapshots
  marketOracles?: MarketOracles
  pythClient: EvmPriceServiceConnection
  address: Address
  collateralDelta?: bigint
  positionAbs?: bigint
  side?: PositionSide
  interfaceFee?: InterfaceFee
  referralFee?: InterfaceFee
  onCommitmentError?: () => any
} & WithChainIdAndPublicClient

export async function buildUpdateMarketTx({
  chainId,
  publicClient,
  marketAddress,
  marketSnapshots,
  marketOracles,
  pythClient,
  address,
  side,
  positionAbs = 0n,
  collateralDelta,
  interfaceFee,
  referralFee,
  onCommitmentError,
}: BuildUpdateMarketTxArgs) {
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

  const oracleInfo = Object.values(marketOracles).find((o) => o.marketAddress === marketAddress)
  if (!oracleInfo) return

  const asset = addressToAsset(marketAddress)

  const updateAction = buildUpdateMarket({
    market: marketAddress,
    maker: side === PositionSide.maker ? positionAbs : undefined, // Absolute position size
    long: side === PositionSide.long ? positionAbs : undefined,
    short: side === PositionSide.short ? positionAbs : undefined,
    collateral: collateralDelta ?? 0n, // Delta collateral
    wrap: true,
    interfaceFee: referralFee,
    interfaceFee2: interfaceFee,
  })

  const actions: MultiInvokerAction[] = [updateAction]

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
    args: [address, actions],
  })
  return {
    data,
    to: multiInvoker.address,
    value: 1n,
  }
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
  interfaceFee?: InterfaceFee
  referralFee?: InterfaceFee
  onCommitmentError?: () => any
} & WithChainIdAndPublicClient

export type BuildSubmitVaaTxArgs = {
  chainId: SupportedChainId
  pythClient: EvmPriceServiceConnection
  marketAddress: Address
  marketOracles: MarketOracles
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

export type CancelOrderDetails = { market: Address; nonce: bigint } | OpenOrder

type BuildTriggerOrderBaseArgs = {
  address: Address
  marketAddress: Address
  side: PositionSide
  delta: bigint
  selectedLimitComparison?: TriggerComparison
  pythClient: EvmPriceServiceConnection
  marketOracles?: MarketOracles
  marketSnapshots?: MarketSnapshots
  maxFee?: bigint
  interfaceFee?: InterfaceFee
  referralFee?: InterfaceFee
  onCommitmentError?: () => any
} & WithChainIdAndPublicClient

export type BuildLimitOrderTxArgs = {
  limitPrice: bigint
  collateralDelta?: bigint
} & BuildTriggerOrderBaseArgs

export async function buildLimitOrderTx({
  address,
  chainId,
  pythClient,
  marketOracles,
  publicClient,
  marketAddress,
  limitPrice,
  marketSnapshots,
  collateralDelta,
  side,
  delta = 0n,
  selectedLimitComparison,
  interfaceFee,
  referralFee,
  onCommitmentError,
}: BuildLimitOrderTxArgs) {
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
  const asset = addressToAsset(marketAddress)
  const marketSnapshot = asset && marketSnapshots?.market[asset]

  let updateAction

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
  const comparison = selectedLimitComparison
    ? selectedLimitComparison
    : side === PositionSide.long
      ? TriggerComparison.lte
      : TriggerComparison.gte

  const limitOrderAction = buildTriggerOrder({
    price: limitPrice,
    positionSide: side as PositionSide.long | PositionSide.short,
    interfaceFee,
    referralFee,
    positionDelta: delta,
    marketAddress,
    maxFee: OrderExecutionDeposit,
    triggerComparison: comparison,
  })

  const actions: MultiInvokerAction[] = [updateAction, limitOrderAction].filter(notEmpty)

  if (collateralDelta) {
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
    args: [address, actions],
  })
  return {
    data,
    to: multiInvoker.address,
    value: 1n,
  }
}

export type BuildStopLossTxArgs = {
  stopLoss: bigint
} & BuildTriggerOrderBaseArgs

export async function buildStopLossTx({
  address,
  chainId,
  marketAddress,
  stopLoss,
  side,
  delta = 0n,
  interfaceFee,
  referralFee,
  publicClient,
  maxFee,
}: BuildStopLossTxArgs) {
  const multiInvoker = getMultiInvokerContract(chainId, publicClient)

  const stopLossAction = buildTriggerOrder({
    price: stopLoss,
    positionSide: side as PositionSide.long | PositionSide.short,
    interfaceFee,
    referralFee,
    positionDelta: delta,
    marketAddress,
    maxFee: maxFee ?? OrderExecutionDeposit,
    triggerComparison: side === PositionSide.short ? TriggerComparison.gte : TriggerComparison.lte,
  })
  const actions: MultiInvokerAction[] = [stopLossAction]

  const data = encodeFunctionData({
    functionName: 'invoke',
    abi: multiInvoker.abi,
    args: [address, actions],
  })

  return {
    data,
    to: multiInvoker.address,
    value: 1n,
  }
}

export type BuildTakeProfitTxArgs = {
  takeProfit: bigint
} & BuildTriggerOrderBaseArgs

export async function buildTakeProfitTx({
  address,
  chainId,
  marketAddress,
  takeProfit,
  side,
  delta = 0n,
  interfaceFee,
  referralFee,
  publicClient,
  maxFee,
}: BuildTakeProfitTxArgs) {
  const multiInvoker = getMultiInvokerContract(chainId, publicClient)

  const takeProfitAction = buildTriggerOrder({
    price: takeProfit,
    positionSide: side as PositionSide.long | PositionSide.short,
    interfaceFee,
    referralFee,
    positionDelta: delta,
    marketAddress,
    maxFee: maxFee ?? OrderExecutionDeposit,
    triggerComparison: side === PositionSide.short ? TriggerComparison.lte : TriggerComparison.gte,
  })
  const actions: MultiInvokerAction[] = [takeProfitAction]

  const data = encodeFunctionData({
    functionName: 'invoke',
    abi: multiInvoker.abi,
    args: [address, actions],
  })

  return {
    data,
    to: multiInvoker.address,
    value: 1n,
  }
}

export type BuildPlaceOrderTxArgs = {
  orderType: OrderTypes
  limitPrice?: bigint
  stopLoss?: bigint
  takeProfit?: bigint
  collateralDelta?: bigint
  positionAbs: bigint
} & BuildTriggerOrderBaseArgs

function buildCancelOrderActions(orders: CancelOrderDetails[]) {
  return orders.map(({ market, nonce }) => {
    const marketAddress = getAddress(market)
    const formattedNonce = BigInt(nonce)
    return buildCancelOrder({ market: marketAddress, nonce: formattedNonce })
  })
}

export type BuildCancelOrderTxArgs = {
  chainId: SupportedChainId
  address: Address
  orderDetails: CancelOrderDetails[]
}
export function buildCancelOrderTx({ chainId, address, orderDetails }: BuildCancelOrderTxArgs) {
  const actions: MultiInvokerAction[] = buildCancelOrderActions(orderDetails)

  const data = encodeFunctionData({
    functionName: 'invoke',
    abi: MultiInvokerAbi,
    args: [address, actions],
  })
  return {
    data,
    to: MultiInvokerAddresses[chainId],
    value: 0n,
  }
}

export type BuildTriggerOrderArgs = {
  price: bigint
  positionSide: PositionSide.long | PositionSide.short
  interfaceFee?: InterfaceFee
  referralFee?: InterfaceFee
  positionDelta: bigint
  marketAddress: Address
  maxFee: bigint
  triggerComparison: TriggerComparison
}

export function buildTriggerOrder({
  price,
  positionSide,
  interfaceFee,
  referralFee,
  positionDelta,
  marketAddress,
  maxFee,
  triggerComparison,
}: BuildTriggerOrderArgs) {
  return buildPlaceTriggerOrder({
    market: marketAddress,
    side: positionSide,
    triggerPrice: price,
    comparison: triggerComparison,
    maxFee,
    delta: positionDelta,
    interfaceFee,
    interfaceFee2: referralFee,
  })
}
