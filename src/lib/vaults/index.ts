import { EvmPriceServiceConnection } from '@perennial/pyth-evm-js'
import { GraphQLClient } from 'graphql-request'
import { Address, PublicClient, WalletClient, zeroAddress } from 'viem'

import { SupportedChainId, chainIdToChainMap } from '../../constants'
import { MarketOracles } from '../markets/chain'
import {
  VaultSnapshot2,
  VaultSnapshots,
  fetchVaultPositionHistory,
  fetchVaultSnapshots as fetchVaultSnapshots,
} from './chain'
import { fetchVault7dAccumulations } from './graph'
import { BuildDepositTxArgs, buildDepositTx } from '..'

export class VaultsModule {
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
      vaultSnapshots: ({
        address = zeroAddress,
        onSuccess,
        onError,
      }: {
        address?: Address
        onSuccess?: () => void
        onError?: () => void
      }) => {
        return fetchVaultSnapshots({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          pythClient: this.config.pythClient,
          address,
          onError,
          onSuccess,
        })
      },
      vaultPositionHistory: ({ address = zeroAddress }: { address?: Address }) => {
        return fetchVaultPositionHistory({
          chainId: this.config.chainId,
          address,
          publicClient: this.config.publicClient,
        })
      },
      vault7dAccumulations: ({
        vaultAddress,
        vaultSnapshot,
        latestBlockNumber,
      }: {
        vaultAddress: Address
        vaultSnapshot: VaultSnapshot2
        latestBlockNumber: bigint
      }) => {
        return fetchVault7dAccumulations({
          vaultAddress,
          vaultSnapshot,
          graphClient: this.config.graphClient,
          latestBlockNumber,
        })
      },
    }
  }

  get build() {
    return {
      deposit: (args: Omit<BuildDepositTxArgs, 'chainId' | 'publicClient' | 'pythClient'>) => {
        return buildDepositTx({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          pythClient: this.config.pythClient,
          ...args,
        })
      },

      redeem: (args: Omit<BuildDepositTxArgs, 'chainId' | 'publicClient' | 'pythClient'>) => {
        return buildDepositTx({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          pythClient: this.config.pythClient,
          ...args,
        })
      },

      claim: (args: Omit<BuildDepositTxArgs, 'chainId' | 'publicClient' | 'pythClient'>) => {
        return buildDepositTx({
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
        const tx = this.build.deposit(...args)
        const hash = walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },

      redeem: async (...args: Parameters<typeof this.build.redeem>) => {
        const tx = this.build.redeem(...args)
        const hash = walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },

      claim: async (...args: Parameters<typeof this.build.claim>) => {
        const tx = this.build.claim(...args)
        const hash = walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
    }
  }
}
