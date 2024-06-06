import { GraphQLClient } from 'graphql-request'
import { Address, getAddress } from 'viem'

import { PositionSide, SupportedAsset, addressToAsset } from '../../constants'
import { gql } from '../../types/gql'
import {
  FetchSubPositions_AccountUpdatesQuery,
  MarketsAccountCheckpointsQuery,
  PositionSide as PositionSideGraph,
} from '../../types/gql/graphql'
import { Day, Hour, last7dBounds, last24hrBounds, notEmpty, nowSeconds, sum, unique } from '../../utils'
import { AccumulatorTypes, RealizedAccumulations, accumulateRealized } from '../../utils/accumulatorUtils'
import { Big6Math, BigOrZero } from '../../utils/big6Utils'
import { GraphDefaultPageSize, queryAll } from '../../utils/graphUtils'
import {
  calcNotional,
  calcPriceImpactFromTradeFee,
  calcTradeFee,
  magnitude,
  side as positionSide,
} from '../../utils/positionUtils'
import { MarketSnapshot, UserMarketSnapshot } from './chain'

export type Markets = {
  asset: SupportedAsset
  marketAddress: Address
}[]

/**
 * Fetches position PnL for a given market and Address
 * @param address Wallet Address
 * @param market Market Address
 * @param userMarketSnapshot {@link UserMarketSnapshot}
 * @param marketSnapshot {@link MarketSnapshot}
 * @param includeClosedWithCollateral Include closed positions with collateral
 * @param graphClient GraphQLClient
 * @returns User's PnL for an active position.
 */
