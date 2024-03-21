import {
  Address,
  BaseError,
  ContractFunctionRevertedError,
  GetContractReturnType,
  PublicClient,
  getContract,
} from 'viem'

import { KeeperOracleAbi } from '../abi/KeeperOracle.abi'
import { MarketAbi } from '../abi/Market.abi'
import { OracleAbi } from '../abi/Oracle.abi'
import { VaultAbi } from '../abi/Vault.abi'
import { SupportedChainId } from '../constants/network'
import { ChainVaults, PerennialVaultType } from '../constants/vaults'

export function getVaultAddressForType(vaultType: PerennialVaultType, chainId: SupportedChainId) {
  switch (vaultType) {
    case 'alpha':
      return ChainVaults[chainId]?.alpha

    case 'bravo':
      return ChainVaults[chainId]?.bravo
  }
}

export function getVaultContract(
  vaultAddress: Address,
  publicClient: PublicClient,
): GetContractReturnType<typeof VaultAbi, { public: PublicClient }, Address> {
  return getContract({ abi: VaultAbi, address: vaultAddress, client: { public: publicClient } })
}

export function getMarketContract(
  marketAddress: Address,
  publicClient: PublicClient,
): GetContractReturnType<typeof MarketAbi, { public: PublicClient }, Address> {
  return getContract({ abi: MarketAbi, address: marketAddress, client: { public: publicClient } })
}

export function getOracleContract(
  oracleAddress: Address,
  publicClient: PublicClient,
): GetContractReturnType<typeof OracleAbi, { public: PublicClient }, Address> {
  return getContract({ abi: OracleAbi, address: oracleAddress, client: { public: publicClient } })
}

export function getKeeperOracleContract(
  keeperOracleAddress: Address,
  publicClient: PublicClient,
): GetContractReturnType<typeof KeeperOracleAbi, { public: PublicClient }, Address> {
  return getContract({
    abi: KeeperOracleAbi,
    address: keeperOracleAddress,
    client: { public: publicClient },
  })
}

export const bufferGasLimit = (estimatedGas: bigint) => (estimatedGas * 3n) / 2n

export function parseViemContractCustomError(err: unknown) {
  if (err instanceof BaseError) {
    const revertError = err.walk((err) => err instanceof ContractFunctionRevertedError)
    if (revertError instanceof ContractFunctionRevertedError) {
      const errorName = revertError.data?.errorName
      return errorName
    }
  }
}
