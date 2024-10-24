import { GraphQLClient } from 'graphql-request'
import { Address, PublicClient, getAddress } from 'viem'

import {
  ChainMarkets,
  PositionSide,
  SupportedChainId,
  SupportedMarket,
  SupportedMarketMapping,
  addressToMarket,
  chainMarketsWithAddress,
} from '../../constants'
import {
  QueryAccountOrders,
  QueryLatestMarketAccountPosition,
  QueryMarketAccountMakerPositions,
  QueryMarketAccountPositionOrders,
  QueryMarketAccountTakerPositions,
  QueryMarketAccumulationData,
  QueryOpenTriggerOrders,
} from '../../graphQueries/markets'
import { Bucket, OrderDataFragment, PositionDataFragment } from '../../types/gql/graphql'
import { Day, last24hrBounds, nowSeconds } from '../../utils'
import {
  AccumulatorType,
  AccumulatorTypes,
  DefaultRealizedAccumulations,
  RealizedAccumulations,
  accumulateRealized,
  accumulateRealizedFees,
} from '../../utils/accumulatorUtils'
import { Big6Math, BigOrZero } from '../../utils/big6Utils'
import { GraphDefaultPageSize, queryAll } from '../../utils/graphUtils'
import {
  calcExecutionPriceWithImpact,
  calcNotional,
  calcTradeFee,
  magnitude,
  orderSize,
  side as positionSide,
} from '../../utils/positionUtils'
import { OracleClients } from '../oracle'
import { MarketOracles, MarketSnapshots, fetchMarketSettlementFees, fetchMarketSnapshots } from './chain'

/**
 * Fetches position PnL for a given market and Address
 * @param chainId {@link SupportedChainId}
 * @param markets List of {@link SupportedMarket}
 * @param marketSnapshots [Optional] Snapshots for markets {@link MarketSnapshots}
 * @param address Wallet Address
 * @param markToMarket [true] Whether to include latest market accumulations in the PNL calculations
 * @param publicClient Viem Public Client
 * @param oracleClients {@link OracleClients}
 * @param graphClient GraphQLClient
 * @returns User's PnL for an active position.
 */
export async function fetchActivePositionsPnl({
  markets,
  marketOracles,
  marketSnapshots,
  chainId,
  address,
  markToMarket = true,
  oracleClients,
  publicClient,
  graphClient,
}: {
  markets: SupportedMarket[]
  address: Address
  marketSnapshots?: MarketSnapshots
  marketOracles?: MarketOracles
  markToMarket?: boolean
  chainId: SupportedChainId
  oracleClients: OracleClients
  publicClient: PublicClient
  graphClient: GraphQLClient
}): Promise<
  SupportedMarketMapping<
    ProcessedGraphPosition & {
      realtime: bigint
      realtimePercent: bigint
      pendingMarkToMarketAccumulations: RealizedAccumulations | null
    }
  >
