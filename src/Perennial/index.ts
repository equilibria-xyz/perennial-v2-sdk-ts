import { EvmPriceServiceConnection } from '@perennial/pyth-evm-js'
import { GraphQLClient } from 'graphql-request'
import { Chain, PublicClient, Transport, WalletClient, createPublicClient, http } from 'viem'

import { SupportedChainId } from '..'
import { DefaultChain, chainIdToChainMap } from '../constants/network'
import { ContractsModule } from '../lib/contracts'
import { MarketsModule } from '../lib/markets'
import { VaultsModule } from '../lib/vaults'

export type SDKConfig = {
  rpcUrl: string
  walletClient?: WalletClient
  chainId: SupportedChainId
  graphUrl: string
  pythUrl: string
}
export default class PerennialSDK {
  private config: SDKConfig
  private _currentChainId: SupportedChainId = DefaultChain.id
  private _publicClient: PublicClient<Transport<'http'>, Chain>
  private _walletClient?: WalletClient
  private _pythClient: EvmPriceServiceConnection
  private _graphClient: GraphQLClient
  public contracts: ContractsModule
  public markets: MarketsModule
  public vaults: VaultsModule

  constructor(config: SDKConfig) {
    this.config = config
    this._publicClient = createPublicClient({
      chain: chainIdToChainMap[config.chainId] as Chain,
      transport: http(config.rpcUrl),
    })
    this._pythClient = new EvmPriceServiceConnection(config.pythUrl, {
      timeout: 30000,
      priceFeedRequestConfig: { binary: true },
    })
    this._graphClient = new GraphQLClient(config.graphUrl)
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
      pythClient: this._pythClient,
    })
    this.vaults = new VaultsModule({
      chainId: config.chainId,
      publicClient: this._publicClient,
      walletClient: config.walletClient,
      graphClient: this._graphClient,
      pythClient: this._pythClient,
    })

    this._walletClient = config.walletClient
    this._publicClient = this._publicClient
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

  // TODO: Remove this type annotation when Viem fixes typings
  get publicClient(): PublicClient {
    return this._publicClient
  }

  get graphClient() {
    return this._graphClient
  }
}
