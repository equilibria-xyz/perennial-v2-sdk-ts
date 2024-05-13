import { EvmPriceServiceConnection } from '@perennial/pyth-evm-js'
import { GraphQLClient } from 'graphql-request'
import { Address, PublicClient, WalletClient } from 'viem'

import { SupportedChainId, chainIdToChainMap } from '../../constants'
import { MarketsAccountCheckpointsQuery } from '../../types/gql/graphql'
import { MarketOracles, MarketSnapshot, UserMarketSnapshot, fetchMarketOracles, fetchMarketSnapshots } from './chain'
import {
  Markets,
  fetchActivePositionHistory,
  fetchActivePositionPnl,
  fetchHistoricalPositions,
  fetchMarket7dData,
  fetchMarket24hrData,
  fetchMarkets24hrVolume,
  fetchOpenOrders,
  fetchSubPositions,
  fetchTradeHistory,
} from './graph'
import {
  BuildModifyPositionTxArgs,
  BuildPlaceOrderTxArgs,
  BuildSubmitVaaTxArgs,
  buildCancelOrderTx,
  buildModifyPositionTx,
  buildPlaceOrderTx,
  buildSubmitVaaTx,
} from './tx'

type OmitBound<T> = Omit<T, 'chainId' | 'graphClient' | 'publicClient' | 'pythClient'>
export class MarketsModule {
  /**
   * Markets module class
   * @param config SDK configuration
   * @param config.chainId {@link SupportedChainId}
   * @param config.publicClient Public Client
   * @param config.graphClient GraphQL Client
   * @param config.pythClient Pyth Client
   * @param config.walletClient Wallet Client
   * @returns Markets module instance
   */
  private config: {
    chainId: SupportedChainId
    graphClient: GraphQLClient
    publicClient: PublicClient
    pythClient: EvmPriceServiceConnection
    walletClient?: WalletClient
  }

  constructor(config: {
    chainId: SupportedChainId
    publicClient: PublicClient
    graphClient: GraphQLClient
    pythClient: EvmPriceServiceConnection
    walletClient?: WalletClient
  }) {
    this.config = config
  }

  get read() {
    return {
      /**
       * Fetches the {@link MarketOracles}
       * @returns The {@link MarketOracles}.
       */
      marketOracles: () => {
        return fetchMarketOracles(this.config.chainId, this.config.publicClient)
      },
      /**
       * Fetches the {@link MarketSnapshots}
       * @param address Wallet Address
       * @param marketOracles {@link MarketOracles}
       * @param onError Error callback
       * @param onSuccess Success callback
       * @returns The {@link MarketSnapshots}.
       */
      marketSnapshots: (args: {
        address: Address
        marketOracles?: MarketOracles
        onError?: () => void
        onSuccess?: () => void
      }) => {
        return fetchMarketSnapshots({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          pythClient: this.config.pythClient,
          ...args,
        })
      },
      /**
       * Fetches position PnL for a given market and Address
       * @param address Wallet Address
       * @param market Market Address
       * @param userMarketSnapshot {@link UserMarketSnapshot}
       * @param marketSnapshot {@link MarketSnapshot}
       * @param includeClosedWithCollateral Include closed positions with collateral
       * @returns User's PnL for an active position.
       */
      activePositionPnl: (args: {
        market: Address
        marketSnapshot: MarketSnapshot
        userMarketSnapshot: UserMarketSnapshot
        address: Address
        includeClosedWithCollateral?: boolean
      }) => {
        return fetchActivePositionPnl({
          graphClient: this.config.graphClient,
          ...args,
        })
      },
      /**
       * Fetches active position history for a given address
       * @param address Wallet Address
       * @param market Market Address
       * @param pageParam Page number
       * @param pageSize Page size
       * @returns User's position history for an active position.
       */
      activePositionHistory: (args: { market: Address; address: Address; pageParam: number; pageSize: number }) => {
        return fetchActivePositionHistory({
          graphClient: this.config.graphClient,
          ...args,
        })
      },
      /**
       * Fetches the position history for a given address
       * @param address Wallet Address
       * @param markets List of {@link Markets} to fetch position history for
       * @param pageParam Page number
       * @param pageSize Page size
       * @returns User's position history.
       */
      historicalPositions: (args: {
        markets: Markets
        address: Address
        pageSize: number
        pageParam?: { page: number; checkpoints?: MarketsAccountCheckpointsQuery }
        maker?: boolean
      }) => {
        return fetchHistoricalPositions({
          graphClient: this.config.graphClient,
          ...args,
        })
      },
      /**
       * Fetches the sub positions activity for a given position
       * @param address Wallet Address
       * @param market Market Address
       * @param startVersion BigInt - Start oracle version number
       * @param endVersion BigInt - End oracle version number
       * @param first Number of entries to fetch
       * @param skip Number of entries to skip
       * @returns User's sub positions.
       */
      subPositions: (args: {
        address: Address
        market: Address
        startVersion: bigint
        endVersion?: bigint
        first: number
        skip: number
      }) => {
        return fetchSubPositions({
          graphClient: this.config.graphClient,
          ...args,
        })
      },
      /**
       * Fetches the trade history for a given address. Limited to a 7 day window.
       * @param address Wallet Address
       * @param fromTs start timestamp in milliseconds
       * @param toTs end timestamp in milliseconds
       * @returns User's trade history.
       */
      tradeHistory: (args: { address: Address; fromTs?: bigint; toTs?: bigint }) => {
        return fetchTradeHistory({
          graphClient: this.config.graphClient,
          ...args,
        })
      },
      /**
       * Fetches the open orders for a given address
       * @param address Wallet Address
       * @param markets List of {@link Markets} to fetch open orders for
       * @param pageParam Page number
       * @param pageSize Page size
       * @returns User's open orders.
       */
      openOrders: (args: {
        markets: Markets
        address: Address
        pageParam: number
        pageSize: number
        isMaker?: boolean
      }) => {
        return fetchOpenOrders({
          graphClient: this.config.graphClient,
          ...args,
        })
      },
      /**
       * Fetches the 24hr volume data for a given market
       * @param market Market Address
       * @returns Market 24hr volume data.
       */
      market24hrData: ({ market }: { market: Address }) => {
        return fetchMarket24hrData({
          graphClient: this.config.graphClient,
          market,
        })
      },
      /**
       * Fetches the 24hr volume data for a list of market
       * @param markets List of market Addresses
       * @returns Markets 24hr volume data.
       */
      markets24hrData: ({ markets }: { markets: Address[] }) => {
        return fetchMarkets24hrVolume({
          graphClient: this.config.graphClient,
          markets,
        })
      },
      /**
       * Fetches the 7d data for a given market
       * @param market Market Address
       * @returns Market 7d data.
       */
      market7dData: ({ market }: { market: Address }) => {
        return fetchMarket7dData({
          graphClient: this.config.graphClient,
          market,
        })
      },
    }
  }

