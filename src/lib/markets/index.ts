import { EvmPriceServiceConnection } from '@perennial/pyth-evm-js'
import { GraphQLClient } from 'graphql-request'
import { Address, PublicClient, WalletClient, zeroAddress } from 'viem'

import {
  InterfaceFee,
  OrderTypes,
  PositionSide,
  SupportedChainId,
  TriggerComparison,
  chainIdToChainMap,
} from '../../constants'
import { OptionalAddress } from '../../types/shared'
import { notEmpty } from '../../utils'
import { throwIfZeroAddress } from '../../utils/addressUtils'
import { mergeMultiInvokerTxs } from '../../utils/multiinvoker'
import { MarketOracles, MarketSnapshots, fetchMarketOracles, fetchMarketSnapshots } from './chain'
import { OrderExecutionDeposit, TriggerOrderFullCloseMagicValue } from './constants'
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
  BuildClaimFeeTxArgs,
  BuildLimitOrderTxArgs,
  BuildStopLossTxArgs,
  BuildSubmitVaaTxArgs,
  BuildTakeProfitTxArgs,
  BuildTriggerOrderBaseArgs,
  BuildUpdateMarketTxArgs,
  CancelOrderDetails,
  WithChainIdAndPublicClient,
  buildCancelOrderTx,
  buildClaimFeeTx,
  buildLimitOrderTx,
  buildStopLossTx,
  buildSubmitVaaTx,
  buildTakeProfitTx,
  buildUpdateMarketTx,
} from './tx'

type OmitBound<T> = Omit<T, 'chainId' | 'graphClient' | 'publicClient' | 'pythClient' | 'address'>

export type BuildModifyPositionTxArgs = {
  marketAddress: Address
  marketSnapshots?: MarketSnapshots
  marketOracles?: MarketOracles
  pythClient: EvmPriceServiceConnection
  address: Address
  collateralDelta?: bigint
  positionAbs?: bigint
  positionSide: PositionSide
  stopLossPrice?: bigint
  takeProfitPrice?: bigint
  cancelOrderDetails?: CancelOrderDetails[]
  interfaceFee?: InterfaceFee
  referralFee?: InterfaceFee
  stopLossFees?: {
    interfaceFee?: InterfaceFee
    referralFee?: InterfaceFee
  }
  takeProfitFees?: {
    interfaceFee?: InterfaceFee
    referralFee?: InterfaceFee
  }
  onCommitmentError?: () => any
} & WithChainIdAndPublicClient

export type BuildPlaceOrderTxArgs = {
  orderType: OrderTypes
  limitPrice?: bigint
  marketSnapshots?: MarketSnapshots
  marketOracles?: MarketOracles
  stopLossPrice?: bigint
  takeProfitPrice?: bigint
  collateralDelta?: bigint
  triggerComparison: TriggerComparison
  cancelOrderDetails?: CancelOrderDetails[]
  limitOrderFees?: {
    interfaceFee?: InterfaceFee
    referralFee?: InterfaceFee
  }
  takeProfitFees?: {
    interfaceFee?: InterfaceFee
    referralFee?: InterfaceFee
  }
  stopLossFees?: {
    interfaceFee?: InterfaceFee
    referralFee?: InterfaceFee
  }
  onCommitmentError?: () => any
} & Omit<BuildTriggerOrderBaseArgs, 'interfaceFee' | 'referralFee'>