export async function fetchActivePositionPnl({
  market,
  marketSnapshot,
  userMarketSnapshot,
  address,
  graphClient,
  includeClosedWithCollateral = false,
}: {
  market: Address
  marketSnapshot: MarketSnapshot
  userMarketSnapshot: UserMarketSnapshot
  address: Address
  graphClient: GraphQLClient
  includeClosedWithCollateral?: boolean
}) {
  // Query Checkpoints for each market - note that we don't query for a specific type because if we query for
  // `open` we might get the position before the latest position
  const queryAccountCheckpoints = gql(`
    query AccountCheckpoints($account: Bytes!, $market: Bytes!) {
      marketAccountCheckpoints(
        where: { account: $account, market: $market }
        orderBy: blockNumber, orderDirection: desc, first: 1
      ) { market, account, type, blockNumber, version }
    }
  `)

  // Query for the corresponding open checkpoint if the most recent checkpoint is a close with collateral
  const queryCorrespondingOpen = gql(`
    query CorrespondingOpenQuery($account: Bytes!, $market: Bytes!, $closeVersion: BigInt!) {
      marketAccountCheckpoints(
        where: { account: $account, market: $market, version_lt: $closeVersion, type: open }
        orderBy: blockNumber, orderDirection: desc, first: 1
      ) { market, account, type, blockNumber, version }
    }
  `)

  // Query the market accumulators for each market. These are used to get data between the latest account settlement
  // and the latest global settlement
  const queryMarketAccumulatorsAndFirstUpdate = gql(`
    query MarketAccumulators($market: Bytes!, $account: Bytes!, $accountLatestVersion: BigInt!) {
      start: marketAccumulators(
        where: { market: $market, version: $accountLatestVersion, latest: false }
      ) {
        market, version
        makerValue, longValue, shortValue,
        pnlMaker, pnlLong, pnlShort,
        fundingMaker, fundingLong, fundingShort,
        interestMaker, interestLong, interestShort,
        positionFeeMaker
      }
      latest: marketAccumulators(
        where: { market: $market, latest: true }
      ) {
        market, version
        makerValue, longValue, shortValue,
        pnlMaker, pnlLong, pnlShort,
        fundingMaker, fundingLong, fundingShort,
        interestMaker, interestLong, interestShort,
        positionFeeMaker
      }
      firstUpdate: updateds(
        where: { market: $market, account: $account, version: $accountLatestVersion }
      ) { interfaceFee, orderFee }
    }
  `)

  const asset = addressToAsset(market)
  if (!address || !asset) return

  let checkpointData = await graphClient.request(queryAccountCheckpoints, {
    account: address,
    market: market,
  })

  // If the most recent checkpoint is a close and there is still collateral, we need to find the corresponding open checkpoint
  if (
    includeClosedWithCollateral &&
    checkpointData.marketAccountCheckpoints?.at(0)?.type === 'close' &&
    userMarketSnapshot.local.collateral !== 0n
  ) {
    checkpointData = await graphClient.request(queryCorrespondingOpen, {
      account: address,
      market: market,
      closeVersion: BigInt(checkpointData.marketAccountCheckpoints[0].version).toString(),
    })
  }

  const isFetchable =
    checkpointData.marketAccountCheckpoints?.[0] && checkpointData.marketAccountCheckpoints?.[0].type === 'open'

  const graphPosition = isFetchable
    ? await fetchPositionData({
        graphClient,
        address,
        market: getAddress(checkpointData.marketAccountCheckpoints[0].market),
        endVersion: null,
        startVersion: BigInt(checkpointData.marketAccountCheckpoints[0].version),
      })
    : null

  const lastSettlementSnapshot = userMarketSnapshot.pendingPositions[0].timestamp
  const lastSettlement = graphPosition?.endVersion ? BigInt(graphPosition.endVersion) : lastSettlementSnapshot

  const marketAccumulators = await graphClient.request(queryMarketAccumulatorsAndFirstUpdate, {
    market: market,
    account: address,
    accountLatestVersion: lastSettlement.toString(),
  })

  const snapshot = userMarketSnapshot
  const [side, magnitude] = [snapshot.nextSide === 'none' ? snapshot.side : snapshot.nextSide, snapshot.nextMagnitude]
  let interfaceFees = BigOrZero(marketAccumulators?.firstUpdate.at(0)?.interfaceFee)
  let orderFees = BigOrZero(marketAccumulators?.firstUpdate.at(0)?.orderFee)
  let startCollateral = snapshot.pre.local.collateral
  let netDeposits = 0n
  let keeperFees = snapshot.checkpoint.settlementFee
  let positionFees = snapshot.checkpoint.tradeFee
  const pendingDelta = side !== 'none' ? snapshot.pre.nextPosition[side] - snapshot.pre.position[side] : 0n
  const tradeFeeData = calcTradeFee({
    positionDelta: pendingDelta,
    marketSnapshot,
    isMaker: side === PositionSide.maker,
    direction: side,
  })
  const pendingPriceImpactFee = calcPriceImpactFromTradeFee({
    tradeImpact: tradeFeeData.tradeImpact,
    positionDelta: pendingDelta,
  })
  let priceImpactFees = tradeFeeData.tradeImpact
  const priceImpact = pendingPriceImpactFee

  let averageEntryPrice = snapshot.prices[0]
  if (side === 'long') averageEntryPrice = averageEntryPrice + priceImpact
  if (side === 'short') averageEntryPrice = averageEntryPrice - priceImpact
  if (graphPosition) {
    // Start collateral is netDeposits + accumulatedCollateral immediately before start, plus deposits that occurred
    // on the start block
    startCollateral = graphPosition.startCollateral

    // Average entry is (openNotionalNow - openNotionalBeforeStart + pendingNotionalDeltaIfPositive) / (openSizeNow - openSizeBeforeStart - pendingSizeDeltaIfPositive)
    const pendingNotional = Big6Math.mul(pendingDelta, snapshot.prices[0])
    // Add price impact fee for taker positions
    let avgEntryNumerator = graphPosition.openNotional + (pendingDelta > 0n ? pendingNotional : 0n)
    if (side === 'long')
      avgEntryNumerator = avgEntryNumerator + graphPosition.openPriceImpactFees + pendingPriceImpactFee
    if (side === 'short')
      avgEntryNumerator = avgEntryNumerator - graphPosition.openPriceImpactFees - pendingPriceImpactFee
    averageEntryPrice = Big6Math.div(
      avgEntryNumerator,
      graphPosition.openSize + (pendingDelta > 0n ? pendingDelta : 0n),
    )

    // Current values are deltas between now and start
    netDeposits = graphPosition.netDeposits
    keeperFees = keeperFees + graphPosition.keeperFees
    positionFees = positionFees + graphPosition.positionFees
    priceImpactFees = priceImpactFees + graphPosition.priceImpactFees
    interfaceFees = graphPosition.interfaceFees
    orderFees = graphPosition.orderFees
  }
  const accumulatedValues = AccumulatorTypes.map(({ type, unrealizedKey }) => {
    if (side === 'none') return { type, realized: 0n, unrealized: 0n, total: 0n }

    // Pnl from start to latest account settlement
    const realized = graphPosition?.accumulated[type] || 0n

    // Pnl from latest account settlement to latest global settlement
    let unrealized = 0n
    if (marketAccumulators?.start[0] && marketAccumulators?.latest[0]) {
      if ((side === 'maker' && type === 'makerPositionFee') || type !== 'makerPositionFee') {
        unrealized = Big6Math.mul(
          BigInt(marketAccumulators.latest[0][unrealizedKey[side]]) -
            BigInt(marketAccumulators.start[0][unrealizedKey[side]]),
          magnitude,
        )
      }
    }

    return { type, realized, unrealized, total: realized + unrealized }
  })

  // Add interface + order fee as part of start collateral since it is deducted from deposit and collateral balance
  const realtimePnl = snapshot.local.collateral - (startCollateral + netDeposits + interfaceFees + orderFees)
  const percentDenominator = startCollateral + (netDeposits > 0n ? netDeposits : 0n) + interfaceFees + orderFees
  const accumulatedPnl = AccumulatorTypes.reduce((acc, { type }) => {
    let pnl = accumulatedValues.find((v) => v.type === type)?.total ?? 0n
    // If this is a taker position, we need to subtract the price impact fees from the pnl and total
    if ((type === 'pnl' || type === 'value') && side !== 'maker') pnl = pnl - priceImpactFees
    return { ...acc, [type]: pnl }
  }, {} as RealizedAccumulations)

  return {
    asset,
    startCollateral,
    realtime: realtimePnl,
    realtimePercent: !Big6Math.isZero(percentDenominator)
      ? Big6Math.abs(Big6Math.div(realtimePnl, percentDenominator))
      : 0n,
    realtimePercentDenominator: percentDenominator,
    accumulatedPnl,
    keeperFees,
    positionFees,
    priceImpactFees,
    interfaceFees,
    orderFees,
    averageEntryPrice,
    liquidation: !!graphPosition?.liquidation,
    liquidationFee: graphPosition?.liquidationFee ?? 0n,
  }
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
  pageParam = 0,
  pageSize = 100,
  graphClient,
}: {
  market: Address
  address: Address
  pageParam: number
  pageSize: number
  graphClient: GraphQLClient
}) {
  // Query for both the open and close checkpoint. The starting version is the greater of the two versions
  const queryAccountCloseCheckpoints = gql(`
    query CloseAccountCheckpoints($account: Bytes!, $market: Bytes!) {
      close: marketAccountCheckpoints(
        where: { account: $account, market: $market, type: close }
        orderBy: blockNumber, orderDirection: desc, first: 1
      ) { market, account, type, version }
      open: marketAccountCheckpoints(
        where: { account: $account, market: $market, type: open }
        orderBy: blockNumber, orderDirection: desc, first: 1
      ) { market, account, type, version }
    }
  `)
  const { close, open } = await graphClient.request(queryAccountCloseCheckpoints, { account: address, market })
  const startVersion = Big6Math.max(BigOrZero(close[0]?.version) + 1n, BigOrZero(open[0]?.version))
  const { changes, hasMore } = await fetchSubPositions({
    graphClient,
    market,
    address,
    startVersion,
    first: pageSize,
    skip: pageParam * pageSize,
  })
  return {
    changes,
    nextCursor: hasMore ? pageParam + 1 : undefined,
    checkpoint: { close: close[0], open: open[0] },
  }
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
  pageSize = 10,
  pageParam,
  maker,
}: {
  markets: Markets
  address: Address
  graphClient: GraphQLClient
  pageSize: number
  pageParam?: { page: number; checkpoints?: MarketsAccountCheckpointsQuery }
  maker?: boolean
}) {
  const queryMarketsAccountCheckpoints = gql(`
  query MarketsAccountCheckpoints(
    $account: Bytes!, $markets: [Bytes!]!, $sides: [PositionSide!]!, $first: Int!, $skip: Int!
  ) {
    marketAccountCheckpoints(
      where: { account: $account, market_in: $markets, side_in: $sides },
      orderBy: version, orderDirection: desc, first: $first, skip: $skip
    ) { market, account, type, version, blockNumber }
  }
`)

  const checkpoints =
    pageParam?.checkpoints ??
    (await queryAll(async (pageNumber: number) =>
      graphClient.request(queryMarketsAccountCheckpoints, {
        account: address,
        markets: markets.map(({ marketAddress }) => marketAddress),
        first: GraphDefaultPageSize,
        skip: pageNumber * GraphDefaultPageSize,
        sides: maker ? [PositionSideGraph.Maker] : [PositionSideGraph.Long, PositionSideGraph.Short],
      }),
    ))

  const pageNumber = pageParam?.page ?? 0
  const closes = checkpoints.marketAccountCheckpoints
    .filter((c) => c.type === 'close')
    .slice(pageNumber * pageSize, (pageNumber + 1) * pageSize)

  const positionsData = await Promise.all(
    closes.map(async (c) => {
      // Find the corresponding open
      const open = checkpoints.marketAccountCheckpoints.find(
        (cc) => cc.type === 'open' && cc.market === c.market && Number(cc.blockNumber) < Number(c.blockNumber),
      )

      if (!open) return

      const data = await fetchPositionData({
        graphClient,
        address,
        market: getAddress(c.market),
        startVersion: BigInt(open.version),
        endVersion: BigInt(c.version),
      })

      return data
    }),
  )

  const positions = positionsData.filter(notEmpty)
  return {
    positions,
    nextPageParam:
      closes.length === pageSize
        ? {
            page: (pageParam?.page ?? 0) + 1,
            checkpoints,
          }
        : undefined,
  }
}

