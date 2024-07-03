import { gql } from '../types/gql'

export const PositionDataFragment = gql(`
  fragment PositionData on Position {
    marketAccount { currentOrderId, market { id } }, startCollateral, startMaker, startLong, startShort, openSize, openNotional, openOffset, netDeposits, positionId: nonce, startVersion, closeSize, closeNotional, closeOffset
    accumulation {
      collateral_accumulation, fee_accumulation, collateral_subAccumulation_offset, collateral_subAccumulation_pnl,
      collateral_subAccumulation_funding, collateral_subAccumulation_interest, collateral_subAccumulation_makerPositionFee, collateral_subAccumulation_makerExposure, fee_subAccumulation_settlement
      fee_subAccumulation_trade, fee_subAccumulation_additive, fee_subAccumulation_triggerOrder, fee_subAccumulation_liquidation
    }
    liqOrders: orders(where: { liquidation: true }) { liquidation }
    firstOrder: orders(first: 1, orderBy: orderId, orderDirection: asc) { executionPrice }
  }
`)

export const OrderDataFragbment = gql(`
  fragment OrderData on Order {
    orderId, market { id }, account { id }, maker, long, short, collateral, executionPrice, oracleVersion { timestamp, valid }, newMaker, newLong, newShort, liquidation, transactionHashes, startCollateral
    position { startMaker, startLong, startShort }
    accumulation {
      collateral_accumulation, fee_accumulation, collateral_subAccumulation_offset, collateral_subAccumulation_pnl,
      collateral_subAccumulation_funding, collateral_subAccumulation_interest, collateral_subAccumulation_makerPositionFee, collateral_subAccumulation_makerExposure, fee_subAccumulation_settlement
      fee_subAccumulation_trade, fee_subAccumulation_additive, fee_subAccumulation_triggerOrder, fee_subAccumulation_liquidation
    }
  }
`)

export const QueryLatestMarketAccountPosition = gql(`
  query QueryLatestAccountPosition($account: String!, $markets: [String!]!, $accumulatorIDs: [Bytes!]!) {
    marketAccounts(where: { account: $account, market_in: $markets }) {
      market { id }, collateral, maker, long, short, latestVersion
      positions(first: 1, orderBy: nonce, orderDirection: desc) {
        ...PositionData
      }

      accumulators: market {
        current: accumulators(first: 1, orderBy: toVersion, orderDirection: desc) {
          pnlMaker, pnlLong, pnlShort, fundingMaker, fundingLong, fundingShort,, interestMaker, interestLong, interestShort, positionFeeMaker, exposureMaker
        }
      }
    }

    startAccumulators: marketAccumulators(where: {id_in: $accumulatorIDs}) {
      market { id }, pnlMaker, pnlLong, pnlShort, fundingMaker, fundingLong, fundingShort,, interestMaker, interestLong, interestShort, positionFeeMaker, exposureMaker
    }
  }
`)

export const QueryMarketAccountTakerPositions = gql(`
  query QueryMarketAccountTakerPositions($account: String!, $markets: [String!]!, $fromTs: BigInt, $toTs: BigInt, $first: Int!, $skip: Int!) {
    positions(where: { and: [{ marketAccount_: {account: $account, market_in: $markets}, maker: 0, long: 0, short: 0, startVersion_gte: $fromTs, startVersion_lt: $toTs }, { or: [{ startLong_gt: 0 }, { startShort_gt: 0 }]}]}, orderBy: startVersion, orderDirection: desc, first: $first, skip: $skip) {
      ...PositionData
    }
  }
`)

export const QueryMarketAccountMakerPositions = gql(`
  query QueryMarketAccountMakerPositions($account: String!, $markets: [String!]!, $fromTs: BigInt, $toTs: BigInt, $first: Int!, $skip: Int!) {
    positions(where: { marketAccount_: {account: $account, market_in: $markets}, maker: 0, long: 0, short: 0, startMaker_gt: 0, startVersion_gte: $fromTs, startVersion_lt: $toTs }, orderBy: startVersion, orderDirection: desc, first: $first, skip: $skip) {
      ...PositionData
    }
  }
`)

export const QueryMarketAccountPositionOrders = gql(`
  query QueryMarketAccountPositionOrders($account: String!, $market: String!, $positionId: BigInt!, $first: Int!, $skip: Int!) {
    orders(where: { account: $account, market: $market, position_: { nonce: $positionId }}, first: $first, skip: $skip, orderBy: orderId, orderDirection: desc) {
      ...OrderData
    }
  }
`)

export const QueryAccountOrders = gql(`
  query QueryMarketOrders($account: String! $fromTs: BigInt, $toTs: BigInt, $first: Int!, $skip: Int!) {
    orders(where: { account: $account, oracleVersion_: { timestamp_gte: $fromTs, timestamp_lt: $toTs }}, first: $first, skip: $skip, orderBy: oracleVersion__timestamp, orderDirection: desc) {
      ...OrderData
    }
  }
`)

export const QueryMarketAccumulationData = gql(`
  query QueryMarketAccumulationData($markets: [Bytes!]!, $fromTs: BigInt!, $toTs: BigInt!, $bucket: Bucket!) {
    marketData: markets(where: { id_in: $markets }) {
      id

      accumulations(where: { bucket: $bucket, timestamp_gte: $fromTs, timestamp_lte: $toTs }
        first: 1000, orderBy: timestamp, orderDirection: asc
      ) {
        timestamp, longNotional, shortNotional, fundingRateMaker, fundingRateLong, fundingRateShort, interestRateMaker, interestRateLong, interestRateShort
      }

      fromAccumulator: accumulators(where: { toVersion_gte: $fromTs }, first: 1, orderBy: toVersion, orderDirection: asc) {
        fundingMaker, interestMaker, positionFeeMaker, exposureMaker, toVersion
      }

      toAccumulator: accumulators(where: { toVersion_lte: $toTs }, first: 1, orderBy: toVersion, orderDirection: desc) {
        fundingMaker, interestMaker, positionFeeMaker, exposureMaker, toVersion
      }
    }
  }
`)

export const QueryMultiInvokerOpenOrders = gql(`
  query QueryMultiInvokerOpenOrders($account: Bytes!, $markets: [Bytes!]!, $side: [Int!]!, $first: Int!, $skip: Int!) {
    multiInvokerTriggerOrders(
      where: { account: $account, market_in: $markets, cancelled: false, executed: false, triggerOrderSide_in: $side },
      orderBy: nonce, orderDirection: desc, first: $first, skip: $skip
    ) {
        account, market, nonce, triggerOrderSide, triggerOrderComparison, triggerOrderFee, triggerOrderPrice, triggerOrderDelta
        blockTimestamp, transactionHash, associatedOrder { collateral }
      }
  }
`)
