import { HermesClient } from '@pythnetwork/hermes-client'
import { GraphQLClient } from 'graphql-request'
import { Address, PublicClient, concat, getAddress, toHex } from 'viem'

import {
  ChainMarkets,
  PositionSide,
  SupportedChainId,
  SupportedMarket,
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
  QueryMultiInvokerOpenOrders,
} from '../../graphQueries/markets'
import { Bucket, OrderDataFragment, PositionDataFragment } from '../../types/gql/graphql'
import { Day, last24hrBounds, nowSeconds } from '../../utils'
import { AccumulatorTypes, accumulateRealized, accumulateRealizedFees } from '../../utils/accumulatorUtils'
import { Big6Math, BigOrZero } from '../../utils/big6Utils'
import { GraphDefaultPageSize, bigIntToLittleEndian, queryAll } from '../../utils/graphUtils'
import {
  calcExecutionPriceWithImpact,
  calcNotional,
  calcTradeFee,
  magnitude,
  orderSize,
  side as positionSide,
} from '../../utils/positionUtils'
import { MarketSnapshots, fetchMarketSnapshots } from './chain'

/**
 * Fetches position PnL for a given market and Address
 * @param address Wallet Address
 * @param userMarketSnapshot {@link UserMarketSnapshot}
 * @param marketSnapshot {@link MarketSnapshot}
 * @param includeClosedWithCollateral Include closed positions with collateral
 * @param graphClient GraphQLClient
 * @returns User's PnL for an active position.
 */