> {
  const missingMarketSnapshots = markets.some((m) => !marketSnapshots?.market[m] || !marketSnapshots?.user?.[m])
  if (missingMarketSnapshots) {
    marketSnapshots = await fetchMarketSnapshots({
      chainId,
      address,
      oracleClients,
      publicClient,
      markets,
      marketOracles,
    })
  }

  const marketSettlementFees = await fetchMarketSettlementFees({
    chainId,
    markets,
    marketOracles,
    publicClient,
  })

  const marketsWithAddresses = chainMarketsWithAddress(chainId, markets)
  const marketLatestVersions = marketsWithAddresses.map(({ market }) =>
    (marketSnapshots?.user?.[market]?.latestOrder.timestamp ?? 0n).toString(),
  )
  const { marketAccounts } = await graphClient.request(QueryLatestMarketAccountPosition, {
    account: address,
    markets: marketsWithAddresses.map(({ marketAddress }) => marketAddress),
    latestVersions: marketLatestVersions,
  })

  const positionPnls = marketsWithAddresses.map(({ market, marketAddress }) => {
    const marketSnapshot = marketSnapshots?.market[market]
    const userMarketSnapshot = marketSnapshots?.user?.[market]
    if (!marketSnapshot || !userMarketSnapshot) return null

    const [side, magnitude_] = [
      userMarketSnapshot.nextSide === 'none' ? userMarketSnapshot.side : userMarketSnapshot.nextSide,
      userMarketSnapshot.nextMagnitude,
    ]

    const pendingDelta =
      side !== 'none'
        ? userMarketSnapshot.pendingOrder[`${side}Pos`] - userMarketSnapshot.pendingOrder[`${side}Neg`]
        : 0n

    // Estimate the Trade Impact given market pre position
    const pendingTradeFeeData = calcTradeFee({
      positionDelta: pendingDelta,
      marketSnapshot,
      side: side,
      usePreGlobalPosition: pendingDelta !== 0n,
    })
    const pendingTradeImpactAsOffset = -1n * pendingTradeFeeData.tradeImpact.total
    const pendingOrderCollateral = userMarketSnapshot.pendingOrder.collateral
    const pendingOrderSettlementFee = marketSettlementFees[market].totalCost
    const pendingTradeFee = pendingTradeFeeData.tradeFee.total
    const pendingAdditiveFee = 0n

    const graphMarketAccount = marketAccounts.find((ma) => getAddress(ma.market.id) === marketAddress)
    const graphPosition = graphMarketAccount?.positions.at(0)

    // Pull position data from the graph if available
    if (graphMarketAccount && graphPosition) {
      const currentAccumulator = graphMarketAccount.accumulators.current.at(0)
      const startAccumulator = graphMarketAccount.accumulators.start.find(
        (sa) => BigInt(sa.fromVersion) === (marketSnapshots?.user?.[market]?.latestOrder.timestamp ?? 0n),
      )

      // Accumulate the portion of pnl from the latest account settlement to the latest global settlement
      const pendingMarkToMarketAccumulations = AccumulatorTypes.reduce((acc, { type, unrealizedKey }) => {
        if (!acc[type]) acc[type] = 0n
        if (side === 'none') return acc
        if (side !== 'maker' && type.startsWith('maker')) return acc

        // Some accumulations don't have global counterparts
        const unrealizedKeyForSide = unrealizedKey[side]

        // Pnl from latest account settlement to latest global settlement
        if (unrealizedKeyForSide && currentAccumulator && startAccumulator) {
          const latestToGlobalRealized = Big6Math.mul(
            BigInt(currentAccumulator[unrealizedKeyForSide]) - BigInt(startAccumulator[unrealizedKeyForSide]),
            magnitude_,
          )
          acc[type] += latestToGlobalRealized
        }

        return acc
      }, {} as RealizedAccumulations)

      // Process the graph position
      const processedGraphPosition = processGraphPosition(
        market,
        graphPosition,
        markToMarket ? pendingMarkToMarketAccumulations : undefined,
        {
          currentId: userMarketSnapshot.local.currentId,
          latestPrice: userMarketSnapshot.oracleVersions[0].price,
          collateral: pendingOrderCollateral,
          size: pendingDelta,
          offset: pendingTradeImpactAsOffset,
          settlementFee: pendingOrderSettlementFee,
          tradeFee: pendingTradeFee,
          additiveFee: pendingAdditiveFee,
        },
      )

      // Add realtime data
      const netDeposits = processedGraphPosition.netDeposits
      const currentCollateral =
        userMarketSnapshot.local.collateral + // Snapshot collateral
        pendingTradeImpactAsOffset - // Pending offset from trade
        (pendingOrderSettlementFee + pendingTradeFee + pendingAdditiveFee) // Pending fees from trade
      const realtimePnl = currentCollateral - (processedGraphPosition.startCollateral + netDeposits)
      const percentDenominator = processedGraphPosition.startCollateral + (netDeposits > 0n ? netDeposits : 0n)

      return {
        ...processedGraphPosition,
        realtime: realtimePnl,
        realtimePercent: percentDenominator !== 0n ? Big6Math.abs(Big6Math.div(realtimePnl, percentDenominator)) : 0n,
        pendingMarkToMarketAccumulations: markToMarket ? null : pendingMarkToMarketAccumulations,
      }
    }

    const averageEntryPrice = calcExecutionPriceWithImpact({
      notional: calcNotional(userMarketSnapshot.oracleVersions[0].price, pendingDelta),
      offset: pendingTradeImpactAsOffset,
      size: pendingDelta,
      side,
    })
    const startCollateral = userMarketSnapshot.pre.local.collateral
    const realtimePnl = userMarketSnapshot.local.collateral - (startCollateral + pendingOrderCollateral)
    const percentDenominator = startCollateral + (pendingOrderCollateral > 0n ? pendingOrderCollateral : 0n)
    const realtimePercent = percentDenominator !== 0n ? Big6Math.abs(Big6Math.div(realtimePnl, percentDenominator)) : 0n

    return {
      market,
      marketAddress,
      side,
      startVersion: marketSnapshot.latestOracleVersion.timestamp,
      endVersion: null,
      trades: 1n,
      startSize: magnitude_,
      startPrice: userMarketSnapshot.oracleVersions[0].price,
      positionId: userMarketSnapshot.local.currentId,
      startCollateral,
      startTransactionHash: null,
      totalPnl: pendingTradeImpactAsOffset,
      totalFees: pendingTradeFee + pendingOrderSettlementFee,
      totalNotional: calcNotional(userMarketSnapshot.oracleVersions[0].price, pendingDelta),
      pnlAccumulations: {
        offset: pendingTradeImpactAsOffset,
        pnl: 0n,
        funding: 0n,
        interest: 0n,
        makerPositionFee: 0n,
        makerExposure: 0n,
        priceOverride: 0n,
      },
      feeAccumulations: {
        settlement: pendingOrderSettlementFee,
        trade: pendingTradeFee,
        additive: 0n,
        liquidation: 0n,
        triggerOrder: 0n,
      },
      averageEntryPrice,
      averageExitPrice: 0n,
      netDeposits: pendingOrderCollateral,
      liquidation: false,
      liquidationFee: 0n,
      netPnl: realtimePnl,
      netPnlPercent: realtimePercent,
      realtime: realtimePnl,
      realtimePercent: realtimePercent,
      pendingMarkToMarketAccumulations: markToMarket ? null : DefaultRealizedAccumulations,
    }
  })

  return positionPnls.reduce(
    (acc, v) => {
      if (v) acc[v.market] = v
      return acc
    },
    {} as SupportedMarketMapping<
      ProcessedGraphPosition & {
        realtime: bigint
        realtimePercent: bigint
        pendingMarkToMarketAccumulations: RealizedAccumulations | null
      }
    >,
  )
}
/**
 * Fetches active position history for a given address
 * @param market {@link SupportedMarket}
 * @param address Wallet Address
 * @param positionId position ID
 * @param [first={@link GraphDefaultPageSize}] Number of entities to fetch
 * @param [skip=0] Offset for pagination
 * @param chainId {@link SupportedChainId}
 * @param graphClient GraphQLClient
 * @returns User's position history for an active position.
 */