async function fetchPositionData({
  graphClient,
  address,
  market,
  startVersion,
  endVersion,
}: {
  graphClient: GraphQLClient
  address: Address
  market: Address
  startVersion: bigint
  endVersion: bigint | null
}) {
  const asset = addressToAsset(market)
  if (!asset) return

  const accountPositionCheckpointDeltas = gql(`
    query MarketAccountCheckpointDeltas(
      $account: Bytes!, $market: Bytes!, $startVersion: BigInt!, $endVersion: BigInt!
    ) {
      start: marketAccountCheckpoints(
        where: { market: $market, account: $account, version: $startVersion },
      ) {
        market, accumulatedValue, accumulatedCollateral, openSize, openNotional, openPriceImpactFees, accumulatedPositionFees
        accumulatedKeeperFees, accumulatedPnl, accumulatedFunding, accumulatedInterest, accumulatedMakerPositionFee,
        accumulatedPriceImpactFees, accumulatedInterfaceFees, accumulatedOrderFees, collateral, netDeposits, side,
        closeSize, closeNotional, closePriceImpactFees, startMagnitude, blockTimestamp, transactionHash
      }
      end: marketAccountCheckpoints(
        where: { market: $market, account: $account, version: $endVersion },
      ) {
        market, accumulatedValue, accumulatedCollateral, openSize, openNotional, openPriceImpactFees, accumulatedPositionFees
        accumulatedKeeperFees, accumulatedPnl, accumulatedFunding, accumulatedInterest, accumulatedMakerPositionFee,
        accumulatedPriceImpactFees, accumulatedInterfaceFees, accumulatedOrderFees, collateral, netDeposits,
        closeSize, closeNotional, closePriceImpactFees,
      }
      currentPosition: marketAccountPositions(
        where: { market: $market, account: $account },
      ) {
        market, accumulatedValue, accumulatedCollateral, openSize, openNotional, openPriceImpactFees, accumulatedPositionFees
        accumulatedKeeperFees, accumulatedPnl, accumulatedFunding, accumulatedInterest, accumulatedMakerPositionFee,
        accumulatedPriceImpactFees, accumulatedInterfaceFees, accumulatedOrderFees, collateral, netDeposits,
        closeSize, closeNotional, closePriceImpactFees,
      }
      startUpdate: updateds(
        where: { market: $market, account: $account, version: $startVersion },
      ) { price, priceImpactFee, interfaceFee, orderFee }
      endUpdate: updateds(
        where: { market: $market, account: $account, version_lte: $endVersion },
        first: 1, orderBy: version, orderDirection: desc
      ) { protect, collateral, version, liquidationFee }
      firstAccumulation: accountPositionProcesseds(
        where: { market: $market, account: $account, toOracleVersion: $startVersion }
      ) { accumulationResult_positionFee, accumulationResult_keeper, priceImpactFee }
      finalAccumulation: accountPositionProcesseds(
        where: { market: $market, account: $account, fromOracleVersion: $endVersion }
      ) { accumulationResult_positionFee, accumulationResult_keeper, priceImpactFee }
    }
  `)

  const positionData = await graphClient.request(accountPositionCheckpointDeltas, {
    account: address,
    market,
    startVersion: startVersion.toString(),
    endVersion: endVersion !== null ? endVersion.toString() : nowSeconds().toString(),
  })

  const startUpdate = positionData?.startUpdate.at(0)
  const endUpdate = positionData?.endUpdate.at(0)
  const firstAccumulation = positionData?.firstAccumulation?.at(0)
  const finalAccumulation = positionData?.finalAccumulation?.at(0)

  const start = positionData?.start.at(0)
  const end = positionData?.end.at(0) ?? positionData?.currentPosition.at(0)

  if (!startUpdate || !endUpdate || !start || !end) return

  const startSize = BigInt(start.startMagnitude)
  const side =
    start.side === 'maker' ? PositionSide.maker : start.side === 'long' ? PositionSide.long : PositionSide.short
  const startCollateral =
    BigInt(start.collateral) +
    BigOrZero(firstAccumulation?.accumulationResult_positionFee) +
    BigOrZero(firstAccumulation?.accumulationResult_keeper)
  const netDeposits = BigOrZero(end.netDeposits) - BigOrZero(start.netDeposits)
  const openNotional = BigOrZero(end.openNotional) - BigOrZero(start.openNotional)
  const openPriceImpactFees = BigOrZero(end.openPriceImpactFees) - BigOrZero(start.openPriceImpactFees)
  const openSize = BigOrZero(end.openSize) - BigOrZero(start.openSize)
  const closeNotional = BigOrZero(end.closeNotional) - BigOrZero(start.closeNotional)
  const closePriceImpactFees = BigOrZero(end.closePriceImpactFees) - BigOrZero(start.closePriceImpactFees)
  const closeSize = BigOrZero(end.closeSize) - BigOrZero(start.closeSize)

  let avgEntryNumerator = openNotional
  let startPrice = BigOrZero(startUpdate.price)
  let avgExitNumerator = closeNotional
  // Factor in price impact fees for takers
  const priceImpactPerPosition = startSize > 0n ? Big6Math.div(BigOrZero(startUpdate.priceImpactFee), startSize) : 0n
  if (side === 'long') {
    startPrice = startPrice + priceImpactPerPosition
    avgEntryNumerator = avgEntryNumerator + openPriceImpactFees
    avgExitNumerator = avgExitNumerator - closePriceImpactFees
  }
  if (side === 'short') {
    startPrice = startPrice - priceImpactPerPosition
    avgEntryNumerator = avgEntryNumerator - openPriceImpactFees
    avgExitNumerator = avgExitNumerator + closePriceImpactFees
  }

  const position = {
    market,
    asset,
    side: side === 'maker' ? PositionSide.maker : side === 'long' ? PositionSide.long : PositionSide.short,
    startTime: new Date(Number(start.blockTimestamp) * 1000),
    startTransactionHash: start.transactionHash,
    startSize,
    startVersion,
    endVersion: endVersion === null ? BigInt(endUpdate.version) : endVersion,
    startPrice,
    startCollateral,
    startNotional: calcNotional(startSize, startPrice),
    netDeposits,
    liquidation: endUpdate.protect,
    liquidationFee: Big6Math.abs(BigOrZero(endUpdate.liquidationFee)),
    openNotional,
    openSize,
    openPriceImpactFees,
    averageEntry: openSize > 0n ? Big6Math.div(avgEntryNumerator, openSize) : 0n,
    averageExit: closeSize > 0n ? Big6Math.div(avgExitNumerator, closeSize) : 0n,
    accumulated: AccumulatorTypes.map((type) => ({
      [type.type]: BigOrZero(end[type.realizedKey]) - BigOrZero(start[type.realizedKey]),
    })).reduce((acc, v) => ({ ...acc, ...v }), {} as RealizedAccumulations) as RealizedAccumulations,
    keeperFees:
      BigOrZero(end.accumulatedKeeperFees) -
      BigOrZero(start.accumulatedKeeperFees) +
      BigOrZero(firstAccumulation?.accumulationResult_keeper) +
      BigOrZero(finalAccumulation?.accumulationResult_keeper),
    positionFees:
      BigOrZero(end.accumulatedPositionFees) -
      BigOrZero(start.accumulatedPositionFees) +
      BigOrZero(firstAccumulation?.accumulationResult_positionFee) +
      BigOrZero(finalAccumulation?.accumulationResult_positionFee),
    priceImpactFees:
      BigOrZero(end.accumulatedPriceImpactFees) -
      BigOrZero(start.accumulatedPriceImpactFees) +
      BigOrZero(firstAccumulation?.priceImpactFee) +
      BigOrZero(finalAccumulation?.priceImpactFee),
    interfaceFees:
      BigOrZero(startUpdate.interfaceFee) +
      BigOrZero(end.accumulatedInterfaceFees) -
      BigOrZero(start.accumulatedInterfaceFees),
    orderFees:
      BigOrZero(startUpdate.orderFee) + BigOrZero(end.accumulatedOrderFees) - BigOrZero(start.accumulatedOrderFees),
  }

  return position
}

