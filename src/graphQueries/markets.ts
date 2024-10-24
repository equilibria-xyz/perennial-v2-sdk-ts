import { gql } from '../types/gql'

export const PositionDataFragment = gql(`
  fragment PositionData on Position {
    marketAccount { currentOrderId, market { id } }, startCollateral, startMaker, startLong, startShort, openSize, openNotional, openOffset, netDeposits, positionId: nonce, startVersion, closeSize, closeNotional, closeOffset, trades
    accumulation {
      collateral_accumulation, fee_accumulation, collateral_subAccumulation_offset, collateral_subAccumulation_pnl,
      collateral_subAccumulation_funding, collateral_subAccumulation_interest, collateral_subAccumulation_makerPositionFee, collateral_subAccumulation_makerExposure, collateral_subAccumulation_priceOverride, fee_subAccumulation_settlement
      fee_subAccumulation_trade, fee_subAccumulation_additive, fee_subAccumulation_triggerOrder, fee_subAccumulation_liquidation
    }
    openOrder: orders(first: 1, orderBy: orderId, orderDirection: asc) { executionPrice, transactionHashes }
    closeOrder: orders(where: { newMaker: 0, newLong: 0, newShort: 0, oracleVersion_: { valid: true } }, first: 1, orderBy: orderId, orderDirection: asc) { oracleVersion { timestamp }, liquidation }
  }
`)

export const OrderDataFragbment = gql(`
  fragment OrderData on Order {
    orderId, market { id }, account { id }, maker, long, short, collateral, executionPrice, oracleVersion { timestamp, valid }, newMaker, newLong, newShort, liquidation, transactionHashes, startCollateral, depositTotal, withdrawalTotal, guaranteePrice
    position { startMaker, startLong, startShort }
    accumulation {
      collateral_accumulation, fee_accumulation, collateral_subAccumulation_offset, collateral_subAccumulation_pnl,
      collateral_subAccumulation_funding, collateral_subAccumulation_interest, collateral_subAccumulation_makerPositionFee, collateral_subAccumulation_makerExposure, collateral_subAccumulation_priceOverride, fee_subAccumulation_settlement
      fee_subAccumulation_trade, fee_subAccumulation_additive, fee_subAccumulation_triggerOrder, fee_subAccumulation_liquidation
    }
  }
`)

export const QueryLatestMarketAccountPosition = gql(`
  query QueryLatestAccountPosition($account: String!, $markets: [String!]!, $latestVersions: [BigInt!]!) {
    marketAccounts(where: { account: $account, market_in: $markets }) {
      market { id }, collateral, maker, long, short, latestVersion
      positions(first: 1, orderBy: nonce, orderDirection: desc) {
        ...PositionData
      }

      accumulators: market {
        current: accumulators(first: 1, orderBy: toVersion, orderDirection: desc) {
          pnlMaker, pnlLong, pnlShort, fundingMaker, fundingLong, fundingShort,, interestMaker, interestLong, interestShort, positionFeeMaker, exposureMaker
        }

        start: accumulators(where: { fromVersion_in: $latestVersions }, orderBy: fromVersion, orderDirection: asc) {
          pnlMaker, pnlLong, pnlShort, fundingMaker, fundingLong, fundingShort,, interestMaker, interestLong, interestShort, positionFeeMaker, exposureMaker, fromVersion
        }
      }
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

      fromAccumulator: accumulators(where: { fromVersion_gte: $fromTs }, first: 1, orderBy: fromVersion, orderDirection: asc) {
        fundingMaker, interestMaker, positionFeeMaker, exposureMaker, fromVersion
      }

      toAccumulator: accumulators(where: { toVersion_lte: $toTs }, first: 1, orderBy: toVersion, orderDirection: desc) {
        fundingMaker, interestMaker, positionFeeMaker, exposureMaker, toVersion
      }
    }
  }
`)

export const QueryOpenTriggerOrders = gql(`
  query QueryOpenTriggerOrders($account: Bytes!, $markets: [Bytes!]!, $side: [Int!]!, $first: Int!, $skip: Int!) {
    multiInvokerTriggerOrders(
      where: { account: $account, market_in: $markets, cancelled: false, executed: false, triggerOrderSide_in: $side },
      orderBy: nonce, orderDirection: desc, first: $first, skip: $skip
    ) {
        source, account, market, nonce, triggerOrderSide, triggerOrderComparison, triggerOrderFee, triggerOrderPrice, triggerOrderDelta
        blockTimestamp, transactionHash, associatedOrder { collateral, depositTotal, withdrawalTotal }
      }
  }
`)