export async function fetchActivePositionsPnl({
  markets,
  marketSnapshots,
  chainId,
  address,
  pythClient,
  publicClient,
  graphClient,
}: {
  markets: SupportedMarket[]
  address: Address
  marketSnapshots?: MarketSnapshots
  chainId: SupportedChainId
  pythClient: HermesClient
  publicClient: PublicClient
  graphClient: GraphQLClient
}): Promise<Record<SupportedMarket, ProcessedGraphPosition & { realtime: bigint; realtimePercent: bigint }>> {
  const missingMarketSnapshots = markets.some((m) => !marketSnapshots?.market[m] || !marketSnapshots?.user?.[m])
  if (missingMarketSnapshots) {
    marketSnapshots = await fetchMarketSnapshots({
      chainId,
      address,
      pythClient,
      publicClient,
      markets,
    })
  }

  const marketsWithAddresses = chainMarketsWithAddress(chainId, markets)
  const marketAccumulatorIDs = marketsWithAddresses.map(({ market, marketAddress }) =>
    concat([
      marketAddress,
      toHex(':'),
      bigIntToLittleEndian(marketSnapshots?.user?.[market]?.latestOrder.timestamp ?? 0n, 8),
    ]),
  )
  const { marketAccounts, startAccumulators } = await graphClient.request(QueryLatestMarketAccountPosition, {
    account: address,
    markets: marketsWithAddresses.map(({ marketAddress }) => marketAddress),
    accumulatorIDs: marketAccumulatorIDs,
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
      isMaker: side === PositionSide.maker,
      direction: side,
      usePreGlobalPosition: pendingDelta !== 0n,
    })
    const pendingTradeImpactAsOffset = -1n * pendingTradeFeeData.tradeImpact
    const pendingOrderCollateral = userMarketSnapshot.pendingOrder.collateral
    const pendingOrderSettlementFee = pendingDelta !== 0n ? marketSnapshot.parameter.settlementFee : 0n
    const pendingTradeFee = pendingTradeFeeData.tradeFee
    const pendingAdditiveFee = 0n

    const graphMarketAccount = marketAccounts.find((ma) => getAddress(ma.market.id) === marketAddress)
    const graphPosition = graphMarketAccount?.positions.at(0)

    // Pull position data from the graph if available
    if (graphMarketAccount && graphPosition) {
      const startAccumulator = startAccumulators.find((sa) => getAddress(sa.market.id) === marketAddress)

      // Process the graph position
      const processedGraphPosition = processGraphPosition(market, graphPosition, {
        currentId: userMarketSnapshot.local.currentId,
        latestPrice: userMarketSnapshot.prices[0],
        collateral: pendingOrderCollateral,
        size: pendingDelta,
        offset: pendingTradeImpactAsOffset,
        settlementFee: pendingOrderSettlementFee,
        tradeFee: pendingTradeFee,
        additiveFee: pendingAdditiveFee,
      })

      // Add realtime data
      const netDeposits = processedGraphPosition.netDeposits
      const currentCollateral =
        userMarketSnapshot.local.collateral + // Snapshot collateral
        pendingTradeImpactAsOffset - // Pending offset from trade
        (pendingOrderSettlementFee + pendingTradeFee + pendingAdditiveFee) // Pending fees from trade
      const realtimePnl = currentCollateral - (processedGraphPosition.startCollateral + netDeposits)
      const percentDenominator = processedGraphPosition.startCollateral + (netDeposits > 0n ? netDeposits : 0n)

      // Accumulate the portion of pnl from the latest account settlement to the latest global settlement
      const accumulationToGlobal = AccumulatorTypes.map(({ type, unrealizedKey }) => {
        if (side === 'none') return { type, unrealized: 0n }

        // Some accumulations don't have global counterparts
        let unrealized = 0n
        const unrealizedKeyForSide = unrealizedKey[side]

        // Pnl from latest account settlement to latest global settlement
        const currentAccumulator = graphMarketAccount?.accumulators.current.at(0)
        if (unrealizedKeyForSide && currentAccumulator && startAccumulator) {
          const makerOnlyAccumulations = ['makerPositionFee', 'makerExposure']
          if (
            (side === PositionSide.maker && makerOnlyAccumulations.includes(type)) ||
            !makerOnlyAccumulations.includes(type)
          ) {
            unrealized = Big6Math.mul(
              BigInt(currentAccumulator[unrealizedKeyForSide]) - BigInt(startAccumulator[unrealizedKeyForSide]),
              magnitude_,
            )
          }
        }

        return { type, unrealized }
      })
      processedGraphPosition.pnlAccumulations = Object.values(accumulationToGlobal).reduce(
        (acc, { unrealized, type }) => {
          acc[type] += unrealized
          return acc
        },
        processedGraphPosition.pnlAccumulations,
      )

      return {
        ...processedGraphPosition,
        realtime: realtimePnl,
        realtimePercent: percentDenominator !== 0n ? Big6Math.abs(Big6Math.div(realtimePnl, percentDenominator)) : 0n,
      }
    }

    const averageEntryPrice = calcExecutionPriceWithImpact({
      notional: calcNotional(userMarketSnapshot.prices[0], pendingDelta),
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
      version: marketSnapshot.latestOracleVersion.timestamp,
      startSize: magnitude_,
      startPrice: userMarketSnapshot.prices[0],
      positionId: userMarketSnapshot.local.currentId,
      startCollateral,
      totalPnl: pendingTradeImpactAsOffset,
      totalFees: pendingTradeFee + pendingOrderSettlementFee,
      pnlAccumulations: {
        offset: pendingTradeImpactAsOffset,
        pnl: 0n,
        funding: 0n,
        interest: 0n,
        makerPositionFee: 0n,
        makerExposure: 0n,
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
    }
  })

  return positionPnls.reduce(
    (acc, v) => {
      if (v) acc[v.market] = v
      return acc
    },
    {} as Record<SupportedMarket, ProcessedGraphPosition & { realtime: bigint; realtimePercent: bigint }>,
  )
}
/**
 * Fetches active position history for a given address
 * @param address Wallet Address
 * @param market Market Address
 * @param pageParam Page number
 * @param pageSize Page size
 * @param graphClient GraphQLClient
 * @returns User's position history for an active position.
 */