export type SubPositionChange = Awaited<ReturnType<typeof fetchSubPositions>>['changes'][number]
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
  graphClient,
  address,
  market,
  startVersion,
  endVersion,
  first,
  skip,
}: {
  graphClient: GraphQLClient
  address: Address
  market: Address
  startVersion: bigint
  endVersion?: bigint
  first: number
  skip: number
}) {
  const accountUpdatesQuery = gql(`
    query fetchSubPositions_AccountUpdates(
      $account: Bytes!, $market: Bytes!, $startVersion: BigInt!, $endVersion: BigInt! $first: Int!, $skip: Int!
    ) {
      updateds(
        where: { market: $market, account: $account, version_gte: $startVersion, version_lte: $endVersion },
        orderBy: version, orderDirection: desc, first: $first, skip: $skip
      ) {
        version, collateral, newMaker, newLong, newShort, valid, transactionHash, price, priceImpactFee,
        localPositionId, globalPositionId, market, account, blockNumber, blockTimestamp, protect, interfaceFee, orderFee
        side, delta
      }

      accountPositionProcesseds(
        where: {
          market: $market, account: $account, toOracleVersion_gte: $startVersion, fromOracleVersion_lte: $endVersion
        },
        orderBy: toOracleVersion, orderDirection: desc
      ) {
        accumulationResult_collateralAmount, accumulationResult_keeper, accumulationResult_positionFee, priceImpactFee
        accumulatedPnl, accumulatedFunding, accumulatedInterest, accumulatedMakerPositionFee, accumulatedValue
        side, size, fromOracleVersion, toOracleVersion, toVersionPrice, toVersionValid, collateral, blockNumber
        market
      }

      nextUpdate: updateds(
        where: { market: $market, account: $account, version_gt: $endVersion },
        orderBy: version, orderDirection: asc, first: 1
      ) {
        version, collateral, newMaker, newLong, newShort, valid, transactionHash, price, priceImpactFee,
        localPositionId, globalPositionId, market, account, blockNumber, blockTimestamp, protect, interfaceFee, orderFee
      }
    }
  `)

  const { updateds, accountPositionProcesseds, nextUpdate } = await graphClient.request(accountUpdatesQuery, {
    account: address,
    market,
    startVersion: startVersion.toString(),
    endVersion: endVersion ? endVersion.toString() : nowSeconds().toString(),
    first,
    skip,
  })

  // Pull execution price for the most recent update
  if (updateds[0] && !updateds[0].valid) {
    const price = await getPriceAtVersion({ graphClient, market, version: BigInt(updateds[0].version) })
    if (price)
      updateds[0] = {
        ...updateds[0],
        price,
        valid: BigInt(price) > 0n,
      }
  }

  const changes = updateds
    .filter((update, i) =>
      i === updateds.length - 1
        ? magnitude(update.newMaker, update.newLong, update.newShort) > 0n // skip update if it has no size
        : true,
    )
    .map((update, i, self) => {
      const accumulations = accountPositionProcesseds.filter(
        (p) =>
          BigInt(p.toOracleVersion) >= BigInt(update.version) &&
          (i > 0 ? BigInt(p.toOracleVersion) < BigInt(self[i - 1].version) : true),
      )
      return processSubPosition(update, i, self, accumulations, startVersion)
    })
    .map((change, i, self) => {
      if (change.settlementOnly) return null // Filter out settlement only changes
      if (i > 0 && self[i - 1].settlementOnly) {
        // If previous update is settlement only, merge it into this update
        const mergedAccumulations = [...self[i - 1].accumulations, ...change.accumulations]
        const realizedValues = accumulateRealized([...self[i - 1].accumulations, ...change.accumulations])
        if (change.side !== 'maker') realizedValues.pnl = realizedValues.pnl - BigInt(change.priceImpactFee)

        return {
          ...change,
          accumulations: mergedAccumulations,
          realizedValues,
        }
      }
      return change
    })
    .filter(notEmpty)

  // Check if the next update is a collateral only change, and if so pull it in as a new update that is part of this
  // position. This is done because the graph does not include collateral only updates as part of the checkpointing
  // system, but it's a nicer UX if we include them as part of the position history
  if (
    nextUpdate[0] &&
    BigInt(nextUpdate[0].collateral) < 0n &&
    magnitude(nextUpdate[0].newMaker, nextUpdate[0].newLong, nextUpdate[0].newShort) === 0n
  ) {
    if (changes[0].accumulations[0].toOracleVersion <= nextUpdate[0].version) {
      changes.unshift({
        ...nextUpdate[0],
        side: changes[0].side,
        magnitude: 0n,
        priceWithImpact: 0n,
        delta: null,
        accumulations: [],
        realizedValues: accumulateRealized([]),
        collateralOnly: true,
        settlementOnly: false,
      })
    }
  }

  return { changes, hasMore: updateds.length === first }
}