export async function fetchActivePositionHistory({
  market,
  address,
  positionId,
  first = GraphDefaultPageSize,
  skip = 0,
  chainId,
  graphClient,
}: {
  market: SupportedMarket
  address: Address
  positionId: bigint
  first?: number
  skip?: number
  chainId: SupportedChainId
  graphClient: GraphQLClient
}) {
  return fetchSubPositions({
    chainId,
    address,
    market,
    positionId,
    graphClient,
    first,
    skip,
  })
}
/**
 * Fetches the position history for a given address
 * @param address Wallet Address
 * @param markets List of {@link SupportedMarket} to fetch position history for
 * @param chainId {@link SupportedChainId}
 * @param fromTs bigint - Start timestamp in seconds
 * @param toTs bigint - Start timestamp in seconds
 * @param [first={@link GraphDefaultPageSize}] Number of entities to fetch
 * @param [skip=0] Offset for pagination number
 * @param maker boolean - Whether to filter for maker or taker positions
 * @param graphClient GraphQLClient
 * @returns User's position history.
 */
export async function fetchHistoricalPositions({
  markets,
  address,
  graphClient,
  chainId,
  fromTs,
  toTs,
  first = GraphDefaultPageSize,
  skip = 0,
  maker,
}: {
  markets: SupportedMarket[]
  address: Address
  chainId: SupportedChainId
  graphClient: GraphQLClient
  fromTs?: bigint
  toTs?: bigint
  first?: number
  skip?: number
  maker?: boolean
}) {
  const marketsWithAddresses = chainMarketsWithAddress(chainId, markets)
  const query = maker ? QueryMarketAccountMakerPositions : QueryMarketAccountTakerPositions
  const { positions } = await graphClient.request(query, {
    account: address,
    markets: marketsWithAddresses.map((m) => m.marketAddress),
    fromTs: (fromTs ?? 0n).toString(),
    toTs: (toTs ?? nowSeconds()).toString(),
    first,
    skip,
  })

  return positions.map((graphPosition) =>
    processGraphPosition(addressToMarket(chainId, graphPosition.marketAccount.market.id), graphPosition),
  )
}

