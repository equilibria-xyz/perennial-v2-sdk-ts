import { HermesClient } from '@pythnetwork/hermes-client'
import { GraphQLClient } from 'graphql-request'
import { Address, Chain, PublicClient, Transport, WalletClient, createPublicClient, http } from 'viem'

import { ChainMarkets, SupportedChainId, SupportedMarket } from '..'
import { BackupPythClient, DefaultChain, chainIdToChainMap } from '../constants/network'
import { CollateralAccountModule } from '../lib/collateralAccounts'
import { ContractsModule } from '../lib/contracts'
import { MarketsModule } from '../lib/markets'
import { OperatorModule } from '../lib/operators'
import { OracleClients, OraclesModule } from '../lib/oracle'
import { VaultsModule } from '../lib/vaults'

export type SDKConfig = {
  rpcUrl: string
  chainId: SupportedChainId
  graphUrl?: string
  pythUrl: string | string[]
  cryptexUrl?: string
  walletClient?: WalletClient
  operatingFor?: Address
  supportedMarkets?: SupportedMarket[]
}

/**
 * Perennial SDK class
 *
 * @param config SDK configuration
 * @param config.rpcUrl Rpc URL
 * @param config.walletClient Wallet Client
 * @param config.chainId {@link SupportedChainId}
 * @param config.graphUrl SubGraph URL
 * @param config.pythUrl Pyth URL
 * @param config.operatingFor If set, the SDK will read data and send multi-invoker transactions on behalf of this address.
 * @param config.supportedMarkets Subset of availalbe markets to support.
 *
 * @returns Perennial SDK instance
 *
 * @beta
 */
export default class PerennialSDK {
  private config: SDKConfig & { supportedMarkets: SupportedMarket[] }
  private _currentChainId: SupportedChainId = DefaultChain.id
  private _publicClient: PublicClient<Transport<'http'>, Chain>
  private _walletClient?: WalletClient
  private _oracleClients: OracleClients
  private _graphClient: GraphQLClient | undefined
  public contracts: ContractsModule
  public markets: MarketsModule
  public vaults: VaultsModule
  public operator: OperatorModule
  public oracles: OraclesModule
  public collateralAccounts: CollateralAccountModule

  constructor(config: SDKConfig) {
    this.config = {
      ...config,
      supportedMarkets:
        config.supportedMarkets && config.supportedMarkets.length
          ? config.supportedMarkets
          : (Object.keys(ChainMarkets[config.chainId]) as SupportedMarket[]),
    }
    this._publicClient = createPublicClient({
      chain: chainIdToChainMap[config.chainId] as Chain,
      transport: http(config.rpcUrl),
      batch: {
        multicall: true,
      },
    })
    this._oracleClients = {
      pyth: this.buildPythClients(config.pythUrl),
      cryptex: config.cryptexUrl,
    }
    this._graphClient = config.graphUrl ? new GraphQLClient(config.graphUrl) : undefined
    this.contracts = new ContractsModule({
      chainId: config.chainId,
      publicClient: this._publicClient,
      signer: config.walletClient,
    })
    this.markets = new MarketsModule({
      chainId: config.chainId,
      publicClient: this._publicClient,
      walletClient: config.walletClient,
      graphClient: this._graphClient,
      oracleClients: this._oracleClients,
      operatingFor: this.config.operatingFor,
      supportedMarkets: this.config.supportedMarkets,
    })
    this.vaults = new VaultsModule({
      chainId: config.chainId,
      publicClient: this._publicClient,
      walletClient: config.walletClient,
      graphClient: this._graphClient,
      oracleClients: this._oracleClients,
      operatingFor: this.config.operatingFor,
    })
    this.operator = new OperatorModule({
      chainId: config.chainId,
      publicClient: this._publicClient,
      walletClient: config.walletClient,
      operatingFor: this.config.operatingFor,
    })
    this.oracles = new OraclesModule({
      chainId: config.chainId,
      publicClient: this._publicClient,
      oracleClients: this._oracleClients,
      supportedMarkets: this.config.supportedMarkets,
      operatingFor: this.config.operatingFor,
      walletClient: config.walletClient,
    })
    this.collateralAccounts = new CollateralAccountModule({
      chainId: config.chainId,
      publicClient: this._publicClient,
      walletClient: config.walletClient,
      operatingFor: this.config.operatingFor,
    })

    this._walletClient = config.walletClient
    this._currentChainId = config.chainId
  }

  get currentChainId() {
    return this._currentChainId
  }

  get rpcProviderUrl() {
    return this.config.rpcUrl
  }

  get walletClient() {
    return this._walletClient
  }

  get publicClient() {
    return this._publicClient
  }

  get graphClient() {
    if (!this._graphClient) throw new Error('Graph client not initialized')
    return this._graphClient
  }

  get oracleClients() {
    return this._oracleClients
  }

  get supportedMarkets() {
    return this.config.supportedMarkets
  }

  private buildPythClients(urls_: string | string[]) {
    const urls = Array.isArray(urls_) ? urls_ : [urls_]

    return [
      ...urls.map((url_) => {
        const url = new URL(url_)
        const headers: HeadersInit = {}
        if (url.username && url.password) {
          headers.Authorization = `Basic ${Buffer.from(`${url.username}:${url.password}`).toString('base64')}`
          url.username = ''
          url.password = ''
        }
        return new HermesClient(url.toString(), {
          timeout: 30000,
          headers,
        })
      }),
      BackupPythClient,
    ]
  }
}