/**
 * Fetches the trade history for a given address. Limited to a 7 day window.
 * @param address Wallet Address
 * @param fromTs start timestamp in seconds (defaults to 7 days before toTs)
 * @param toTs end timestamp in seconds (defaults to now)
 * @param graphClient GraphQLClient
 * @returns User's trade history.
 */
export async function fetchTradeHistory({
  graphClient,
  address,
  fromTs,
  toTs,
}: {
  graphClient: GraphQLClient
  address: Address
  fromTs?: bigint
  toTs?: bigint
}) {
  const maxTimeRange = Day * 7n
  const now = BigInt(nowSeconds())
  if (!toTs) toTs = now
  if (!fromTs) fromTs = toTs - maxTimeRange

  if (toTs - fromTs > maxTimeRange) {
    throw new Error('The time range exceeds the maximum allowed range of 7 days.')
  }
  // TODO(arjun): update this query to use trades entity in subgraph when available
  const tradeHistoryQuery = gql(`
  query fetchTradeHistory($account: Bytes!, $fromTs: BigInt, $toTs: BigInt, $first: Int!, $skip: Int!) {
    accountPositionProcesseds(
      where: { account: $account, toOracleVersion_gte: $fromTs, toOracleVersion_lt: $toTs },
      orderBy: toOracleVersion,
      orderDirection: desc,
      first: $first,
      skip: $skip
    ) {
      accumulationResult_collateralAmount, accumulationResult_keeper, accumulationResult_positionFee, priceImpactFee
      accumulatedPnl, accumulatedFunding, accumulatedInterest, accumulatedMakerPositionFee, accumulatedValue
      side, size, fromOracleVersion, toOracleVersion, toVersionPrice, toVersionValid, collateral, blockNumber,
      market, update {
        version, collateral, newMaker, newLong, newShort, valid, transactionHash, price, priceImpactFee,
        localPositionId, globalPositionId, market, account, blockNumber, blockTimestamp, protect, interfaceFee, orderFee, side, delta
      }
    }
  }
  `)

  const { accountPositionProcesseds } = await queryAll(async (pageNumber) =>
    graphClient.request(tradeHistoryQuery, {
      account: address,
      first: GraphDefaultPageSize,
      skip: pageNumber * GraphDefaultPageSize,
      fromTs: fromTs.toString(),
      toTs: toTs.toString(),
    }),
  )

  const marketAccountPositionProcesseds = accountPositionProcesseds.reduce(
    (acc, entity) => {
      const market = getAddress(entity.market)
      if (!acc[market]) acc[market] = []
      acc[market].push(entity)
      return acc
    },
    {} as Record<Address, typeof accountPositionProcesseds>,
  )

  type Update = {
    update: NonNullable<(typeof accountPositionProcesseds)[number]['update']>
    accumulations: typeof accountPositionProcesseds
  }

  const trades = Object.entries(marketAccountPositionProcesseds).reduce(
    (acc, [market, entities]) => {
      const updates: Update[] = []
      entities.forEach((entity) => {
        if (
          entity.update &&
          entity.update.side !== 'none' &&
          entity.update.delta !== '0' &&
          entity.update.collateral !== '0'
        ) {
          updates.push({ update: entity.update, accumulations: [entity] })
        } else {
          const update = updates.at(-1) ?? {
            update: entities.find(
              (e) => e.update && e.update.side !== 'none' && e.update.delta !== '0' && e.update.collateral !== '0',
            ),
            accumulations: [] as typeof accountPositionProcesseds,
          }
          if (update.update) {
            update.accumulations.push(entity)
          }
        }
      })

      acc[getAddress(market)] = updates.map(({ update, accumulations }, i, self) => {
        return processSubPosition(
          update,
          i,
          self.map((u) => u.update),
          accumulations,
        )
      })
      return acc
    },
    {} as Record<Address, SubPositionChange[]>,
  )
  return trades
}

