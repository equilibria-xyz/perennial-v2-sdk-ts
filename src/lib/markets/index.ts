import { EvmPriceServiceConnection } from '@perennial/pyth-evm-js'
import { GraphQLClient } from 'graphql-request'
import { Address, PublicClient, WalletClient, zeroAddress } from 'viem'

import { InterfaceFeeBps, SupportedChainId, chainIdToChainMap } from '../../constants'
import { OptionalAddress } from '../../types/perennial'
import { throwIfZeroAddress } from '../../utils/addressUtils'
import { fetchMarketOracles, fetchMarketSnapshots } from './chain'
import {
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
  BuildCancelOrderTxArgs,
  BuildModifyPositionTxArgs,
  BuildPlaceOrderTxArgs,
  BuildSubmitVaaTxArgs,
  buildCancelOrderTx,
  buildModifyPositionTx,
  buildPlaceOrderTx,
  buildSubmitVaaTx,
} from './tx'

type OmitBound<T> = Omit<T, 'chainId' | 'graphClient' | 'publicClient' | 'pythClient' | 'address'>

type MarketsModuleConfig = {
  chainId: SupportedChainId
  graphClient: GraphQLClient
  publicClient: PublicClient
  pythClient: EvmPriceServiceConnection
  walletClient?: WalletClient
  interfaceFeeBps?: InterfaceFeeBps
  operatingFor?: Address
}

/**
 * Markets module class
 * @param config SDK configuration
 * @param config.chainId {@link SupportedChainId}
 * @param config.publicClient Public Client
 * @param config.graphClient GraphQL Client
 * @param config.pythClient Pyth Client
 * @param config.walletClient Wallet Client
 * @param config.interfaceFeeBps Interface Fee rates and recipient {@link InterfaceFeeBps}
 * @param config.operatingFor If set, the module will read data and send multi-invoker transactions on behalf of this address.
 * @returns Markets module instance
 */
export class MarketsModule {
  private config: MarketsModuleConfig
  private defaultAddress: Address = zeroAddress

