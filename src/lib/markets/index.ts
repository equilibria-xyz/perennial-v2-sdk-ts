import { EvmPriceServiceConnection } from '@perennial/pyth-evm-js'
import { GraphQLClient } from 'graphql-request'
import { Address, PublicClient, WalletClient, zeroAddress } from 'viem'

import { SupportedChainId } from '../../constants'
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
import { buildCancelOrderTxData, cancelOrder, getMarketTransactionBuilders, getMarketTransactions } from './tx'

export class MarketsModule {
  private config: {
    chainId: SupportedChainId
    graphClient: GraphQLClient
    publicClient: PublicClient
    walletClient?: WalletClient
    pythClient: EvmPriceServiceConnection
  }

  constructor(config: {
    chainId: SupportedChainId
    publicClient: PublicClient
    walletClient?: WalletClient
    graphClient: GraphQLClient
    pythClient: EvmPriceServiceConnection
  }) {
    this.config = config
  }

  get read() {
    return {
      fetchMarketOraclesV2: this.fetchMarketOraclesV2,
      fetchProtocolParameter: this.fetchProtocolParameter,
      fetchMarketSnapshotsV2: this.fetchMarketSnapshotsV2,
      getMarketTransactions: this.getMarketTransactions,
      fetchActivePositionPnls: this.fetchActivePositionPnls,
      fetchActivePositionHistory: this.fetchActivePositionHistory,
      fetchHistoricalPositions: this.fetchHistoricalPositions,
      fetchSubPositions: this.fetchSubPositions,
      fetchOpenOrders: this.fetchOpenOrders,
      fetchMarket24hrData: this.fetchMarket24hrData,
      fetchMarket7dData: this.fetchMarket7dData,
    }
  }

  public fetchMarketOraclesV2 = () => {
    return fetchMarketOraclesV2(this.config.chainId, this.config.publicClient)
  }

  public fetchProtocolParameter = () => {
    return fetchProtocolParameter(this.config.chainId, this.config.publicClient)
  }

  public fetchMarketSnapshotsV2 = ({
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
  }

  public getMarketTransactions = ({
    productAddress,
    marketSnapshots,
    marketOracles,
  }: {
    productAddress: Address
    marketSnapshots?: MarketSnapshots
    marketOracles?: MarketOracles
  }) => {
    return getMarketTransactions({
      chainId: this.config.chainId,
      publicClient: this.config.publicClient,
      walletClient: this.config.walletClient,
      pythClient: this.config.pythClient,
      productAddress,
      marketSnapshots,
      marketOracles,
    })
  }

  public cancelOrderTransaction = ({
    orderDetails,
    address,
  }: {
    address: Address
    orderDetails: [Address, bigint][]
    returnTxDataOnly?: boolean
  }) => {
    return cancelOrder({
      chainId: this.config.chainId,
      publicClient: this.config.publicClient,
      walletClient: this.config.walletClient,
      orderDetails,
      address,
    })
  }

  public fetchActivePositionPnls = ({
    marketSnapshots,
    address,
  }: {
    marketSnapshots: MarketSnapshots
    address: Address
  }) => {
    return fetchActivePositionPnls({
      chainId: this.config.chainId,
      marketSnapshots,
      address,
      graphClient: this.config.graphClient,
    })
  }

  public fetchActivePositionHistory = ({
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
  }

  public fetchHistoricalPositions = ({
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
  }

  public fetchSubPositions = ({
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
  }

  public fetchOpenOrders = ({
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
  }

  public fetchMarket24hrData = ({ market }: { market: Address }) => {
    return fetchMarket24hrData({
      graphClient: this.config.graphClient,
      market,
    })
  }

  public fetchMarket7dData = ({ market }: { market: Address }) => {
    return fetchMarket7dData({
      graphClient: this.config.graphClient,
      market,
    })
  }

  public getMarketTransactionBuilders = ({
    productAddress,
    marketSnapshots,
    marketOracles,
    address,
  }: {
    productAddress: Address
    marketSnapshots?: MarketSnapshots
    marketOracles?: MarketOracles
    address?: Address
  }) => {
    return getMarketTransactionBuilders({
      chainId: this.config.chainId,
      publicClient: this.config.publicClient,
      address: address ?? this.config.walletClient?.account?.address ?? zeroAddress,
      pythClient: this.config.pythClient,
      productAddress,
      marketSnapshots,
      marketOracles,
    })
  }

  public buildCancelOrderTxData = (orderDetails: [Address, bigint][]) => {
    return buildCancelOrderTxData({
      chainId: this.config.chainId,
      publicClient: this.config.publicClient,
      orderDetails,
    })
  }
}
