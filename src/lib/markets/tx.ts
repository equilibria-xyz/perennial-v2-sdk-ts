import { EvmPriceServiceConnection } from '@perennial/pyth-evm-js'
import { Address, Hex, PublicClient, WalletClient, encodeFunctionData, getAddress, zeroAddress } from 'viem'

import {
  MaxUint256,
  OrderTypes,
  PositionSideV2,
  SupportedChainId,
  TriggerComparison,
  addressToAsset2,
  chainIdToChainMap,
} from '../../constants'
import { ReferrerInterfaceFeeInfo, interfaceFeeBps } from '../../constants'
import { MultiInvokerV2Addresses } from '../../constants/contracts'
import { MultiInvoker2Action } from '../../types/perennial'
import { Big6Math, BigOrZero, getOracleContract, notEmpty, nowSeconds } from '../../utils'
import {
  EmptyInterfaceFee,
  buildCancelOrder,
  buildCommitPrice,
  buildPlaceTriggerOrder,
  buildUpdateMarket,
} from '../../utils/multiinvokerV2'
import { calcInterfaceFee } from '../../utils/positionUtils'
import { buildCommitmentsForOracles, getRecentVaa } from '../../utils/pythUtils'
import { getMultiInvokerV2Contract, getPythFactoryContract, getUSDCContract } from '../contracts'
import { MarketOracles, MarketSnapshots, fetchMarketOraclesV2, fetchMarketSnapshotsV2 } from './chain'
import { OrderExecutionDeposit } from './constants'
import { OpenOrder } from './graph'

