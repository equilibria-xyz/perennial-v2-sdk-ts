import { EvmPriceServiceConnection } from '@perennial/pyth-evm-js'
import { GraphQLClient } from 'graphql-request'
import { Address, PublicClient, WalletClient, zeroAddress } from 'viem'

import {
  BuildClaimTxArgs,
  BuildDepositTxArgs,
  BuildRedeemSharesTxArgs,
  MarketOracles,
  buildClaimTx,
  buildDepositTx,
  buildRedeemSharesTx,
} from '..'
import { buildCommitPrice, buildCommitmentsForOracles, notEmpty } from '../..'
import { SupportedChainId, chainIdToChainMap } from '../../constants'
import { OptionalAddress } from '../../types/shared'
import { throwIfZeroAddress } from '../../utils/addressUtils'
import { VaultSnapshot, fetchVaultPositionHistory, fetchVaultSnapshots } from './chain'
import { fetchVault7dAccumulations } from './graph'

/**
 * Fetches the vault commitments for a given chain.
 * @param chainId - The chain ID.
 * @param pythClient - The Pyth client.
 * @param preMarketSnapshots - The pre-market snapshots.
 * @param marketOracles - The market oracles.
 * @param publicClient - The public client.
 * @returns The vault commitments.
 */
export const fetchVaultCommitments = async ({
  chainId,
  pythClient,
  preMarketSnapshots,
  marketOracles,
  publicClient,
}: {
  chainId: SupportedChainId
  pythClient: EvmPriceServiceConnection
  preMarketSnapshots: VaultSnapshot['pre']['marketSnapshots']
  marketOracles: MarketOracles
  publicClient: PublicClient
}) => {
  const oracles = preMarketSnapshots
    .map((marketSnapshot) => {
      const oracle = Object.values(marketOracles).find((o) => o.address === marketSnapshot.oracle)
      if (!oracle) return
      return oracle
    })
    .filter(notEmpty)
  const commitments = await buildCommitmentsForOracles({
    chainId,
    pyth: pythClient,
    publicClient,
    marketOracles: oracles,
  })
  return commitments.map((c) => ({
    value: c.value,
    commitAction: buildCommitPrice({
      keeperFactory: c.keeperFactory,
      version: c.version,
      ids: c.ids,
      vaa: c.updateData,
      revertOnFailure: false,
      value: c.value,
    }),
  }))
}

type OmitBound<T> = Omit<T, 'chainId' | 'publicClient' | 'pythClient' | 'graphClient' | 'address'>

/**
 * Vaults module class
 * @param config SDK configuration
 * @param config.chainId {@link SupportedChainId}
 * @param config.publicClient Public Client
 * @param config.graphClient GraphQl Client
 * @param config.pythClient Pyth Client
 * @param config.walletClient Wallet Client
 * @param config.operatingFor If set, the module will read data and send multi-invoker transactions on behalf of this address.
 *
 * @returns Vaults module instance
 */
export class VaultsModule {
  private config: {
    chainId: SupportedChainId
    publicClient: PublicClient
    graphClient: GraphQLClient
    pythClient: EvmPriceServiceConnection
    walletClient?: WalletClient
    operatingFor?: Address
  }
  private defaultAddress: Address = zeroAddress

  constructor(config: {
    chainId: SupportedChainId
    publicClient: PublicClient
    graphClient: GraphQLClient
    pythClient: EvmPriceServiceConnection
    walletClient?: WalletClient
    operatingFor?: Address
  }) {
    this.config = config
    this.config.operatingFor = config.operatingFor ?? config.walletClient?.account?.address ?? this.defaultAddress
  }

