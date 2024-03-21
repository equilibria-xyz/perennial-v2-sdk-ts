import { EvmPriceServiceConnection } from '@perennial/pyth-evm-js'
import { GraphQLClient } from 'graphql-request'
import { Address, PublicClient, WalletClient, zeroAddress } from 'viem'

import { SupportedChainId } from '../../constants'
import { MarketOracles } from '../markets/chain'
import { VaultSnapshot2, VaultSnapshots, fetchVaultPositionHistory, fetchVaultSnapshotsV2 } from './chain'
import { fetchVault7dAccumulations } from './graph'
import { getVaultTransactions } from './tx'

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

  public fetchVaultSnapshotsV2 = ({
    address = zeroAddress,
    onSuccess,
    onError,
  }: {
    address?: Address
    onSuccess?: () => void
    onError?: () => void
  }) => {
    return fetchVaultSnapshotsV2({
      chainId: this.config.chainId,
      publicClient: this.config.publicClient,
      pythClient: this.config.pythClient,
      address,
      onError,
      onSuccess,
    })
  }

  public fetchVaultPositionHistory = ({ address = zeroAddress }: { address?: Address }) => {
    return fetchVaultPositionHistory({
      chainId: this.config.chainId,
      address,
      publicClient: this.config.publicClient,
    })
  }

  public getVaultTransactions = ({
    vaultAddress,
    marketOracles,
    vaultSnapshots,
    address,
  }: {
    marketOracles?: MarketOracles
    vaultSnapshots?: VaultSnapshots
    vaultAddress: Address
    address?: Address
  }) => {
    return getVaultTransactions({
      chainId: this.config.chainId,
      publicClient: this.config.publicClient,
      walletClient: this.config.walletClient,
      pythClient: this.config.pythClient,
      vaultAddress,
      marketOracles,
      vaultSnapshots,
      address,
    })
  }

  public fetchVault7dAccumulations = ({
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
  }
}