type ProcessedGraphPosition = ReturnType<typeof processGraphPosition>
function processGraphPosition(
  market: SupportedMarket,
  graphPosition: PositionDataFragment,
  latestToGlobalRealized?: Record<AccumulatorType, bigint>,
  pendingPositionData?: {
    currentId: bigint
    latestPrice: bigint
    collateral: bigint
    size: bigint
    offset: bigint
    settlementFee: bigint
    tradeFee: bigint
    additiveFee: bigint
  },
) {
  const startCollateral = BigInt(graphPosition.startCollateral)
  const netDeposits = BigInt(graphPosition.netDeposits)
  const percentDenominator = startCollateral + (netDeposits > 0n ? netDeposits : 0n)
  const side = positionSide(graphPosition.startMaker, graphPosition.startLong, graphPosition.startShort)
  const openSize = BigInt(graphPosition.openSize)
  const closeSize = BigInt(graphPosition.closeSize)
  const totalNotional = BigInt(graphPosition.openNotional) + BigInt(graphPosition.closeNotional)
  const averageEntryPrice = calcExecutionPriceWithImpact({
    notional: BigInt(graphPosition.openNotional),
    offset: BigInt(graphPosition.openOffset),
    size: openSize,
    side,
  })
  const averageExitPrice = calcExecutionPriceWithImpact({
    notional: BigInt(graphPosition.closeNotional),
    offset: BigInt(graphPosition.closeOffset),
    size: closeSize * -1n,
    side,
  })

  let totalPnl = BigOrZero(graphPosition.accumulation.collateral_accumulation)
  let totalFees = BigOrZero(graphPosition.accumulation.fee_accumulation)
  let netPnl = totalPnl - totalFees

  const pnlAccumulations = accumulateRealized([graphPosition.accumulation])
  const feeAccumulations = accumulateRealizedFees([graphPosition.accumulation])

  // If there is a realized pnl from the latest account settlement to the latest global settlement, apply it
  if (latestToGlobalRealized) {
    AccumulatorTypes.forEach(({ type }) => {
      pnlAccumulations[type] += latestToGlobalRealized[type]
      totalPnl += latestToGlobalRealized[type]
      netPnl += latestToGlobalRealized[type]
    })
  }

  // If this is a maker position, move offset to trade fee
  if (side === PositionSide.maker) {
    const offsetAsFee = pnlAccumulations.offset * -1n // Convert offset to a fee
    feeAccumulations.trade += offsetAsFee // add offset fee to trade fee
    totalFees += offsetAsFee // add offset fee to total fee

    pnlAccumulations.offset = 0n // remove offset from pnl offset
    totalPnl -= pnlAccumulations.offset // remove offset from total pnl
  }

  const closeOrder = graphPosition.closeOrder.at(0)

  const returnValue = {
    // Position Metadata
    market,
    marketAddress: getAddress(graphPosition.marketAccount.market.id),
    side,
    positionId: BigInt(graphPosition.positionId),
    startVersion: BigInt(graphPosition.startVersion),
    endVersion: closeOrder ? BigInt(closeOrder.oracleVersion.timestamp) : null,
    trades: BigInt(graphPosition.trades),
    // Position Starting Data
    startSize: magnitude(graphPosition.startMaker, graphPosition.startLong, graphPosition.startShort),
    startPrice: BigInt(graphPosition?.openOrder.at(0)?.executionPrice ?? 0n),
    startCollateral: BigInt(graphPosition.startCollateral),
    netDeposits,
    startTransactionHash: graphPosition?.openOrder.at(0)?.transactionHashes.at(0) ?? null,
    // PNL
    netPnl,
    netPnlPercent: percentDenominator !== 0n ? Big6Math.div(netPnl, percentDenominator) : 0n,
    // Accumulation Breakdowns
    totalPnl,
    totalFees,
    pnlAccumulations,
    feeAccumulations,
    // Derived Data
    averageEntryPrice,
    averageExitPrice,
    liquidation: Boolean(closeOrder?.liquidation),
    liquidationFee: BigOrZero(feeAccumulations.liquidation),
    totalNotional,
  }

  // If pending position data is available and newer than graph data, apply it
  if (pendingPositionData && pendingPositionData.currentId > BigInt(graphPosition.marketAccount.currentOrderId)) {
    returnValue.netDeposits += pendingPositionData.collateral
    returnValue.feeAccumulations.settlement += pendingPositionData.settlementFee
    returnValue.feeAccumulations.trade += pendingPositionData.tradeFee
    returnValue.feeAccumulations.additive += pendingPositionData.additiveFee
    let totalFee = pendingPositionData.settlementFee + pendingPositionData.tradeFee + pendingPositionData.additiveFee
    returnValue.totalFees += totalFee
    if (side === PositionSide.maker) {
      returnValue.feeAccumulations.trade += pendingPositionData.offset
      totalFee += pendingPositionData.offset
    } else {
      returnValue.pnlAccumulations.offset += pendingPositionData.offset
      returnValue.totalPnl += pendingPositionData.offset
      returnValue.netPnl += pendingPositionData.offset
    }
    returnValue.netPnl -= totalFee

    // Recalculate the average entry and exit price
    if (pendingPositionData.size > 0n) {
      returnValue.averageEntryPrice = calcExecutionPriceWithImpact({
        notional:
          BigInt(graphPosition.openNotional) + calcNotional(pendingPositionData.latestPrice, pendingPositionData.size),
        offset: BigInt(graphPosition.openOffset) + pendingPositionData.offset,
        size: openSize + pendingPositionData.size,
        side,
      })
    } else if (pendingPositionData.size < 0n) {
      returnValue.averageExitPrice = calcExecutionPriceWithImpact({
        notional:
          BigInt(graphPosition.closeNotional) + calcNotional(pendingPositionData.latestPrice, pendingPositionData.size),
        offset: BigInt(graphPosition.closeOffset) + pendingPositionData.offset,
        size: closeSize * -1n + pendingPositionData.size,
        side,
      })
    }
    // Add pending position data to total notional
    returnValue.totalNotional += calcNotional(pendingPositionData.latestPrice, pendingPositionData.size)
    if (pendingPositionData.size !== 0n) returnValue.trades += 1n
  }

  return returnValue
}