  get read() {
    return {
      /**
       * Fetches the vault snapshots
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @param marketOracles {@link MarketOracles}
       * @param onError Error callback
       * @param onSuccess Success callback
       * @returns {@link VaultSnapshots}
       */
      vaultSnapshots: (args: OmitBound<Parameters<typeof fetchVaultSnapshots>[0]> & OptionalAddress = {}) => {
        return fetchVaultSnapshots({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          pythClient: this.config.pythClient,
          address: this.defaultAddress,
          ...args,
        })
      },
      /**
       * Fetches the vault commitments
       * @param preMarketSnapshots {@link VaultSnapshot['pre']['marketSnapshots']}
       * @param marketOracles {@link MarketOracles}
       * @returns The vault commitments.
       */
      vaultCommitments: (args: OmitBound<Parameters<typeof fetchVaultCommitments>[0]>) => {
        return fetchVaultCommitments({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          pythClient: this.config.pythClient,
          ...args,
        })
      },
      /**
       * Fetches the vault position history
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @returns The vault position history.
       */
      vaultPositionHistory: (
        args: OmitBound<Parameters<typeof fetchVaultPositionHistory>[0]> & OptionalAddress = {},
      ) => {
        return fetchVaultPositionHistory({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          address: this.defaultAddress,
          ...args,
        })
      },
      /**
       * Fetches the vault 7d accumulations
       * @param vaultAddress Vault Address
       * @param vaultSnapshot {@link VaultSnapshot}
       * @param latestBlockNumber Latest block number
       * @returns The vault 7d accumulations.
       */
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
      /**
       * Build a transaction to deposit into a vault
       * @param vaultAddress Vault Address
       * @param amount Amount to deposit
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @returns Vault deposit transaction data.
       */
      deposit: (args: OmitBound<BuildDepositTxArgs> & OptionalAddress) => {
        const address = args.address ?? this.defaultAddress
        throwIfZeroAddress(address)

        return buildDepositTx({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          pythClient: this.config.pythClient,
          ...args,
          address,
        })
      },
      /**
       * Build a transaction to redeem shares from a vault
       *
       * @param vaultAddress Vault Address
       * @param amount Amount to redeem
       * @param assets (optional) boolean - Whether to redeem assets
       * @param max (optional) boolean - Whether to redeem max
       * @param marketOracles {@link MarketOracles}
       * @param vaultSnapshots {@link VaultSnapshots}
       */
      redeem: (args: OmitBound<BuildRedeemSharesTxArgs> & OptionalAddress) => {
        const address = args.address ?? this.defaultAddress
        throwIfZeroAddress(address)

        return buildRedeemSharesTx({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          pythClient: this.config.pythClient,
          ...args,
          address,
        })
      },
      /**
       * Build a transaction to claim rewards from a vault
       * @param vaultAddress Vault Address
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @param marketOracles {@link MarketOracles}
       * @param vaultSnapshots {@link VaultSnapshots}
       * @returns Vault claim transaction data.
       */
      claim: (args: OmitBound<BuildClaimTxArgs> & OptionalAddress) => {
        const address = args.address ?? this.defaultAddress
        throwIfZeroAddress(address)

        return buildClaimTx({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          pythClient: this.config.pythClient,
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
       * Deposit into a vault
       * @param vaultAddress Vault Address
       * @param amount Amount to deposit
       * @param marketOracles {@link MarketOracles}
       * @param vaultSnapshots {@link VaultSnapshots}
       * @returns Transaction hash
       * */
      deposit: async (...args: Parameters<typeof this.build.deposit>) => {
        const tx = await this.build.deposit(...args)
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
      /**
       * Redeem shares from a vault
       * @param vaultAddress Vault Address
       * @param amount Amount to redeem
       * @param assets (optional) boolean - Whether to redeem assets
       * @param max (optional) boolean - Whether to redeem max
       * @param marketOracles {@link MarketOracles}
       * @param vaultSnapshots {@link VaultSnapshots}
       * @returns Transaction hash
       */
      redeem: async (...args: Parameters<typeof this.build.redeem>) => {
        const tx = await this.build.redeem(...args)
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
      /**
       * Claim rewards from a vault
       * @param vaultAddress Vault Address
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @param marketOracles {@link MarketOracles}
       * @param vaultSnapshots {@link VaultSnapshots}
       * @returns Transaction hash
       */
      claim: async (...args: Parameters<typeof this.build.claim>) => {
        const tx = await this.build.claim(...args)
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
    }
  }
}
