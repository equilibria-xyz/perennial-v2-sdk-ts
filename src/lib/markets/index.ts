import { EvmPriceServiceConnection } from '@perennial/pyth-evm-js'
import { GraphQLClient } from 'graphql-request'
import { Address, PublicClient, WalletClient } from 'viem'

import { SupportedChainId, chainIdToChainMap } from '../../constants'
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
        return fetchMarketOracles(this.config.chainId, this.config.publicClient)
      },
      marketSnapshots: (args: OmitBound<Parameters<typeof fetchMarketSnapshots>[0]>) => {
        return fetchMarketSnapshots({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          pythClient: this.config.pythClient,
          ...args,
        })
      },
      activePositionPnl: (args: OmitBound<Parameters<typeof fetchActivePositionPnl>[0]>) => {
        return fetchActivePositionPnl({
          graphClient: this.config.graphClient,
          ...args,
        })
      },
      activePositionHistory: (args: OmitBound<Parameters<typeof fetchActivePositionHistory>[0]>) => {
        return fetchActivePositionHistory({
          graphClient: this.config.graphClient,
          ...args,
        })
      },
      historicalPositions: (args: OmitBound<Parameters<typeof fetchHistoricalPositions>[0]>) => {
        return fetchHistoricalPositions({
          graphClient: this.config.graphClient,
          ...args,
        })
      },
      subPositions: (args: OmitBound<Parameters<typeof fetchSubPositions>[0]>) => {
        return fetchSubPositions({
          graphClient: this.config.graphClient,
          ...args,
        })
      },
      openOrders: (args: OmitBound<Parameters<typeof fetchOpenOrders>[0]>) => {
        return fetchOpenOrders({
          graphClient: this.config.graphClient,
          ...args,
        })
      },
      market24hrData: (args: OmitBound<Parameters<typeof fetchMarket24hrData>[0]>) => {
        return fetchMarket24hrData({
          graphClient: this.config.graphClient,
          ...args,
        })
      },
      markets24hrData: (args: OmitBound<Parameters<typeof fetchMarkets24hrVolume>[0]>) => {
        return fetchMarkets24hrVolume({
          graphClient: this.config.graphClient,
          ...args,
        })
      },
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
      modifyPosition: (args: OmitBound<BuildModifyPositionTxArgs>) => {
        return buildModifyPositionTx({
          publicClient: this.config.publicClient,
          chainId: this.config.chainId,
          pythClient: this.config.pythClient,
          ...args,
        })
      },
      submitVaa: (args: OmitBound<BuildSubmitVaaTxArgs>) => {
        return buildSubmitVaaTx({
          chainId: this.config.chainId,
          pythClient: this.config.pythClient,
          ...args,
        })
      },
      placeOrder: (args: OmitBound<BuildPlaceOrderTxArgs>) => {
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