  get build() {
    return {
      /**
       * Build a modify position transaction. Can be used to increase/decrease an
       * existing position, open/close a position and deposit or withdraw collateral.
       * @param marketAddress Market Address
       * @param address Wallet Address
       * @param marketSnapshots {@link MarketSnapshots}
       * @param marketOracles {@link MarketOracles}
       * @param collateralDelta BigInt - Collateral delta
       * @param positionAbs BigInt - Absolute size of desired position
       * @param positionSide {@link PositionSide}
       * @param stopLoss BigInt - Optional stop loss price to fully close the position
       * @param takeProfit BigInt - Optional take profit price to fully close the position
       * @param settlementFee BigInt - settlement fee
       * @param cancelOrderDetails List of {@link OpenOrder[]} to cancel when modifying the position
       * @param absDifferenceNotional BigInt - Absolute difference in notional
       * @param interfaceFee Object consisting of interfaceFee, referrerFee and ecosystemFee amounts
       * @param interfaceFeeRate {@link InterfaceFeeRate}
       * @param referralFeeRate {@link ReferrerInterfaceFeeInfo}
       * @returns Modify position transaction data.
       */
      modifyPosition: (args: OmitBound<BuildModifyPositionTxArgs>) => {
        return buildModifyPositionTx({
          publicClient: this.config.publicClient,
          chainId: this.config.chainId,
          pythClient: this.config.pythClient,
          ...args,
        })
      },
      /**
       * Build a submit VAA transaction
       * @param marketAddress Market Address
       * @param address Wallet Address
       * @param marketSnapshots {@link MarketSnapshots}
       * @param marketOracles {@link MarketOracles}
       * @returns Submit VAA transaction data.
       */
      submitVaa: ({ marketAddress, marketOracles, address }: OmitBound<BuildSubmitVaaTxArgs>) => {
        return buildSubmitVaaTx({
          chainId: this.config.chainId,
          pythClient: this.config.pythClient,
          marketAddress,
          marketOracles,
          address,
        })
      },
      /**
       * Build a place order transaction. Can be used to set limit, stop loss and
       * take profit orders.
       * @param address Wallet Address
       * @param marketAddress Market Address
       * @param marketOracles {@link MarketOracles}
       * @param marketSnapshots {@link MarketSnapshots}
       * @param orderType {@link OrderTypes}
       * @param limitPrice BigInt - Limit price
       * @param stopLoss BigInt - Stop price
       * @param takeProfit BigInt - Take profit price
       * @param side Order side
       * @param collateralDelta BigInt - Collateral delta
       * @param delta BigInt - Position size delta
       * @param positionAbs BigInt - Desired absolute position size
       * @param selectedLimitComparison Trigger comparison for order execution. See {@link TriggerComparison}
       * @param referralFeeRate {@link ReferrerInterfaceFeeInfo}
       * @param interfaceFeeRate {@link InterfaceFeeRate}
       * @param cancelOrderDetails {@link CancelOrderDetails}
       * @param onCommitmentError Callback for commitment error
       * @returns Place order transaction data.
       */
      placeOrder: (args: OmitBound<BuildPlaceOrderTxArgs>) => {
        return buildPlaceOrderTx({
          chainId: this.config.chainId,
          pythClient: this.config.pythClient,
          publicClient: this.config.publicClient,
          ...args,
        })
      },
      /**
       * Build a cancel order transaction
       * @param orderDetails {@link CancelOrderTuple[]} List of order details (as a tuple of Address and order nonce) to cancel
       * @returns Cancel order transaction data.
       */
      cancelOrder: (orderDetails: [Address, bigint][]) => {
        return buildCancelOrderTx({
          chainId: this.config.chainId,
          orderDetails,
        })
      },
    }
  }