export type SubPositionChange = Awaited<ReturnType<typeof fetchSubPositions>>[number]
/**
 * Fetches the sub positions activity for a given position
 * @param address Wallet Address
 * @param market {@link SupportedMarket}
 * @param positionId BigInt
 * @param [first={@link GraphDefaultPageSize}] Number of entities to fetch
 * @param [skip=0] Offset for pagination
 * @param graphClient GraphQLClient
 * @returns User's sub positions.
 */
export async function fetchSubPositions({
  address,
  market,
  positionId,
  first = GraphDefaultPageSize,
  skip = 0,
  chainId,
  graphClient,
}: {
  chainId: SupportedChainId
  graphClient: GraphQLClient
  address: Address
  market: SupportedMarket
  positionId: bigint
  first?: number
  skip?: number
}) {
  const marketAddress = ChainMarkets[chainId][market]
  if (!marketAddress) return []

  const { orders } = await graphClient.request(QueryMarketAccountPositionOrders, {
    account: address,
    market: marketAddress,
    positionId: positionId.toString(),
    first,
    skip,
  })

  const processedOrders = orders.map((order) => processOrder(market, order))

  return processedOrders
}

/**
 * Fetches the trade history for a given address. Limited to a 30 day window.
 * @param address Wallet Address
 * @param fromTs start timestamp in seconds (defaults to 7 days before toTs)
 * @param toTs end timestamp in seconds (defaults to now)
 * @param graphClient GraphQLClient
 * @returns User's trade history.
 */
