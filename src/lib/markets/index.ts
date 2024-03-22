import { EvmPriceServiceConnection } from '@perennial/pyth-evm-js'
import { GraphQLClient } from 'graphql-request'
import { Address, PublicClient, WalletClient, zeroAddress } from 'viem'

import { chainIdToChainMap, interfaceFeeBps, MaxUint256, SupportedChainId } from '../../constants'
import { MarketsAccountCheckpointsQuery } from '../../types/gql/graphql'
import {
  MarketOracles,
  MarketSnapshots,
  fetchMarketOraclesV2,
  fetchMarketSnapshotsV2,
  fetchProtocolParameter,
} from './chain'
import {
  Markets,
  fetchActivePositionHistory,
  fetchActivePositionPnls,
  fetchHistoricalPositions,
  fetchMarket7dData,
  fetchMarket24hrData,
  fetchOpenOrders,
  fetchSubPositions,
} from './graph'
import {
  buildApproveUSDCTx,
  buildCancelOrderTx,
  buildModifyPositionTx,
  BuildModifyPositionTxArgs,
  buildPlaceOrderTx,
  BuildPlaceOrderTxArgs,
  buildSubmitVaaTx,
  BuildSubmitVaaTxArgs,
} from './tx'

export class MarketsModule {
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
      marketOracles: () => {
        return fetchMarketOraclesV2(this.config.chainId, this.config.publicClient)
      },
      protocolParameter: () => {
        return fetchProtocolParameter(this.config.chainId, this.config.publicClient)
      },
      marketSnapshots: ({
        marketOracles,
        address = zeroAddress,
        onSuccess,
        onError,
      }: {
        marketOracles?: MarketOracles
        address?: Address
        onSuccess?: () => void
        onError?: () => void
      }) => {
        return fetchMarketSnapshotsV2({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          pythClient: this.config.pythClient,
          address,
          marketOracles,
          onError,
          onSuccess,
        })
      },
      activePositionPnls: ({ marketSnapshots, address }: { marketSnapshots: MarketSnapshots; address: Address }) => {
        return fetchActivePositionPnls({
          chainId: this.config.chainId,
          marketSnapshots,
          address,
          graphClient: this.config.graphClient,
        })
      },
      activePositionHistory: ({
        market,
        address,
        pageParam = 0,
        pageSize = 100,
      }: {
        market: Address
        address: Address
        pageParam: number
        pageSize: number
      }) => {
        return fetchActivePositionHistory({
          market,
          address,
          pageParam,
          pageSize,
          graphClient: this.config.graphClient,
        })
      },
      historicalPositions: ({
        markets,
        address,
        pageSize = 10,
        pageParam,
        maker,
      }: {
        markets: Markets
        address: Address
        pageSize: number
        pageParam?: { page: number; checkpoints?: MarketsAccountCheckpointsQuery }
        maker?: boolean
      }) => {
        return fetchHistoricalPositions({
          markets,
          address,
          graphClient: this.config.graphClient,
          pageSize,
          pageParam,
          maker,
        })
      },
      subPositions: ({
        address,
        market,
        startVersion,
        endVersion,
        first,
        skip,
      }: {
        address: Address
        market: Address
        startVersion: bigint
        endVersion?: bigint
        first: number
        skip: number
      }) => {
        return fetchSubPositions({
          graphClient: this.config.graphClient,
          address,
          market,
          startVersion,
          endVersion,
          first,
          skip,
        })
      },
      openOrders: ({
        markets,
        address,
        pageParam = 0,
        pageSize = 100,
        isMaker,
      }: {
        markets: Markets
        address: Address
        pageParam: number
        pageSize: number
        isMaker?: boolean
      }) => {
        return fetchOpenOrders({
          graphClient: this.config.graphClient,
          markets,
          address,
          pageParam,
          pageSize,
          isMaker,
        })
      },
      market24hrData: ({ market }: { market: Address }) => {
        return fetchMarket24hrData({
          graphClient: this.config.graphClient,
          market,
        })
      },
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
      approveUSDC: (suggestedAmount = MaxUint256) => {
        return buildApproveUSDCTx({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          suggestedAmount,
        })
      },
      modifyPosition: ({
        marketAddress,
        marketSnapshots,
        marketOracles,
        pythClient,
        address,
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
      }: BuildModifyPositionTxArgs) => {
        return buildModifyPositionTx({
          publicClient: this.config.publicClient,
          chainId: this.config.chainId,
          marketAddress,
          marketSnapshots,
          marketOracles,
          pythClient,
          address,
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
      },
      submitVaa: ({ marketAddress, marketOracles, pythClient, address }: BuildSubmitVaaTxArgs) => {
        return buildSubmitVaaTx({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          marketAddress,
          marketOracles,
          pythClient,
          address,
        })
      },
      placeOrder: ({
        address,
        marketOracles,
        marketAddress,
        orderType,
        limitPrice,
        marketSnapshots,
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
      }: BuildPlaceOrderTxArgs) => {
        return buildPlaceOrderTx({
          chainId: this.config.chainId,
          pythClient: this.config.pythClient,
          publicClient: this.config.publicClient,
          address,
          marketOracles,
          marketAddress,
          orderType,
          limitPrice,
          marketSnapshots,
          collateralDelta,
          stopLoss,
          takeProfit,
          side,
          delta,
          positionAbs,
          selectedLimitComparison,
          cancelOrderDetails,
          referralFeeRate,
          interfaceFeeRate,
          onCommitmentError,
        })
      },
      cancelOrder: (orderDetails: [Address, bigint][]) => {
        return buildCancelOrderTx({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          orderDetails,
        })
      },
    }
  }

  get write() {
    if (!this.config.walletClient || !this.config.walletClient.account) {
      throw new Error('Wallet client required for write methods.')
    }

    const {
      chainId,
      walletClient: { account: address },
    } = this.config

    const txOpts = { account: address, chainId, chain: chainIdToChainMap[chainId] }

    return {
      approveUSDC: async (suggestedAmount = MaxUint256) => {
        const tx = await this.build.approveUSDC(suggestedAmount)
        const hash = await this.config.walletClient?.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
      modifyPosition: async (args: BuildModifyPositionTxArgs) => {
        const tx = await this.build.modifyPosition(args)
        const hash = await this.config.walletClient?.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
      submitVaa: async (args: BuildSubmitVaaTxArgs) => {
        const tx = await this.build.submitVaa(args)
        const hash = await this.config.walletClient?.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
      placeOrder: async (args: BuildPlaceOrderTxArgs) => {
        const tx = await this.build.placeOrder(args)
        const hash = await this.config.walletClient?.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
      cancelOrder: async (orderDetails: [Address, bigint][]) => {
        const tx = this.build.cancelOrder(orderDetails)
        const hash = await this.config.walletClient?.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
    }
  }
}
