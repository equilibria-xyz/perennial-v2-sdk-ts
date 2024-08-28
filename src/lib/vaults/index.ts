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
import { buildCommitPrice, notEmpty } from '../..'
import { SupportedChainId, chainIdToChainMap } from '../../constants'
import { OptionalAddress } from '../../types/shared'
import { throwIfZeroAddress } from '../../utils/addressUtils'
import { OracleClients, marketOraclesToUpdateDataRequest, oracleCommitmentsLatest } from '../oracle'
import { VaultSnapshot, fetchVaultPositionHistory, fetchVaultSnapshots } from './chain'

/**
 * Fetches the vault commitments for a given chain.
 * @param chainId - The chain ID.
 * @param oracleClients - {@link OracleClients}
 * @param preMarketSnapshots - The pre-market snapshots.
 * @param marketOracles - The market oracles.
 * @param publicClient - The public client.
 * @returns The vault commitments.
 */
export const fetchVaultCommitments = async ({
  chainId,
  oracleClients,
  preMarketSnapshots,
  marketOracles,
  publicClient,
}: {
  chainId: SupportedChainId
  oracleClients: OracleClients
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
  const commitments = await oracleCommitmentsLatest({
    chainId,
    oracleClients: oracleClients,
    publicClient,
    requests: marketOraclesToUpdateDataRequest(Object.values(oracles)),
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

type OmitBound<T> = Omit<T, 'chainId' | 'publicClient' | 'oracleClients' | 'graphClient' | 'address'>

type VaultConfig = {
  chainId: SupportedChainId
  publicClient: PublicClient
  graphClient?: GraphQLClient
  oracleClients: OracleClients
  walletClient?: WalletClient
  operatingFor?: Address
}

/**
 * Vaults module class
 * @param config SDK configuration
 * @param config.chainId {@link SupportedChainId}
 * @param config.publicClient Public Client
 * @param config.graphClient GraphQl Client
 * @param config.oracleClients Oracle Clients
 * @param config.walletClient Wallet Client
 * @param config.operatingFor If set, the module will read data and send multi-invoker transactions on behalf of this address.
 *
 * @returns Vaults module instance
 */
export class VaultsModule {
  private config: VaultConfig
  private defaultAddress: Address = zeroAddress

  constructor(config: VaultConfig) {
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
          oracleClients: this.config.oracleClients,
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
          oracleClients: this.config.oracleClients,
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
          oracleClients: this.config.oracleClients,
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
          oracleClients: this.config.oracleClients,
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
          oracleClients: this.config.oracleClients,
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