export async function fetchTradeHistory({
  chainId,
  graphClient,
  address,
  fromTs,
  toTs,
}: {
  chainId: SupportedChainId
  graphClient: GraphQLClient
  address: Address
  fromTs?: bigint
  toTs?: bigint
}) {
  const defaultTimeRange = Day * 7n
  const now = BigInt(nowSeconds())
  if (!toTs) toTs = now
  if (!fromTs) fromTs = toTs - defaultTimeRange

  const { orders } = await queryAll(async (pageNumber) =>
    graphClient.request(QueryAccountOrders, {
      account: address,
      first: GraphDefaultPageSize,
      skip: pageNumber * GraphDefaultPageSize,
      fromTs: fromTs.toString(),
      toTs: toTs.toString(),
    }),
  )

  const processedOrders = orders.map((order) => processOrder(addressToMarket(chainId, order.market.id), order))

  return processedOrders
}

function processOrder(market: SupportedMarket, order: OrderDataFragment) {
  const side = positionSide(order.position.startMaker, order.position.startLong, order.position.startShort)
  const delta = orderSize(order.maker, order.long, order.short)
  const collateral = BigInt(order.collateral)

  const priceWithImpact =
    delta !== 0n
      ? calcExecutionPriceWithImpact({
          notional: calcNotional(BigInt(order.guaranteePrice ?? order.executionPrice), delta),
          offset: BigInt(order.accumulation.collateral_subAccumulation_offset),
          size: delta,
          side,
        })
      : BigInt(order.executionPrice)
  const percentDenominator = BigInt(order.startCollateral) + (collateral > 0n ? collateral : 0n)
  let totalPnl = BigOrZero(order.accumulation.collateral_accumulation)
  let totalFees = BigOrZero(order.accumulation.fee_accumulation)
  const pnlAccumulations = accumulateRealized([order.accumulation])
  const feeAccumulations = accumulateRealizedFees([order.accumulation])
  // If this is a maker position, move offset to trade fee
  if (side === PositionSide.maker) {
    const offsetAsFee = pnlAccumulations.offset * -1n // Convert offset to a fee
    feeAccumulations.trade += offsetAsFee // add offset fee to trade fee
    totalFees += offsetAsFee // add offset fee to total fee

    pnlAccumulations.offset = 0n // remove offset from pnl offset
    totalPnl -= pnlAccumulations.offset // remove offset from total pnl
  }
  const netPnl = BigInt(order.accumulation.collateral_accumulation) - BigInt(order.accumulation.fee_accumulation)

  const returnValue = {
    // Position Metadata
    market,
    side,
    orderId: BigInt(order.orderId),
    version: BigInt(order.oracleVersion.timestamp),
    valid: order.oracleVersion.valid,
    delta,
    magnitude: magnitude(order.newMaker, order.newLong, order.newShort),
    executionPrice: BigInt(order.executionPrice),
    executionPriceWithOffset: priceWithImpact,
    startCollateral: BigInt(order.startCollateral),
    netDeposits: collateral,
    depositTotal: BigInt(order.depositTotal),
    withdrawalTotal: BigInt(order.withdrawalTotal),
    // PNL
    netPnl,
    netPnlPercent: percentDenominator !== 0n ? Big6Math.div(netPnl, percentDenominator) : 0n,
    // Guarantee Price
    guaranteePrice: order.guaranteePrice ? BigInt(order.guaranteePrice) : null,
    // Accumulation Breakdowns
    totalPnl,
    totalFees,
    pnlAccumulations,
    feeAccumulations,
    liquidation: Boolean(order.liquidation),
    liquidationFee: BigOrZero(order.accumulation.fee_subAccumulation_liquidation),
    transactionHashes: order.transactionHashes,
  }

  return returnValue
}