  get write() {
    const walletClient = this.config.walletClient
    if (!walletClient || !walletClient.account) {
      throw new Error('Wallet client required for write methods.')
    }

    const { chainId } = this.config
    const address = walletClient.account

    const txOpts = { account: address, chainId, chain: chainIdToChainMap[chainId] }

    return {
      /**
       * Send a modify position transaction. Can be used to increase/decrease an
       * existing position, open/close a position and deposit or withdraw collateral.
       * @param marketAddress Market Address
       * @param address Wallet Address
       * @param marketSnapshots {@link MarketSnapshots}
       * @param marketOracles {@link MarketOracles}
       * @param collateralDelta BigInt - Collateral delta
       * @param positionAbs BigInt - Absolute size of desired position
       * @param positionSide {@link PositionSide}
       * @param stopLoss BigInt - Optional stop loss price to fully close the position
       * @param takeProfit BigInt - Optional take profit price to fully close the position
       * @param settlementFee BigInt - settlement fee
       * @param cancelOrderDetails List of open orders to cancel when modifying the position
       * @param absDifferenceNotional BigInt - Absolute difference in notional
       * @param interfaceFee Object consisting of interfaceFee, referrerFee and ecosystemFee amounts
       * @param interfaceFeeRate {@link InterfaceFeeRate}
       * @param referralFeeRate {@link ReferrerInterfaceFeeInfo}
       * @returns Transaction Hash
       */
      modifyPosition: async (args: OmitBound<BuildModifyPositionTxArgs>) => {
        const tx = await this.build.modifyPosition(args)
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
      /**
       * Send a submit VAA transaction
       * @param marketAddress Market Address
       * @param address Wallet Address
       * @param marketSnapshots {@link MarketSnapshots}
       * @param marketOracles {@link MarketOracles}
       * @returns Transaction Hash.
       */
      submitVaa: async ({ marketAddress, marketOracles, address }: OmitBound<BuildSubmitVaaTxArgs>) => {
        const tx = await this.build.submitVaa({ marketAddress, marketOracles, address })
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
      /**
       * Send a place order transaction. Can be used to set limit, stop loss and
       * take profit orders.
       * @param address Wallet Address
       * @param marketAddress Market Address
       * @param marketOracles {@link MarketOracles}
       * @param marketSnapshots {@link MarketSnapshots}
       * @param orderType {@link OrderTypes}
       * @param limitPrice BigInt - Limit price
       * @param stopLoss BigInt - Stop price
       * @param takeProfit BigInt - Take profit price
       * @param side Order side
       * @param collateralDelta BigInt - Collateral delta
       * @param delta BigInt - Position size delta
       * @param positionAbs BigInt - Desired absolute position size
       * @param selectedLimitComparison Trigger comparison for order execution. See TriggerComparison
       * @param referralFeeRate Object consisting of referralCode, referralTarget, share, discount, tier
       * @param interfaceFeeRate Object consisting of interfaceFeeRate and feeRecipientAddress mapped to chain ID
       * @param cancelOrderDetails List of open orders to cancel when placing the order
       * @param onCommitmentError Callback for commitment error
       * @returns Transaction Hash.
       */
      placeOrder: async (args: OmitBound<BuildPlaceOrderTxArgs>) => {
        const tx = await this.build.placeOrder(args)
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
      /**
       * Send a cancel order transaction
       * @param orderDetails List of order details (as a tuple of Address and order nonce) to cancel
       * @returns Transaction Hash.
       */
      cancelOrder: async (orderDetails: [Address, bigint][]) => {
        const tx = this.build.cancelOrder(orderDetails)
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
    }
  }
}