export async function fetchActivePositionHistory({
  market,
  address,
  positionId,
  first = 100,
  skip = 0,
  chainId,
  graphClient,
}: {
  market: SupportedMarket
  address: Address
  positionId: bigint
  first: number
  skip: number
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
 * @param markets List of {@link Markets} to fetch position history for
 * @param pageParam Page number
 * @param pageSize Page size
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
  first = 100,
  skip = 0,
  maker,
}: {
  markets: SupportedMarket[]
  address: Address
  chainId: SupportedChainId
  graphClient: GraphQLClient
  fromTs?: bigint
  toTs?: bigint
  first: number
  skip: number
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
  const netPnl =
    BigInt(graphPosition.accumulation.collateral_accumulation) - BigInt(graphPosition.accumulation.fee_accumulation)
  const startCollateral = BigInt(graphPosition.startCollateral)
  const netDeposits = BigInt(graphPosition.netDeposits)
  const percentDenominator = startCollateral + (netDeposits > 0n ? netDeposits : 0n)
  const side = positionSide(graphPosition.startMaker, graphPosition.startLong, graphPosition.startShort)
  const openSize = BigInt(graphPosition.openSize)
  const averageEntryPrice = calcExecutionPriceWithImpact({
    notional: BigInt(graphPosition.openNotional),
    offset: BigInt(graphPosition.openOffset),
    size: openSize,
    side,
  })
  const averageExitPrice = calcExecutionPriceWithImpact({
    notional: BigInt(graphPosition.closeNotional),
    offset: BigInt(graphPosition.closeOffset),
    size: BigInt(graphPosition.closeSize) * -1n,
    side,
  })

  let totalPnl = BigOrZero(graphPosition.accumulation.collateral_accumulation)
  let totalFees = BigOrZero(graphPosition.accumulation.fee_accumulation)
  const pnlAccumulations = accumulateRealized([graphPosition.accumulation])
  const feeAccumulations = accumulateRealizedFees([graphPosition.accumulation])
  // If this is a maker position, move offset to trade fee
  if (side === PositionSide.maker) {
    const offsetAsFee = pnlAccumulations.offset * -1n // Convert offset to a fee
    feeAccumulations.trade += offsetAsFee // Convert offset to a fee
    totalFees += offsetAsFee

    pnlAccumulations.offset = 0n
    totalPnl -= pnlAccumulations.offset
  }

  const returnValue = {
    // Position Metadata
    market,
    marketAddress: getAddress(graphPosition.marketAccount.market.id),
    side,
    positionId: BigInt(graphPosition.positionId),
    version: BigInt(graphPosition.startVersion),
    // Position Starting Data
    startSize: magnitude(graphPosition.startMaker, graphPosition.startLong, graphPosition.startShort),
    startPrice: BigInt(graphPosition?.firstOrder.at(0)?.executionPrice ?? 0n),
    startCollateral: BigInt(graphPosition.startCollateral),
    netDeposits,
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
    liquidation: Boolean(graphPosition.liqOrders.length),
    liquidationFee: BigOrZero(feeAccumulations.liquidation),
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

    // Recalculate the average entry price
    if (pendingPositionData.size > 0n) {
      returnValue.averageEntryPrice = calcExecutionPriceWithImpact({
        notional:
          BigInt(graphPosition.openNotional) + calcNotional(pendingPositionData.latestPrice, pendingPositionData.size),
        offset: pendingPositionData.offset,
        size: openSize + pendingPositionData.size,
        side,
      })
    }
  }

  return returnValue
}

export type SubPositionChange = Awaited<ReturnType<typeof fetchSubPositions>>[number]
/**
 * Fetches the sub positions activity for a given position
 * @param address Wallet Address
 * @param market Market Address
 * @param startVersion BigInt - Start oracle version number
 * @param endVersion BigInt - End oracle version number
 * @param first Number of entries to fetch
 * @param skip Number of entries to skip
 * @param graphClient GraphQLClient
 * @returns User's sub positions.
 */
export async function fetchSubPositions({
  address,
  market,
  positionId,
  first,
  skip,
  chainId,
  graphClient,
}: {
  chainId: SupportedChainId
  graphClient: GraphQLClient
  address: Address
  market: SupportedMarket
  positionId: bigint
  first: number
  skip: number
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
          notional: calcNotional(BigInt(order.executionPrice), delta),
          offset: BigInt(order.accumulation.collateral_subAccumulation_offset),
          size: delta,
          side,
        })
      : BigInt(order.executionPrice)
  const percentDenominator = BigInt(order.startCollateral) + (collateral > 0n ? collateral : 0n)
  const netPnl = BigInt(order.accumulation.collateral_accumulation) - BigInt(order.accumulation.fee_accumulation)

  const returnValue = {
    // Position Metadata
    market,
    side,
    orderId: BigInt(order.orderId),
    version: BigInt(order.oracleVersion.timestamp),
    valid: order.oracleVersion.valid,
    delta,
    magnitude: magnitude(order.maker, order.long, order.short),
    executionPrice: BigInt(order.executionPrice),
    executionPriceWithOffset: priceWithImpact,
    startCollateral: BigInt(order.startCollateral),
    netDeposits: collateral,
    // PNL
    netPnl,
    netPnlPercent: percentDenominator !== 0n ? Big6Math.div(netPnl, percentDenominator) : 0n,
    // Accumulation Breakdowns
    totalPnl: BigInt(order.accumulation.collateral_accumulation),
    totalFees: BigInt(order.accumulation.fee_accumulation),
    pnlAccumulations: accumulateRealized([order.accumulation]),
    feeAccumulations: accumulateRealizedFees([order.accumulation]),
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
 * @param markets List of {@link Markets} to fetch open orders for
 * @param pageParam Page number
 * @param pageSize Page size
 * @param graphClient GraphQLClient
 * @returns User's open orders.
 */
export async function fetchOpenOrders({
  chainId,
  graphClient,
  markets,
  address,
  first = 100,
  skip = 0,
  isMaker,
}: {
  chainId: SupportedChainId
  graphClient: GraphQLClient
  markets: SupportedMarket[]
  address: Address
  first: number
  skip: number
  isMaker?: boolean
}) {
  const marketsWithAddresses = chainMarketsWithAddress(chainId, markets)
  const { multiInvokerTriggerOrders } = await graphClient.request(QueryMultiInvokerOpenOrders, {
    account: address,
    markets: marketsWithAddresses.map(({ marketAddress }) => marketAddress),
    first,
    skip,
    side: isMaker ? [0, 3] : [1, 2, 3], // 3 = collateral withdrawal
  })

  return multiInvokerTriggerOrders.map((triggerOrder) => ({
    ...triggerOrder,
    market: addressToMarket(chainId, triggerOrder.market),
    marketAddress: getAddress(triggerOrder.market),
  }))
}

/**
 * Fetches the 24hr volume data for a list of market
 * @param markets List of market Addresses
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
 * Fetches the 7d data for a given market
 * @param market Market Address
 * @param graphClient GraphQLClient
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

    const accumulatorScaleFactor = Big6Math.fromFloatString(
      (
        Number(toTs - fromTs) /
        Number(BigInt(toAccumulator?.toVersion ?? toTs) - BigInt(fromAccumulator?.toVersion ?? fromTs))
      ).toString(),
    )

    const accumulations = data?.accumulations ?? []
    const takerVolumes = accumulations.map((vol) => ({
      timestamp: vol.timestamp,
      longNotional: BigInt(vol.longNotional),
      shortNotional: BigInt(vol.shortNotional),
    }))
    const fundingRates = accumulations.map((rate) => ({
      timestamp: rate.timestamp,
      makerAPR: BigInt(rate.fundingRateMaker) + BigInt(rate.interestRateMaker),
      longAPR: BigInt(rate.fundingRateLong) + BigInt(rate.interestRateLong),
      shortAPR: BigInt(rate.fundingRateShort) + BigInt(rate.interestRateShort),
    }))

    return {
      market,
      address: marketAddress,
      takerVolumes,
      fundingRates,
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
    {} as Record<SupportedMarket, (typeof parsedData)[0]>,
  )
}