export type OpenOrder = NonNullable<NonNullable<Awaited<ReturnType<typeof fetchOpenOrders>>>>[number]
/**
 * Fetches the open orders for a given address
 * @param address Wallet Address
 * @param markets List of {@link SupportedMarket} to fetch open orders for
 * @param chainId {@link SupportedChainId}
 * @param [first={@link GraphDefaultPageSize}] Number of entities to fetch
 * @param [skip=0] Offset for pagination number
 * @param isMaker boolean - Filter for maker orders
 * @param graphClient GraphQLClient
 * @returns User's open orders.
 */
export async function fetchOpenOrders({
  chainId,
  graphClient,
  markets,
  address,
  first = GraphDefaultPageSize,
  skip = 0,
  isMaker,
}: {
  chainId: SupportedChainId
  graphClient: GraphQLClient
  markets: SupportedMarket[]
  address: Address
  first?: number
  skip?: number
  isMaker?: boolean
}) {
  const marketsWithAddresses = chainMarketsWithAddress(chainId, markets)
  const { multiInvokerTriggerOrders: triggerOrders } = await graphClient.request(QueryOpenTriggerOrders, {
    account: address,
    markets: marketsWithAddresses.map(({ marketAddress }) => marketAddress),
    first,
    skip,
    side: isMaker
      ? [0, 3, 4] // 0 = multiInvoker maker, 3 = multiInvoker collateral withdrawal, 4 = manager maker
      : [1, 2, 3, 5, 6], // 1 = multiInvoker long, 2 = multiInvoker short, 3 = multiInvoker collateral withdrawal, 5 = manager long, 6 = manager short
  })

  return triggerOrders.map((triggerOrder) => ({
    ...triggerOrder,
    market: addressToMarket(chainId, triggerOrder.market),
    marketAddress: getAddress(triggerOrder.market),
    source: getAddress(triggerOrder.source),
    account: getAddress(triggerOrder.account),
  }))
}

/**
 * Fetches the 24hr volume data for a list of market
 * @param markets List of {@link SupportedMarket}
 * @param chainId {@link SupportedChainId}
 * @param graphClient GraphQLClient
 * @returns Markets 24hr volume data.
 */