type SubPositionUpdate = NonNullable<FetchSubPositions_AccountUpdatesQuery['updateds'][number]>
type SubPositionAccumulations = NonNullable<FetchSubPositions_AccountUpdatesQuery['accountPositionProcesseds']>

function processSubPosition(
  update: SubPositionUpdate,
  updateIndex: number,
  allUpdates: SubPositionUpdate[],
  accumulations: SubPositionAccumulations,
  startVersion?: bigint,
) {
  const magnitude_ = magnitude(update.newMaker, update.newLong, update.newShort)
  const side = positionSide(update.newMaker, update.newLong, update.newShort)
  const prevValid = allUpdates.find((u) => u.version < update.version && u.valid)
  const prevMagnitude = prevValid ? magnitude(prevValid.newMaker, prevValid.newLong, prevValid.newShort) : null
  const prevSide = prevValid
    ? positionSide(prevValid.newMaker, prevValid.newLong, prevValid.newShort)
    : PositionSide.none

  const delta =
    (prevValid && update.valid) || (prevValid && !update.valid && updateIndex === 0)
      ? magnitude_ - magnitude(prevValid.newMaker, prevValid.newLong, prevValid.newShort)
      : BigInt(update.version) === startVersion || updateIndex === allUpdates.length - 1
        ? magnitude_
        : null

  const realizedValues = accumulateRealized(accumulations)
  const collateralOnly = delta === 0n && BigOrZero(update.collateral) !== 0n
  const settlementOnly =
    BigOrZero(update.collateral) === 0n &&
    updateIndex !== allUpdates.length - 1 &&
    !update.valid &&
    prevMagnitude !== null &&
    magnitude_ - prevMagnitude === 0n

  let priceWithImpact = BigInt(update.price)

  // Handle price impact. This is the price plus/minus the price impact fee divided by the delta. This is
  // directional - long opens and short closes increase the price, short opens and long closes decrease the price
  if (!!delta && (side === 'long' || prevSide === 'long'))
    priceWithImpact = priceWithImpact + Big6Math.div(BigOrZero(update.priceImpactFee), delta)
  if (!!delta && (side === 'short' || prevSide === 'short'))
    priceWithImpact = priceWithImpact - Big6Math.div(BigOrZero(update.priceImpactFee), delta)
  // If taker, subtract the price impact fee from the realized pnl
  if (side !== 'maker') realizedValues.pnl = realizedValues.pnl - BigInt(update.priceImpactFee)
  return {
    ...update,
    side,
    magnitude: magnitude_,
    priceWithImpact,
    delta,
    accumulations,
    realizedValues,
    collateralOnly,
    settlementOnly,
  }
}

