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
      modifyPosition: (args: Omit<BuildModifyPositionTxArgs, 'chainId' | 'publicClient' | 'pythClient'>) => {
        return buildModifyPositionTx({
          publicClient: this.config.publicClient,
          chainId: this.config.chainId,
          pythClient: this.config.pythClient,
          ...args,
        })
      },
      submitVaa: (args: Omit<BuildSubmitVaaTxArgs, 'chainId' | 'pythClient'>) => {
        return buildSubmitVaaTx({
          chainId: this.config.chainId,
          pythClient: this.config.pythClient,
          ...args,
        })
      },
      placeOrder: (args: Omit<BuildPlaceOrderTxArgs, 'chainId' | 'pythClient' | 'publicClient'>) => {
        return buildPlaceOrderTx({
          chainId: this.config.chainId,
          pythClient: this.config.pythClient,
          publicClient: this.config.publicClient,
          ...args,
        })
      },
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
      modifyPosition: async (...args: Parameters<typeof this.build.modifyPosition>) => {
        const tx = await this.build.modifyPosition(...args)
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
      submitVaa: async (...args: Parameters<typeof this.build.submitVaa>) => {
        const tx = await this.build.submitVaa(...args)
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
      placeOrder: async (...args: Parameters<typeof this.build.placeOrder>) => {
        const tx = await this.build.placeOrder(...args)
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
      cancelOrder: async (orderDetails: [Address, bigint][]) => {
        const tx = this.build.cancelOrder(orderDetails)
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
    }
  }
}