export async function fetchMarkets24hrData({
  chainId,
  graphClient,
  markets,
}: {
  chainId: SupportedChainId
  graphClient: GraphQLClient
  markets: SupportedMarket[]
}) {
  const { from, to } = last24hrBounds()

  return fetchMarketsHistoricalData({
    chainId,
    graphClient,
    markets,
    fromTs: BigInt(from),
    toTs: BigInt(to),
    bucket: Bucket.Hourly,
  })
}
/**
 * Fetches Historical data for markets
 * @param markets List of {@link SupportedMarket}
 * @param chainId {@link SupportedChainId}
 * @param graphClient GraphQLClient
 * @param fromTs bigint - Start timestamp in seconds
 * @param toTs bigint - Start timestamp in seconds
 * @param bucket {@link Bucket}
 * @returns Market 7d data.
 */
export async function fetchMarketsHistoricalData({
  chainId,
  graphClient,
  markets,
  fromTs,
  toTs,
  bucket = Bucket.Daily,
}: {
  chainId: SupportedChainId
  graphClient: GraphQLClient
  markets: SupportedMarket[]
  fromTs: bigint
  toTs: bigint
  bucket?: Bucket
}) {
  const marketAddresses = chainMarketsWithAddress(chainId, markets)
  const { marketData } = await graphClient.request(QueryMarketAccumulationData, {
    markets: marketAddresses.map((m) => m.marketAddress),
    fromTs: fromTs.toString(),
    toTs: toTs.toString(),
    bucket,
  })

  const parsedData = marketAddresses.map(({ market, marketAddress }) => {
    const data = marketData.find((m) => getAddress(m.id) === marketAddress)
    const fromAccumulator = data?.fromAccumulator.at(0)
    const toAccumulator = data?.toAccumulator.at(0)

    const scaleFactorDenominator = Big6Math.fromDecimals(
      BigInt(toAccumulator?.toVersion ?? toTs) - BigInt(fromAccumulator?.fromVersion ?? fromTs),
      0,
    )
    const accumulatorScaleFactor =
      scaleFactorDenominator !== 0n ? Big6Math.div(Big6Math.fromDecimals(toTs - fromTs, 0), scaleFactorDenominator) : 0n

    const accumulations = data?.accumulations ?? []
    const takerVolumes = accumulations.map((vol) => ({
      timestamp: vol.timestamp,
      longNotional: BigInt(vol.longNotional),
      shortNotional: BigInt(vol.shortNotional),
    }))
    const fundingRates = accumulations.map((rate) => ({
      timestamp: rate.timestamp,
      makerAPR: BigInt(rate.fundingRateMaker),
      longAPR: BigInt(rate.fundingRateLong),
      shortAPR: BigInt(rate.fundingRateShort),
    }))
    const interestRates = accumulations.map((rate) => ({
      timestamp: rate.timestamp,
      makerAPR: BigInt(rate.interestRateMaker),
      longAPR: BigInt(rate.interestRateLong),
      shortAPR: BigInt(rate.interestRateShort),
    }))

    return {
      market,
      address: marketAddress,
      takerVolumes,
      fundingRates,
      interestRates,
      // Accumulations are the delta between to and from, scaled to fill the window
      makerAccumulation: {
        funding: Big6Math.mul(
          BigOrZero(toAccumulator?.fundingMaker) - BigOrZero(fromAccumulator?.fundingMaker),
          accumulatorScaleFactor,
        ),
        interest: Big6Math.mul(
          BigOrZero(toAccumulator?.interestMaker) - BigOrZero(fromAccumulator?.interestMaker),
          accumulatorScaleFactor,
        ),
        positionFee: Big6Math.mul(
          BigOrZero(toAccumulator?.positionFeeMaker) - BigOrZero(fromAccumulator?.positionFeeMaker),
          accumulatorScaleFactor,
        ),
        exposure: Big6Math.mul(
          BigOrZero(toAccumulator?.exposureMaker) - BigOrZero(fromAccumulator?.exposureMaker),
          accumulatorScaleFactor,
        ),
      },
    }
  })

  return parsedData.reduce(
    (acc, market) => {
      acc[market.market] = market
      return acc
    },
    {} as SupportedMarketMapping<(typeof parsedData)[0]>,
  )
}
