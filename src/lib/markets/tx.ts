import { EvmPriceServiceConnection } from '@perennial/pyth-evm-js'
import { Address, Hex, PublicClient, encodeFunctionData, getAddress } from 'viem'

import { MarketAbi, MultiInvokerAbi, PythFactoryAbi } from '../..'
import { PositionSide, SupportedChainId, TriggerComparison, addressToAsset } from '../../constants'
import { InterfaceFee } from '../../constants'
import { MultiInvokerAddresses, PythFactoryAddresses } from '../../constants/contracts'
import { MultiInvokerAction } from '../../types/perennial'
import { BigOrZero, nowSeconds } from '../../utils'
import { buildCancelOrder, buildCommitPrice, buildPlaceTriggerOrder, buildUpdateMarket } from '../../utils/multiinvoker'
import { buildCommitmentsForOracles, getRecentVaa } from '../../utils/pythUtils'
import { getMultiInvokerContract, getOracleContract } from '../contracts'
import { MarketOracles, MarketSnapshots, fetchMarketOracles, fetchMarketSnapshots } from './chain'
import { OrderExecutionDeposit } from './constants'
import { OpenOrder } from './graph'

export type WithChainIdAndPublicClient = {
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
  side: PositionSide
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
  const asset = addressToAsset(marketAddress)

  if (!asset) {
    throw new Error('Could not determine asset for market')
  }

  if (!marketOracles) {
    marketOracles = await fetchMarketOracles(chainId, publicClient, [asset])
  }

  if (!marketSnapshots) {
    marketSnapshots = await fetchMarketSnapshots({
      publicClient,
      chainId,
      address,
      marketOracles,
      pythClient,
      supportedMarkets: [asset],
    })
  }

  const oracleInfo = Object.values(marketOracles).find((o) => o.marketAddress === marketAddress)
  if (!oracleInfo) return

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

export type BuildTriggerOrderBaseArgs = {
  address: Address
  marketAddress: Address
  side: PositionSide
  delta: bigint
  maxFee?: bigint
  interfaceFee?: InterfaceFee
  referralFee?: InterfaceFee
} & WithChainIdAndPublicClient

export type BuildLimitOrderTxArgs = {
  limitPrice: bigint
  triggerComparison: TriggerComparison
} & BuildTriggerOrderBaseArgs

export async function buildLimitOrderTx({
  address,
  chainId,
  publicClient,
  marketAddress,
  limitPrice,
  side,
  delta = 0n,
  triggerComparison,
  interfaceFee,
  referralFee,
}: BuildLimitOrderTxArgs) {
  if (!address || !chainId || !publicClient) {
    return
  }

  const multiInvoker = getMultiInvokerContract(chainId, publicClient)

  const limitOrderAction = buildPlaceTriggerOrder({
    triggerPrice: limitPrice,
    side: side as PositionSide.long | PositionSide.short,
    interfaceFee,
    interfaceFee2: referralFee,
    delta,
    market: marketAddress,
    maxFee: OrderExecutionDeposit,
    comparison: triggerComparison,
  })

  const actions: MultiInvokerAction[] = [limitOrderAction]

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
  stopLossPrice: bigint
} & BuildTriggerOrderBaseArgs

export async function buildStopLossTx({
  address,
  chainId,
  marketAddress,
  stopLossPrice,
  side,
  delta = 0n,
  interfaceFee,
  referralFee,
  publicClient,
  maxFee,
}: BuildStopLossTxArgs) {
  if (delta > 0n) {
    throw new Error('Position delta must be negative for stop loss transactions')
  }
  const multiInvoker = getMultiInvokerContract(chainId, publicClient)

  const stopLossAction = buildPlaceTriggerOrder({
    triggerPrice: stopLossPrice,
    side: side as PositionSide.long | PositionSide.short,
    interfaceFee,
    interfaceFee2: referralFee,
    delta,
    market: marketAddress,
    maxFee: maxFee ?? OrderExecutionDeposit,
    comparison: side === PositionSide.short ? TriggerComparison.gte : TriggerComparison.lte,
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
  takeProfitPrice: bigint
} & BuildTriggerOrderBaseArgs

export async function buildTakeProfitTx({
  address,
  chainId,
  marketAddress,
  takeProfitPrice,
  side,
  delta = 0n,
  interfaceFee,
  referralFee,
  publicClient,
  maxFee,
}: BuildTakeProfitTxArgs) {
  if (delta > 0n) {
    throw new Error('Position delta must be negative for take profit transactions')
  }
  const multiInvoker = getMultiInvokerContract(chainId, publicClient)

  const takeProfitAction = buildPlaceTriggerOrder({
    triggerPrice: takeProfitPrice,
    side: side as PositionSide.long | PositionSide.short,
    interfaceFee,
    interfaceFee2: referralFee,
    delta,
    market: marketAddress,
    maxFee: maxFee ?? OrderExecutionDeposit,
    comparison: side === PositionSide.short ? TriggerComparison.lte : TriggerComparison.gte,
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

export type BuildClaimFeeTxArgs = {
  marketAddress: Address
}
export function buildClaimFeeTx({ marketAddress }: BuildClaimFeeTxArgs) {
  const data = encodeFunctionData({
    functionName: 'claimFee',
    abi: MarketAbi,
  })
  return {
    data,
    to: marketAddress,
    value: 0n,
  }
}
