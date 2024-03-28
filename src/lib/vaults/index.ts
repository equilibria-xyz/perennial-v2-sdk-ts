import { EvmPriceServiceConnection } from '@perennial/pyth-evm-js'
import { GraphQLClient } from 'graphql-request'
import { PublicClient, WalletClient } from 'viem'

import {
  BuildClaimTxArgs,
  BuildDepositTxArgs,
  BuildRedeemSharesTxArgs,
  buildClaimTx,
  buildDepositTx,
  buildRedeemSharesTx,
} from '..'
import { SupportedChainId, chainIdToChainMap } from '../../constants'
import { fetchVaultPositionHistory, fetchVaultSnapshots } from './chain'
import { fetchVault7dAccumulations } from './graph'

type OmitBound<T> = Omit<T, 'chainId' | 'publicClient' | 'pythClient' | 'graphClient'>

export class VaultsModule {
  private config: {
    chainId: SupportedChainId
    publicClient: PublicClient
    graphClient: GraphQLClient
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
      vaultSnapshots: (args: OmitBound<Parameters<typeof fetchVaultSnapshots>[0]>) => {
        return fetchVaultSnapshots({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          pythClient: this.config.pythClient,
          ...args,
        })
      },
      vaultPositionHistory: (args: OmitBound<Parameters<typeof fetchVaultPositionHistory>[0]>) => {
        return fetchVaultPositionHistory({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          ...args,
        })
      },
      vault7dAccumulations: (args: OmitBound<Parameters<typeof fetchVault7dAccumulations>[0]>) => {
        return fetchVault7dAccumulations({
          graphClient: this.config.graphClient,
          ...args,
        })
      },
    }
  }

  get build() {
    return {
      deposit: (args: OmitBound<BuildDepositTxArgs>) => {
        return buildDepositTx({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          pythClient: this.config.pythClient,
          ...args,
        })
      },

      redeem: (args: OmitBound<BuildRedeemSharesTxArgs>) => {
        return buildRedeemSharesTx({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          pythClient: this.config.pythClient,
          ...args,
        })
      },

      claim: (args: OmitBound<BuildClaimTxArgs>) => {
        return buildClaimTx({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          pythClient: this.config.pythClient,
          ...args,
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
      deposit: async (...args: Parameters<typeof this.build.deposit>) => {
        const tx = await this.build.deposit(...args)
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },

      redeem: async (...args: Parameters<typeof this.build.redeem>) => {
        const tx = await this.build.redeem(...args)
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },

      claim: async (...args: Parameters<typeof this.build.claim>) => {
        const tx = await this.build.claim(...args)
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
    }
  }
}