export type OpenOrder = NonNullable<NonNullable<Awaited<ReturnType<typeof fetchOpenOrders>>>>['openOrders'][number]
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
  graphClient,
  markets,
  address,
  pageParam = 0,
  pageSize = 100,
  isMaker,
}: {
  graphClient: GraphQLClient
  markets: Markets
  address: Address
  pageParam: number
  pageSize: number
  isMaker?: boolean
}) {
  const queryOpenOrders = gql(`
  query OpenOrders($account: Bytes!, $markets: [Bytes!]!, $side: [Int!]!, $first: Int!, $skip: Int!) {
    multiInvokerOrderPlaceds(
      where: { account: $account, market_in: $markets, cancelled: false, executed: false, order_side_in: $side },
      orderBy: nonce, orderDirection: desc, first: $first, skip: $skip
    ) {
        account, market, nonce, order_side, order_comparison, order_fee, order_price, order_delta
        blockNumber, blockTimestamp, transactionHash
      }
  }
`)

  const { multiInvokerOrderPlaceds: openOrders } = await graphClient.request(queryOpenOrders, {
    account: address,
    markets: markets.map(({ marketAddress }) => marketAddress),
    first: pageSize,
    skip: pageParam * pageSize,
    side: isMaker ? [0, 3] : [1, 2, 3], // 3 = collateral withdrawal
  })

  const associatedCollateral = gql(`
  query AssociatedCollateral($account: Bytes!, $markets: [Bytes!]!, $transactionHashes: [Bytes!]!, $first: Int!, $skip: Int!) {
    updateds(
      where: { account: $account, market_in: $markets, transactionHash_in: $transactionHashes, collateral_gt: 0 },
      orderBy: blockTimestamp, orderDirection: desc, first: $first, skip: $skip
    ) {
      market, collateral, transactionHash
    }
  }
  `)

  // Only look at the transaction hashes of the open orders that have a positive position delta
  const transactionHashes = unique(
    openOrders
      .filter(({ order_delta, order_side }) => BigInt(order_side) !== 3n && BigInt(order_delta) > 0n)
      .map((o) => o.transactionHash),
  )

  let collateralUpdateMap = {} as Record<string, bigint>
  if (transactionHashes.length > 0) {
    const { updateds: collateralUpdates } = await queryAll((page) =>
      graphClient.request(associatedCollateral, {
        account: address,
        markets: markets.map(({ marketAddress }) => marketAddress),
        transactionHashes,
        first: pageSize,
        skip: page * pageSize,
      }),
    )

    collateralUpdateMap = collateralUpdates.reduce((acc, u) => {
      const key = `${u.transactionHash}_${u.market}`.toLowerCase()
      if (!acc[key]) acc[key] = 0n
      acc[key] += BigInt(u.collateral)
      return acc
    }, collateralUpdateMap)
  }

  const openOrdersWithCollateral = openOrders.map((order) => {
    const collateral = collateralUpdateMap[`${order.transactionHash}_${order.market}`.toLowerCase()]
    return {
      ...order,
      linkedDeposit: BigInt(order.order_delta) > 0n ? collateral ?? 0n : 0n,
    }
  })

  return {
    openOrders: openOrdersWithCollateral,
    nextPageParam: openOrders.length === pageSize ? pageParam + 1 : undefined,
  }
}

/**
 * Fetches the 24hr volume data for a given market
 * @param market Market Address
 * @param graphClient GraphQLClient
 * @returns Market 24hr volume data.
 */
export async function fetchMarket24hrData({ graphClient, market }: { graphClient: GraphQLClient; market: Address }) {
  const volumeRes = await fetchMarkets24hrVolume({ graphClient, markets: [market] })
  return {
    volume: volumeRes[market] || [],
  }
}
/**
 * Fetches the 24hr volume data for a list of market
 * @param markets List of market Addresses
 * @param graphClient GraphQLClient
 * @returns Markets 24hr volume data.
 */
export async function fetchMarkets24hrVolume({
  graphClient,
  markets,
}: {
  graphClient: GraphQLClient
  markets: Address[]
}) {
  const { from, to } = last24hrBounds()
  const query = gql(`
    query Markets24hrVolume($markets: [Bytes!]!, $from: BigInt!, $to: BigInt!) {
      volume: bucketedVolumes(
        where:{bucket: hourly, market_in: $markets, periodStartTimestamp_gte: $from, periodStartTimestamp_lte: $to}
        orderBy: periodStartTimestamp
        orderDirection: asc
      ) {
        periodStartTimestamp
        longNotional
        shortNotional
        market
      }
    }
  `)

  const volumeData = await graphClient.request(query, {
    markets,
    from: from.toString(),
    to: to.toString(),
  })

  return volumeData.volume.reduce(
    (acc, v) => {
      if (!acc[getAddress(v.market)]) acc[getAddress(v.market)] = [] as (typeof acc)[Address]
      acc[getAddress(v.market)].push({
        periodStartTimestamp: v.periodStartTimestamp,
        longNotional: v.longNotional,
        shortNotional: v.shortNotional,
        market: v.market,
      })
      return acc
    },
    {} as Record<
      Address,
      { periodStartTimestamp: string; longNotional: string; shortNotional: string; market: string }[]
    >,
  )
}
/**
 * Fetches the 7d data for a given market
 * @param market Market Address
 * @param graphClient GraphQLClient
 * @returns Market 7d data.
 */