  constructor(config: MarketsModuleConfig) {
    this.config = config
    this.defaultAddress = config.operatingFor ?? config.walletClient?.account?.address ?? this.defaultAddress
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
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @param marketOracles {@link MarketOracles}
       * @param onError Error callback
       * @param onSuccess Success callback
       * @returns The {@link MarketSnapshots}.
       */
      marketSnapshots: (args: OmitBound<Parameters<typeof fetchMarketSnapshots>[0]> & OptionalAddress = {}) => {
        return fetchMarketSnapshots({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          pythClient: this.config.pythClient,
          address: this.defaultAddress,
          ...args,
        })
      },
      /**
       * Fetches position PnL for a given market and Address
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @param market Market Address
       * @param userMarketSnapshot {@link UserMarketSnapshot}
       * @param marketSnapshot {@link MarketSnapshot}
       * @param includeClosedWithCollateral Include closed positions with collateral
       * @returns User's PnL for an active position.
       */
      activePositionPnl: (args: OmitBound<Parameters<typeof fetchActivePositionPnl>[0]> & OptionalAddress) => {
        return fetchActivePositionPnl({
          graphClient: this.config.graphClient,
          address: this.defaultAddress,
          ...args,
        })
      },
      /**
       * Fetches active position history for a given address
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @param market Market Address
       * @param pageParam Page number
       * @param pageSize Page size
       * @returns User's position history for an active position.
       */
      activePositionHistory: (args: OmitBound<Parameters<typeof fetchActivePositionHistory>[0]> & OptionalAddress) => {
        return fetchActivePositionHistory({
          graphClient: this.config.graphClient,
          address: this.defaultAddress,
          ...args,
        })
      },
      /**
       * Fetches the position history for a given address
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @param markets List of {@link Markets} to fetch position history for
       * @param pageParam Page number
       * @param pageSize Page size
       * @returns User's position history.
       */
      historicalPositions: (args: OmitBound<Parameters<typeof fetchHistoricalPositions>[0]> & OptionalAddress) => {
        return fetchHistoricalPositions({
          graphClient: this.config.graphClient,
          address: this.defaultAddress,
          ...args,
        })
      },
      /**
       * Fetches the sub positions activity for a given position
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @param market Market Address
       * @param startVersion BigInt - Start oracle version number
       * @param endVersion BigInt - End oracle version number
       * @param first Number of entries to fetch
       * @param skip Number of entries to skip
       * @returns User's sub positions.
       */
      subPositions: (args: OmitBound<Parameters<typeof fetchSubPositions>[0]> & OptionalAddress) => {
        return fetchSubPositions({
          graphClient: this.config.graphClient,
          address: this.defaultAddress,
          ...args,
        })
      },
      /**
       * Fetches the trade history across all markets for a given address. Limited to a 7 day window.
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @param fromTs start timestamp in seconds
       * @param toTs end timestamp in seconds
       * @returns User's trade history.
       */
      tradeHistory: (args: OmitBound<Parameters<typeof fetchTradeHistory>[0]> & OptionalAddress = {}) => {
        return fetchTradeHistory({
          graphClient: this.config.graphClient,
          address: this.defaultAddress,
          ...args,
        })
      },
      /**
       * Fetches the open orders for a given address
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @param markets List of {@link Markets} to fetch open orders for
       * @param pageParam Page number
       * @param pageSize Page size
       * @returns User's open orders.
       */
      openOrders: (args: OmitBound<Parameters<typeof fetchOpenOrders>[0]> & OptionalAddress) => {
        return fetchOpenOrders({
          graphClient: this.config.graphClient,
          address: this.defaultAddress,
          ...args,
        })
      },
      /**
       * Fetches the 24hr volume data for a given market
       * @param market Market Address
       * @returns Market 24hr volume data.
       */
      market24hrData: (args: OmitBound<Parameters<typeof fetchMarket24hrData>[0]>) => {
        return fetchMarket24hrData({
          graphClient: this.config.graphClient,
          ...args,
        })
      },
      /**
       * Fetches the 24hr volume data for a list of market
       * @param markets List of market Addresses
       * @returns Markets 24hr volume data.
       */
      markets24hrData: (args: OmitBound<Parameters<typeof fetchMarkets24hrVolume>[0]>) => {
        return fetchMarkets24hrVolume({
          graphClient: this.config.graphClient,
          ...args,
        })
      },
      /**
       * Fetches the 7d data for a given market
       * @param market Market Address
       * @returns Market 7d data.
       */
      market7dData: (args: OmitBound<Parameters<typeof fetchMarket7dData>[0]>) => {
        return fetchMarket7dData({
          graphClient: this.config.graphClient,
          ...args,
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
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
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
       * @param interfaceFeeRate {@link InterfaceFeeBps}
       * @param referralFeeRate {@link ReferrerInterfaceFeeInfo}
       * @returns Modify position transaction data.
       */
      modifyPosition: (args: OmitBound<BuildModifyPositionTxArgs> & OptionalAddress) => {
        const address = args.address ?? this.defaultAddress
        throwIfZeroAddress(address)

        return buildModifyPositionTx({
          publicClient: this.config.publicClient,
          chainId: this.config.chainId,
          pythClient: this.config.pythClient,
          interfaceFeeRate: this.config.interfaceFeeBps,
          ...args,
          address,
        })
      },
      /**
       * Build a submit VAA transaction
       * @param marketAddress Market Address
       * @param marketSnapshots {@link MarketSnapshots}
       * @param marketOracles {@link MarketOracles}
       * @returns Submit VAA transaction data.
       */
      submitVaa: ({ marketAddress, marketOracles }: OmitBound<BuildSubmitVaaTxArgs>) => {
        return buildSubmitVaaTx({
          chainId: this.config.chainId,
          pythClient: this.config.pythClient,
          marketAddress,
          marketOracles,
        })
      },
      /**
       * Build a place order transaction. Can be used to set limit, stop loss and
       * take profit orders.
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
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
       * @param interfaceFeeRate {@link InterfaceFeeBps}
       * @param cancelOrderDetails {@link CancelOrderDetails}
       * @param onCommitmentError Callback for commitment error
       * @returns Place order transaction data.
       */
      placeOrder: (args: OmitBound<BuildPlaceOrderTxArgs> & OptionalAddress) => {
        const address = args.address ?? this.defaultAddress
        throwIfZeroAddress(address)

        return buildPlaceOrderTx({
          chainId: this.config.chainId,
          pythClient: this.config.pythClient,
          publicClient: this.config.publicClient,
          interfaceFeeRate: this.config.interfaceFeeBps,
          ...args,
          address,
        })
      },
      /**
       * Build a cancel order transaction
       * @param orderDetails {@link CancelOrderTuple[]} List of order details (as a tuple of Address and order nonce) to cancel
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @returns Cancel order transaction data.
       */
      cancelOrder: (args: OmitBound<BuildCancelOrderTxArgs> & OptionalAddress) => {
        const address = args.address ?? this.defaultAddress
        throwIfZeroAddress(address)

        return buildCancelOrderTx({
          chainId: this.config.chainId,
          ...args,
          address,
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
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
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
       * @param interfaceFeeRate {@link InterfaceFeeBps}
       * @param referralFeeRate {@link ReferrerInterfaceFeeInfo}
       * @returns Transaction Hash
       */
      modifyPosition: async (...args: Parameters<typeof this.build.modifyPosition>) => {
        const tx = await this.build.modifyPosition(...args)
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
      /**
       * Send a submit VAA transaction
       * @param marketAddress Market Address
       * @param marketSnapshots {@link MarketSnapshots}
       * @param marketOracles {@link MarketOracles}
       * @returns Transaction Hash.
       */
      submitVaa: async (...args: Parameters<typeof this.build.submitVaa>) => {
        const tx = await this.build.submitVaa(...args)
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
      /**
       * Send a place order transaction. Can be used to set limit, stop loss and
       * take profit orders.
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
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
       * @param interfaceFeeRate {@link InterfaceFeeBps}
       * @param cancelOrderDetails List of open orders to cancel when placing the order
       * @param onCommitmentError Callback for commitment error
       * @returns Transaction Hash.
       */
      placeOrder: async (...args: Parameters<typeof this.build.placeOrder>) => {
        const tx = await this.build.placeOrder(...args)
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
      /**
       * Send a cancel order transaction
       * @param orderDetails List of order details (as a tuple of Address and order nonce) to cancel
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @returns Transaction Hash.
       */
      cancelOrder: async (...args: Parameters<typeof this.build.cancelOrder>) => {
        const tx = this.build.cancelOrder(...args)
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
    }
  }
}