export function getMarketTransactionBuilders({
  chainId,
  publicClient,
  productAddress,
  marketSnapshots,
  marketOracles,
  pythClient,
  address,
}: {
  chainId: SupportedChainId
  publicClient: PublicClient
  productAddress: Address
  marketSnapshots?: MarketSnapshots
  marketOracles?: MarketOracles
  pythClient: EvmPriceServiceConnection
  address: Address
}) {
  const approveUSDC = async (suggestedAmount: bigint = MaxUint256) => {
    const usdcContract = getUSDCContract(chainId, publicClient)
    const callData = encodeFunctionData({
      functionName: 'approve',
      abi: usdcContract.abi,
      args: [MultiInvokerV2Addresses[chainId], Big6Math.abs(suggestedAmount)],
    })

    return {
      callData,
      to: usdcContract.address,
      value: 0n,
    }
  }

  async function modifyPosition({
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
  }: {
    collateralDelta?: bigint
    positionAbs?: bigint
    positionSide?: PositionSideV2
    stopLoss?: bigint
    takeProfit?: bigint
    settlementFee?: bigint
    cancelOrderDetails?: OpenOrder[]
    absDifferenceNotional?: bigint
    interfaceFee?: { interfaceFee: bigint; referrerFee: bigint; ecosystemFee: bigint }
    interfaceFeeRate?: typeof interfaceFeeBps
    referralFeeRate?: ReferrerInterfaceFeeInfo
    onCommitmentError?: () => any
  }) {
    const multiInvoker = getMultiInvokerV2Contract(chainId, publicClient)

    if (!marketOracles) {
      marketOracles = await fetchMarketOraclesV2(chainId, publicClient)
    }

    if (!marketSnapshots) {
      marketSnapshots = await fetchMarketSnapshotsV2({
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

    const oracleInfo = Object.values(marketOracles).find((o) => o.marketAddress === productAddress)
    if (!oracleInfo) return

    const asset = addressToAsset2(productAddress)

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
      market: productAddress,
      maker: positionSide === PositionSideV2.maker ? positionAbs : undefined, // Absolute position size
      long: positionSide === PositionSideV2.long ? positionAbs : undefined,
      short: positionSide === PositionSideV2.short ? positionAbs : undefined,
      collateral: collateralDelta ?? 0n, // Delta collateral
      wrap: true,
      interfaceFee: interfaceFees.at(0),
      interfaceFee2: interfaceFees.at(1),
    })

    const isNotMaker = positionSide !== PositionSideV2.maker && positionSide !== PositionSideV2.none
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
        market: productAddress,
        side: positionSide,
        triggerPrice: stopLoss,
        comparison: positionSide === PositionSideV2.short ? 'gte' : 'lte',
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
        market: productAddress,
        side: positionSide,
        triggerPrice: takeProfit,
        comparison: positionSide === PositionSideV2.short ? 'lte' : 'gte',
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

    const actions: MultiInvoker2Action[] = [updateAction, stopLossAction, takeProfitAction, ...cancelOrders].filter(
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
        keeperFactory: oracleInfo.providerFactoryAddress,
        version,
        value,
        ids,
        vaa: updateData,
        revertOnFailure: false,
      })

      actions.unshift(commitAction)
    }
    const callData = encodeFunctionData({
      functionName: 'invoke',
      abi: multiInvoker.abi,
      args: [actions],
    })
    return {
      callData,
      to: multiInvoker.address,
      value: 1n,
    }
  }

  const submitVaa = async () => {
    if (!address || !chainId || !marketOracles || !pythClient) {
      return
    }

    const oracleInfo = Object.values(marketOracles).find((o) => o.marketAddress === productAddress)
    if (!oracleInfo) return

    const [{ version, vaa }] = await getRecentVaa({
      pyth: pythClient,
      feeds: [oracleInfo],
    })

    const pythFactory = getPythFactoryContract(chainId, publicClient)
    const callData = encodeFunctionData({
      functionName: 'commit',
      abi: pythFactory.abi,
      args: [[oracleInfo.providerId], version, vaa as Hex],
    })
    return {
      callData,
      to: pythFactory.address,
      value: 1n,
    }
  }

  const placeOrder = async ({
    orderType,
    limitPrice,
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
  }: {
    orderType: OrderTypes
    limitPrice?: bigint
    stopLoss?: bigint
    takeProfit?: bigint
    side: PositionSideV2
    collateralDelta?: bigint
    delta: bigint
    positionAbs: bigint
    selectedLimitComparison?: TriggerComparison
    referralFeeRate?: ReferrerInterfaceFeeInfo
    interfaceFeeRate?: typeof interfaceFeeBps
    cancelOrderDetails?: { market: Address; nonce: bigint }
    onCommitmentError?: () => any
  }) => {
    if (!address || !chainId || !pythClient) {
      return
    }

    if (!marketOracles) {
      marketOracles = await fetchMarketOraclesV2(chainId, publicClient)
    }

    const multiInvoker = getMultiInvokerV2Contract(chainId, publicClient)

    let cancelAction
    let updateAction
    let limitOrderAction
    let stopLossAction
    let takeProfitAction

    if (cancelOrderDetails) {
      cancelAction = buildCancelOrder(cancelOrderDetails)
    }
    const asset = addressToAsset2(productAddress)
    const marketSnapshot = asset && marketSnapshots?.market[asset]

    if (orderType === OrderTypes.limit && limitPrice) {
      if (collateralDelta) {
        updateAction = buildUpdateMarket({
          market: productAddress,
          maker: undefined,
          long: undefined,
          short: undefined,
          collateral: collateralDelta,
          wrap: true,
        })
      }
      const comparison = selectedLimitComparison
        ? selectedLimitComparison
        : side === PositionSideV2.long
        ? 'lte'
        : 'gte'
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
        market: productAddress,
        side: side as PositionSideV2.long | PositionSideV2.short,
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
        market: productAddress,
        side: side as PositionSideV2.long | PositionSideV2.short,
        triggerPrice: stopLoss,
        comparison: side === PositionSideV2.short ? 'gte' : 'lte',
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
        market: productAddress,
        side: side as PositionSideV2.long | PositionSideV2.short,
        triggerPrice: takeProfit,
        comparison: side === PositionSideV2.short ? 'lte' : 'gte',
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

    const actions: MultiInvoker2Action[] = [
      cancelAction,
      updateAction,
      limitOrderAction,
      stopLossAction,
      takeProfitAction,
    ].filter(notEmpty)

    if (orderType === OrderTypes.limit && collateralDelta) {
      const oracleInfo = Object.values(marketOracles).find((o) => o.marketAddress === productAddress)
      if (!oracleInfo) return
      const asset = addressToAsset2(productAddress)
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

    const callData = encodeFunctionData({
      functionName: 'invoke',
      abi: multiInvoker.abi,
      args: [actions],
    })
    return {
      callData,
      to: multiInvoker.address,
      value: 1n,
    }
  }

  return {
    approveUSDC,
    modifyPosition,
    submitVaa,
    placeOrder,
  }
}

export function getMarketTransactions({
  chainId,
  publicClient,
  walletClient,
  productAddress,
  marketSnapshots,
  marketOracles,
  pythClient,
}: {
  chainId: SupportedChainId
  publicClient: PublicClient
  walletClient?: WalletClient
  productAddress: Address
  marketSnapshots?: MarketSnapshots
  marketOracles?: MarketOracles
  pythClient: EvmPriceServiceConnection
}) {
  const address = walletClient?.account?.address ?? zeroAddress

  const txOpts = { account: address, chainId, chain: chainIdToChainMap[chainId] }

  const transactionBuilders = getMarketTransactionBuilders({
    chainId,
    publicClient,
    productAddress,
    marketSnapshots,
    marketOracles,
    pythClient,
    address,
  })

  const approveUSDC = async (suggestedAmount: bigint = MaxUint256) => {
    if (!walletClient || !walletClient?.account?.address) throw new Error('No wallet client')
    const usdcContract = getUSDCContract(chainId, publicClient)
    const { callData, value, to } = await transactionBuilders.approveUSDC(suggestedAmount)
    const hash = await walletClient?.sendTransaction({
      data: callData,
      value,
      to,
      ...txOpts,
    })
    await publicClient.waitForTransactionReceipt({ hash })
    const newAllowance = await usdcContract.read.allowance([address, MultiInvokerV2Addresses[chainId]])
    return { hash, newAllowance }
  }

  const modifyPosition = async ({
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
    onError,
  }: {
    collateralDelta?: bigint
    positionAbs?: bigint
    positionSide?: PositionSideV2
    stopLoss?: bigint
    takeProfit?: bigint
    settlementFee?: bigint
    cancelOrderDetails?: OpenOrder[]
    absDifferenceNotional?: bigint
    interfaceFee?: { interfaceFee: bigint; referrerFee: bigint; ecosystemFee: bigint }
    interfaceFeeRate?: typeof interfaceFeeBps
    referralFeeRate?: ReferrerInterfaceFeeInfo
    onCommitmentError?: () => any
    onError?: (err: any) => any
  }) => {
    if (!walletClient || !walletClient?.account?.address) throw new Error('No wallet client')
    const transactionData = await transactionBuilders.modifyPosition({
      positionSide,
      positionAbs,
      collateralDelta,
      stopLoss,
      takeProfit,
      settlementFee,
      cancelOrderDetails,
      absDifferenceNotional,
      interfaceFee,
      interfaceFeeRate,
      referralFeeRate,
      onCommitmentError,
    })
    if (!transactionData) {
      console.error('Error building modifyPosition transaction data')
      return
    }
    try {
      const hash = await walletClient?.sendTransaction({
        data: transactionData.callData,
        value: transactionData.value,
        to: transactionData.to,
        ...txOpts,
      })
      await publicClient.waitForTransactionReceipt({ hash })
      return hash
    } catch (err) {
      console.error(err)
      if (onError) {
        onError(err)
      }
    }
  }

  const submitVaa = async () => {
    if (!walletClient || !walletClient?.account?.address) throw new Error('No wallet client')
    const transactionData = await transactionBuilders.submitVaa()
    if (!transactionData) {
      console.error('Error building submitVaa transaction data')
      return
    }
    try {
      const hash = await walletClient?.sendTransaction({
        data: transactionData.callData,
        value: transactionData.value,
        to: transactionData.to,
        ...txOpts,
      })
      await publicClient.waitForTransactionReceipt({ hash })
      return hash
    } catch (err) {
      console.error(err)
    }
  }

  const placeOrder = async ({
    orderType,
    limitPrice,
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
    onError,
  }: {
    orderType: OrderTypes
    limitPrice?: bigint
    stopLoss?: bigint
    takeProfit?: bigint
    side: PositionSideV2
    collateralDelta?: bigint
    delta: bigint
    settlementFee?: bigint
    positionAbs: bigint
    selectedLimitComparison?: TriggerComparison
    referralFeeRate?: ReferrerInterfaceFeeInfo
    interfaceFeeRate?: typeof interfaceFeeBps
    cancelOrderDetails?: { market: Address; nonce: bigint }
    onCommitmentError?: () => any
    onError?: (err: any) => any
  }) => {
    if (!walletClient || !walletClient?.account?.address) throw new Error('No wallet client')
    const transactionData = await transactionBuilders.placeOrder({
      orderType,
      limitPrice,
      collateralDelta,
      stopLoss,
      takeProfit,
      side,
      delta,
      positionAbs,
      selectedLimitComparison,
      referralFeeRate,
      interfaceFeeRate,
      cancelOrderDetails,
      onCommitmentError,
    })
    if (!transactionData) {
      console.error('Error building placeOrder transaction data')
      return
    }
    try {
      const hash = await walletClient.sendTransaction({
        data: transactionData.callData,
        value: transactionData.value,
        to: transactionData.to,
        ...txOpts,
      })
      await publicClient.waitForTransactionReceipt({ hash })
      return hash
    } catch (err) {
      console.error(err)
      if (onError) {
        onError(err)
      }
    }
  }

  return { approveUSDC, modifyPosition, submitVaa, placeOrder }
}

export function buildCancelOrderTxData({
  chainId,
  publicClient,
  orderDetails,
}: {
  chainId: SupportedChainId
  publicClient: PublicClient
  orderDetails: [Address, bigint][]
}) {
  const multiInvoker = getMultiInvokerV2Contract(chainId, publicClient)
  const actions: MultiInvoker2Action[] = orderDetails.map(([market, nonce]) =>
    buildCancelOrder({
      market,
      nonce,
    }),
  )
  const callData = encodeFunctionData({
    functionName: 'invoke',
    abi: multiInvoker.abi,
    args: [actions],
  })
  return {
    callData,
    to: multiInvoker.address,
    value: 1n,
  }
}

export async function cancelOrder({
  chainId,
  walletClient,
  publicClient,
  orderDetails,
  address,
}: {
  chainId: SupportedChainId
  walletClient?: WalletClient
  publicClient: PublicClient
  address: Address
  orderDetails: [Address, bigint][]
}) {
  if (!walletClient || !walletClient?.account?.address) throw new Error('No wallet client')
  const txOpts = { account: address, chainId, chain: chainIdToChainMap[chainId] }
  const transactionData = buildCancelOrderTxData({ chainId, publicClient, orderDetails })
  if (!transactionData) {
    console.error('Error building cancelOrder transaction data')
    return
  }
  try {
    const hash = await walletClient.sendTransaction({
      data: transactionData.callData,
      value: transactionData.value,
      to: transactionData.to,
      ...txOpts,
    })
    await publicClient.waitForTransactionReceipt({ hash })
    return hash
  } catch (err) {
    console.error(err)
  }
}