type MarketsModuleConfig = {
  chainId: SupportedChainId
  graphClient: GraphQLClient
  publicClient: PublicClient
  pythClient: EvmPriceServiceConnection
  walletClient?: WalletClient
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
       * @param stopLossPrice BigInt - Optional stop loss price to fully close the position
       * @param takeProfitPrice BigInt - Optional take profit price to fully close the position
       * @param cancelOrderDetails List of {@link CancelOrderDetails[]} to cancel when modifying the position
       * @param interfaceFee {@link InterfaceFee}
       * @param referralFee {@link InterfaceFee}
       * @param stopLossFees Object consisting of { interfaceFee: {@link InterfaceFee}, referralFee: {@link InterfaceFee} }
       * @param takeProfitFees Object consisting of { interfaceFee: {@link InterfaceFee}, referralFee: {@link InterfaceFee} }
       * @returns Modify position transaction data.
       */
      modifyPosition: async (args: OmitBound<BuildModifyPositionTxArgs> & OptionalAddress) => {
        const address = args.address ?? this.defaultAddress
        throwIfZeroAddress(address)

        let stopLossTx
        let takeProfitTx
        let cancelOrderTx

        const updateMarketTx = await buildUpdateMarketTx({
          chainId: this.config.chainId,
          pythClient: this.config.pythClient,
          publicClient: this.config.publicClient,
          ...args,
          side: args.positionSide,
          address,
        })
        const isTaker = args.positionSide === PositionSide.short || args.positionSide === PositionSide.long

        if (args.stopLossPrice && isTaker) {
          stopLossTx = await buildStopLossTx({
            publicClient: this.config.publicClient,
            address,
            chainId: this.config.chainId,
            marketAddress: args.marketAddress,
            stopLossPrice: args.stopLossPrice,
            side: args.positionSide as PositionSide.long | PositionSide.short,
            delta: TriggerOrderFullCloseMagicValue,
            interfaceFee: args.stopLossFees?.interfaceFee,
            referralFee: args.stopLossFees?.referralFee,
            maxFee: OrderExecutionDeposit,
          })
        }

        if (args.takeProfitPrice && isTaker) {
          takeProfitTx = await buildTakeProfitTx({
            publicClient: this.config.publicClient,
            address,
            chainId: this.config.chainId,
            marketAddress: args.marketAddress,
            takeProfitPrice: args.takeProfitPrice,
            side: args.positionSide as PositionSide.long | PositionSide.short,
            delta: TriggerOrderFullCloseMagicValue,
            maxFee: OrderExecutionDeposit,
            interfaceFee: args.takeProfitFees?.interfaceFee,
            referralFee: args.takeProfitFees?.referralFee,
          })
        }

        if (args.cancelOrderDetails?.length) {
          cancelOrderTx = buildCancelOrderTx({
            chainId: this.config.chainId,
            address,
            orderDetails: args.cancelOrderDetails,
          })
        }

        const multiInvokerTxs = [updateMarketTx, takeProfitTx, stopLossTx, cancelOrderTx].filter(notEmpty)

        return mergeMultiInvokerTxs(multiInvokerTxs)
      },
      /**
       * Build an update market transaction. Can be used to increase/decrease an
       * existing position, open/close a position and deposit or withdraw collateral
       * @param marketAddress Market Address
       * @param marketSnapshots {@link MarketSnapshots}
       * @param marketOracles {@link MarketOracles}
       * @param pythClient Pyth Client
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @param collateralDelta BigInt - Collateral delta
       * @param positionAbs BigInt - Absolute size of desired position
       * @param side {@link PositionSide}
       * @param interfaceFee Object consisting of interfaceFee, referrerFee and ecosystemFee amounts
       * @param interfaceFeeRate {@link InterfaceFeeBps}
       * @param referralFeeRate {@link ReferrerInterfaceFeeInfo}
       * @param onCommitmentError Callback for commitment error
       * @param publicClient Public Client
       * @returns Update market transaction data.
       */
      update: (args: OmitBound<BuildUpdateMarketTxArgs> & OptionalAddress) => {
        const address = args.address ?? this.defaultAddress
        throwIfZeroAddress(address)

        return buildUpdateMarketTx({
          chainId: this.config.chainId,
          pythClient: this.config.pythClient,
          publicClient: this.config.publicClient,
          ...args,
          address,
        })
      },
      /**
       * Build a limit order transaction
       * @param chainId Chain ID
       * @param publicClient Public Client
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @param marketAddress Market Address
       * @param side {@link PositionSide}
       * @param delta BigInt - Position size delta
       * @param selectedLimitComparison Trigger comparison for order execution. See {@link TriggerComparison}
       * @param referralFeeRate {@link ReferrerInterfaceFeeInfo}
       * @param interfaceFeeRate {@link InterfaceFeeBps}
       * @param limitPrice BigInt - Limit price
       * @param collateralDelta BigInt - Collateral delta
       * @returns Limit order transaction data.
       */
      limitOrder: (args: OmitBound<BuildLimitOrderTxArgs> & OptionalAddress) => {
        const address = args.address ?? this.defaultAddress
        throwIfZeroAddress(address)

        return buildLimitOrderTx({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          ...args,
          address,
        })
      },
      /**
       * Build a stop loss order transaction
       * @param chainId Chain ID
       * @param publicClient Public Client
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @param marketAddress Market Address
       * @param side {@link PositionSide}
       * @param delta BigInt - Position size delta
       * @param referralFeeRate {@link ReferrerInterfaceFeeInfo}
       * @param interfaceFeeRate {@link InterfaceFeeBps}
       * @param maxFee Maximum fee override - defaults to {@link OrderExecutionDeposit}
       * @param stopLossPrice BigInt - Stop loss price
       * @returns Stop loss transaction data.
       */
      stopLoss: (args: OmitBound<BuildStopLossTxArgs> & OptionalAddress) => {
        const address = args.address ?? this.defaultAddress
        throwIfZeroAddress(address)

        return buildStopLossTx({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          ...args,
          address,
        })
      },
      /**
       * Build a take profit order transaction
       * @param chainId Chain ID
       * @param publicClient Public Client
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @param marketAddress Market Address
       * @param side {@link PositionSide}
       * @param delta BigInt - Position size delta
       * @param interfaceFee {@link InterfaceFee}
       * @param referralFee {@link InterfaceFee}
       * @param maxFee Maximum fee override - defaults to {@link OrderExecutionDeposit}
       * @param takeProfitPrice BigInt - Stop loss price
       * @returns Take profit transaction data.
       */
      takeProfit: (args: OmitBound<BuildTakeProfitTxArgs> & OptionalAddress) => {
        const address = args.address ?? this.defaultAddress
        throwIfZeroAddress(address)

        return buildTakeProfitTx({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
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
       * Build a place order transaction. Can be used to set combined limit, stop loss and
       * take profit orders.
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @param marketAddress Market Address
       * @param marketOracles {@link MarketOracles}
       * @param marketSnapshots {@link MarketSnapshots}
       * @param orderType {@link OrderTypes}
       * @param limitPrice BigInt - Limit price
       * @param stopLossPrice BigInt - Stop price
       * @param takeProfitPrice BigInt - Take profit price
       * @param side Order side
       * @param collateralDelta BigInt - Collateral delta
       * @param delta BigInt - Position size delta
       * @param cancelOrderDetails List of {@link CancelOrderDetails[]} to cancel
       * @param triggerComparison Trigger comparison for order execution. See {@link TriggerComparison}
       * @param limitOrderFees Object consisting of { interfaceFee: {@link InterfaceFee}, referralFee: {@link InterfaceFee} }
       * @param stopLossFees Object consisting of { interfaceFee: {@link InterfaceFee}, referralFee: {@link InterfaceFee} }
       * @param takeProfitFees Object consisting of { interfaceFee: {@link InterfaceFee}, referralFee: {@link InterfaceFee} }
       * @param onCommitmentError Callback for commitment error
       * @returns Place order transaction data.
       */
      placeOrder: async (args: OmitBound<BuildPlaceOrderTxArgs> & OptionalAddress) => {
        const address = args.address ?? this.defaultAddress
        throwIfZeroAddress(address)

        let updateMarketTx
        let limitOrderTx
        let takeProfitTx
        let stopLossTx
        let cancelOrderTx

        if (args.collateralDelta) {
          updateMarketTx = await buildUpdateMarketTx({
            chainId: this.config.chainId,
            pythClient: this.config.pythClient,
            publicClient: this.config.publicClient,
            address,
            marketAddress: args.marketAddress,
            collateralDelta: args.collateralDelta,
            side: args.side,
            marketOracles: args.marketOracles,
            marketSnapshots: args.marketSnapshots,
            onCommitmentError: args.onCommitmentError,
          })
        }
        if (args.orderType === OrderTypes.limit && args.limitPrice) {
          limitOrderTx = await buildLimitOrderTx({
            chainId: this.config.chainId,
            publicClient: this.config.publicClient,
            limitPrice: args.limitPrice,
            address,
            marketAddress: args.marketAddress,
            side: args.side,
            delta: args.delta,
            interfaceFee: args.limitOrderFees?.interfaceFee,
            referralFee: args.limitOrderFees?.referralFee,
            triggerComparison: args.triggerComparison,
          })
        }

        if (args.takeProfitPrice && args.orderType !== OrderTypes.stopLoss) {
          const takeProfitDelta = args.orderType === OrderTypes.limit ? TriggerOrderFullCloseMagicValue : args.delta

          takeProfitTx = await buildTakeProfitTx({
            chainId: this.config.chainId,
            publicClient: this.config.publicClient,
            takeProfitPrice: args.takeProfitPrice,
            delta: takeProfitDelta,
            address,
            marketAddress: args.marketAddress,
            side: args.side,
            interfaceFee: args.takeProfitFees?.interfaceFee,
            referralFee: args.takeProfitFees?.referralFee,
          })
        }

        if (args.stopLossPrice && args.orderType !== OrderTypes.takeProfit) {
          const stopLossDelta = args.orderType === OrderTypes.limit ? TriggerOrderFullCloseMagicValue : args.delta

          stopLossTx = await buildStopLossTx({
            chainId: this.config.chainId,
            publicClient: this.config.publicClient,
            stopLossPrice: args.stopLossPrice,
            delta: stopLossDelta,
            address,
            marketAddress: args.marketAddress,
            side: args.side,
            interfaceFee: args.stopLossFees?.interfaceFee,
            referralFee: args.stopLossFees?.referralFee,
          })
        }

        if (args.cancelOrderDetails?.length) {
          cancelOrderTx = buildCancelOrderTx({
            chainId: this.config.chainId,
            address,
            orderDetails: args.cancelOrderDetails,
          })
        }

        const multiInvokerTxs = [updateMarketTx, limitOrderTx, takeProfitTx, stopLossTx, cancelOrderTx].filter(notEmpty)
        return mergeMultiInvokerTxs(multiInvokerTxs)
      },
      /**
       * Build a cancel order transaction
       * @param orderDetails List of {@link CancelOrderDetails} to cancel
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

      /**
       * Build a claim fee transaction
       * @notice This method only claims for the transaction sending address. OperatingFor is not supported
       * @param marketAddress Market Address to claim fees for
       */
      claimFee: (args: OmitBound<BuildClaimFeeTxArgs>) => {
        return buildClaimFeeTx({ ...args })
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
       * @param cancelOrderDetails List of {@link CancelOrderDetails} to cancel when modifying the position
       * @param interfaceFee {@link InterfaceFee}
       * @param referralFee {@link InterfaceFee}
       * @returns Transaction Hash
       */
      modifyPosition: async (...args: Parameters<typeof this.build.modifyPosition>) => {
        const tx = await this.build.modifyPosition(...args)
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
      /**
       * Send an update market transaction. Can be used to increase/decrease an
       * existing position, open/close a position and deposit or withdraw collateral
       * @param marketAddress Market Address
       * @param marketSnapshots {@link MarketSnapshots}
       * @param marketOracles {@link MarketOracles}
       * @param pythClient Pyth Client
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @param collateralDelta BigInt - Collateral delta
       * @param positionAbs BigInt - Absolute size of desired position
       * @param side {@link PositionSide}
       * @param interfaceFee {@link InterfaceFee}
       * @param referralFee {@link InterfaceFee}
       * @param onCommitmentError Callback for commitment error
       * @param publicClient Public Client
       * @returns Transaction Hash.
       */
      update: async (...args: Parameters<typeof this.build.update>) => {
        const tx = await this.build.update(...args)
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
       * Send a limit order transaction
       * @param chainId Chain ID
       * @param publicClient Public Client
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @param marketAddress Market Address
       * @param side {@link PositionSide}
       * @param delta BigInt - Position size delta
       * @param selectedLimitComparison Trigger comparison for order execution. See {@link TriggerComparison}
       * @param interfaceFee {@link InterfaceFee}
       * @param referralFee {@link InterfaceFee}
       * @param pythClient Pyth Client
       * @param marketOracles {@link MarketOracles}
       * @param marketSnapshots {@link MarketSnapshots}
       * @param onCommitmentError Callback for commitment error
       * @param limitPrice BigInt - Limit price
       * @param collateralDelta BigInt - Collateral delta
       * @returns Transaction hash.
       */
      limitOrder: async (...args: Parameters<typeof this.build.limitOrder>) => {
        const tx = await this.build.limitOrder(...args)
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
      /**
       * Send a stop loss order transaction
       * @param chainId Chain ID
       * @param publicClient Public Client
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @param marketAddress Market Address
       * @param side {@link PositionSide}
       * @param delta BigInt - Position size delta
       * @param interfaceFee {@link InterfaceFee}
       * @param referralFee {@link InterfaceFee}
       * @param maxFee Maximum fee override - defaults to {@link OrderExecutionDeposit}
       * @param stopLoss BigInt - Stop loss price
       * @returns Transaction hash.
       */
      stopLoss: async (...args: Parameters<typeof this.build.stopLoss>) => {
        const tx = await this.build.stopLoss(...args)
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
      /**
       * Send a take profit order transaction
       * @param chainId Chain ID
       * @param publicClient Public Client
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @param marketAddress Market Address
       * @param side {@link PositionSide}
       * @param delta BigInt - Position size delta
       * @param interfaceFee {@link InterfaceFee}
       * @param referralFee {@link InterfaceFee}
       * @param maxFee Maximum fee override - defaults to {@link OrderExecutionDeposit}
       * @param takeProfit BigInt - Stop loss price
       * @returns Transaction hash.
       */
      takeProfit: async (...args: Parameters<typeof this.build.takeProfit>) => {
        const tx = await this.build.takeProfit(...args)
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
       * @param interfaceFee {@link InterfaceFee}
       * @param referralFee {@link InterfaceFee}
       * @param cancelOrderDetails List of {@link CancelOrderDetails} to cancel when placing the order
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

      /**
       * Send a claim fee transaction
       * @param marketAddress Market Address to claim fees for
       */
      claimFee: async (...args: Parameters<typeof this.build.claimFee>) => {
        const tx = this.build.claimFee(...args)
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
    }
  }
}