export async function fetchMarket7dData({ graphClient, market }: { graphClient: GraphQLClient; market: Address }) {
  const { to, from } = last7dBounds()

  const query = gql(`
    query Market7DayVolume($market: Bytes!, $from: BigInt!, $to: BigInt!) {
      volume: bucketedVolumes(
        where:{bucket: daily, market: $market, periodStartTimestamp_gte: $from, periodStartTimestamp_lte: $to}
        orderBy: periodStartTimestamp, orderDirection: asc
      ) {
        market
        longNotional
        shortNotional
      }

      hourlyFunding: bucketedVolumes(
        where: {bucket: hourly, market: $market, periodStartTimestamp_gte: $from, periodStartTimestamp_lte: $to}
        orderBy: periodStartTimestamp, orderDirection: asc
      ) {
        market
        weightedLongFunding
        weightedLongInterest
        weightedMakerFunding
        weightedMakerInterest
        totalWeight
        periodStartTimestamp
        periodEndTimestamp
      }

      firstNonZeroFunding: bucketedVolumes(
        where: {
          and: [
            {bucket: hourly, market: $market, periodStartTimestamp_lt: $from },
            {or: [
              {weightedLongFunding_gt: 0 },
              {weightedLongInterest_gt: 0 },
            ]}
          ]
        }
        orderBy: periodStartTimestamp, orderDirection: desc, first: 1
      ) {
        market
        weightedLongFunding
        weightedLongInterest
        weightedMakerFunding
        weightedMakerInterest
        totalWeight
        periodStartTimestamp
        periodEndTimestamp
      }

      currentAccumulator: marketAccumulators(
        where: { market: $market, latest: true }
      ) {
        market, fundingMaker, interestMaker, positionFeeMaker
      }

      startAccumulator: marketAccumulators(
        where: { market: $market, version_gte: $from }, first: 1, orderBy: version, orderDirection: asc
      ) {
        market, fundingMaker, interestMaker, positionFeeMaker, version
      }
    }
  `)

  const { volume, hourlyFunding, firstNonZeroFunding, currentAccumulator, startAccumulator } =
    await graphClient.request(query, {
      market: market,
      from: from.toString(),
      to: to.toString(),
    })

  const takerVolumes = {
    long: sum(volume.map((v) => BigInt(v.longNotional))),
    short: sum(volume.map((v) => BigInt(v.shortNotional))),
  }

  const fundingRates = hourlyFunding
    .map((f, i) => {
      let [takerTotal, makerTotal, totalWeight] = [
        BigOrZero(f?.weightedLongFunding) + BigOrZero(f?.weightedLongInterest),
        BigOrZero(f?.weightedMakerFunding) + BigOrZero(f?.weightedMakerInterest),
        BigOrZero(f?.totalWeight),
      ]

      // Set the initial rate to the first non-zero funding rate if the first bucket is zero
      if (i === 0 && takerTotal === 0n) {
        takerTotal =
          BigOrZero(firstNonZeroFunding.at(0)?.weightedLongFunding) +
          BigOrZero(firstNonZeroFunding.at(0)?.weightedLongInterest)
        totalWeight = BigOrZero(firstNonZeroFunding.at(0)?.totalWeight)
      }
      if (i === 0 && makerTotal === 0n) {
        makerTotal =
          BigOrZero(firstNonZeroFunding.at(0)?.weightedMakerFunding) +
          BigOrZero(firstNonZeroFunding.at(0)?.weightedMakerInterest)
      }

      const scaleFactor =
        totalWeight !== 0n ? Big6Math.fromFloatString((Number(Hour) / Number(totalWeight)).toString()) : 0n
      const takerUnscaledRate = totalWeight !== 0n ? takerTotal / totalWeight : 0n
      const makerUnscaledRate = totalWeight !== 0n ? makerTotal / totalWeight : 0n
      const takerHrRate = takerUnscaledRate * scaleFactor
      const makerHrRate = makerUnscaledRate * scaleFactor
      return { timestamp: BigInt(f.periodStartTimestamp), takerHrRate, makerHrRate }
    })
    .filter(notEmpty)

  // Scale accumulation values to fill the 7d window
  const accumulatorScaleFactor = Big6Math.fromFloatString(
    (Number(7n * Day) / Number(to - Number(startAccumulator.at(0)?.version ?? from))).toString(),
  )
  return {
    takerVolumes,
    fundingRates,
    // Accumulations are the delta between now and start, scaled to fill the 7d window
    makerAccumulation: {
      funding: Big6Math.mul(
        BigOrZero(currentAccumulator[0]?.fundingMaker) - BigOrZero(startAccumulator[0]?.fundingMaker),
        accumulatorScaleFactor,
      ),
      interest: Big6Math.mul(
        BigOrZero(currentAccumulator[0]?.interestMaker) - BigOrZero(startAccumulator[0]?.interestMaker),
        accumulatorScaleFactor,
      ),
      positionFee: Big6Math.mul(
        BigOrZero(currentAccumulator[0]?.positionFeeMaker) - BigOrZero(startAccumulator[0]?.positionFeeMaker),
        accumulatorScaleFactor,
      ),
    },
  }
}

export const getPriceAtVersion = async ({
  graphClient,
  market,
  version,
}: {
  graphClient: GraphQLClient
  market: Address
  version: bigint
}) => {
  const query = gql(`
    query PriceAtVersion($versionId: ID!) {
      marketVersionPrice(id: $versionId) { price }
    }
  `)

  const res = await graphClient.request(query, {
    versionId: `${market}:${version.toString()}`.toLowerCase(),
  })

  return res.marketVersionPrice?.price ?? 0n
}
