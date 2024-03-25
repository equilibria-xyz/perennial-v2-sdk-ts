import { Address, GetContractReturnType, PublicClient, WalletClient, getContract } from 'viem'

import { DefaultChain, KeeperOracleAbi, MarketAbi, OracleAbi, SupportedChainId, VaultAbi } from '..'
import { ERC20Abi } from '../abi/ERC20.abi'
import { MarketFactoryAbi } from '../abi/MarketFactory.abi'
import { MultiInvokerAbi } from '../abi/MultiInvoker.abi'
import { PythFactoryAbi } from '../abi/PythFactory.abi'
import { VaultFactoryAbi } from '../abi/VaultFactory.abi'
import {
  DSUAddresses,
  MarketFactoryAddresses,
  MultiInvokerAddresses,
  PythFactoryAddresses,
  USDCAddresses,
  VaultFactoryAddresses,
} from '../constants/contracts'

export const getDSUContract = (chainId: SupportedChainId = DefaultChain.id, publicClient: PublicClient) => {
  const contract = getContract({
    address: DSUAddresses[chainId],
    abi: ERC20Abi,
    client: { public: publicClient },
  })
  return contract as any
}

export const getUSDCContract = (chainId: SupportedChainId = DefaultChain.id, publicClient: PublicClient) => {
  const contract = getContract({
    address: USDCAddresses[chainId],
    abi: ERC20Abi,
    client: { public: publicClient },
  })
  return contract
}

export const getMultiInvokerContract = (chainId: SupportedChainId = DefaultChain.id, publicClient: PublicClient) => {
  const contract = getContract({
    address: MultiInvokerAddresses[chainId],
    abi: MultiInvokerAbi,
    client: { public: publicClient },
  })

  return contract
}

export const getMarketFactoryContract = (chainId: SupportedChainId = DefaultChain.id, publicClient: PublicClient) => {
  const contract = getContract({
    address: MarketFactoryAddresses[chainId],
    abi: MarketFactoryAbi,
    client: { public: publicClient },
  })
  return contract
}

// Needs explicit return type due to: 'The inferred type of this node exceeds the maximum length the compiler will serialize. An explicit type annotation is needed.'
export const getPythFactoryContract = (
  chainId: SupportedChainId = DefaultChain.id,
  publicClient: PublicClient,
): GetContractReturnType<typeof PythFactoryAbi, { public: PublicClient }, Address> => {
  const contract = getContract({
    address: PythFactoryAddresses[chainId],
    abi: PythFactoryAbi,
    client: { public: publicClient },
  })
  return contract
}

export const getVaultFactoryContract = (chainId: SupportedChainId = DefaultChain.id, publicClient: PublicClient) => {
  const contract = getContract({
    address: VaultFactoryAddresses[chainId],
    abi: VaultFactoryAbi,
    client: { public: publicClient },
  })
  return contract
}

// Needs explicit return type due to: 'The inferred type of this node exceeds the maximum length the compiler will serialize. An explicit type annotation is needed.'
export function getVaultContract(
  vaultAddress: Address,
  publicClient: PublicClient,
): GetContractReturnType<typeof VaultAbi, { public: PublicClient }, Address> {
  return getContract({ abi: VaultAbi, address: vaultAddress, client: { public: publicClient } })
}

// Needs explicit return type due to: 'The inferred type of this node exceeds the maximum length the compiler will serialize. An explicit type annotation is needed.'
export function getMarketContract(
  marketAddress: Address,
  publicClient: PublicClient,
): GetContractReturnType<typeof MarketAbi, { public: PublicClient }, Address> {
  return getContract({ abi: MarketAbi, address: marketAddress, client: { public: publicClient } })
}

export function getOracleContract(oracleAddress: Address, publicClient: PublicClient) {
  return getContract({ abi: OracleAbi, address: oracleAddress, client: { public: publicClient } })
}

export function getKeeperOracleContract(keeperOracleAddress: Address, publicClient: PublicClient) {
  return getContract({
    abi: KeeperOracleAbi,
    address: keeperOracleAddress,
    client: { public: publicClient },
  })
}

export class ContractsModule {
  private config: {
    chainId: SupportedChainId
    publicClient: PublicClient
    signer?: WalletClient
  }

  constructor(config: { chainId: SupportedChainId; publicClient: PublicClient; signer?: WalletClient }) {
    this.config = config
  }

  public getDSUContract() {
    return getDSUContract(this.config.chainId, this.config.publicClient)
  }

  public getUSDCContract() {
    return getUSDCContract(this.config.chainId, this.config.publicClient)
  }

  public getMultiInvokerContract() {
    return getMultiInvokerContract(this.config.chainId, this.config.publicClient)
  }

  public getMarketFactoryContract() {
    return getMarketFactoryContract(this.config.chainId, this.config.publicClient)
  }

  // Needs explicit return type due to: 'The inferred type of this node exceeds the maximum length the compiler will serialize. An explicit type annotation is needed.'
  public getPythFactoryContract(): GetContractReturnType<typeof PythFactoryAbi, { public: PublicClient }, Address> {
    return getPythFactoryContract(this.config.chainId, this.config.publicClient)
  }

  public getVaultFactoryContract() {
    return getVaultFactoryContract(this.config.chainId, this.config.publicClient)
  }

  // Needs explicit return type due to: 'The inferred type of this node exceeds the maximum length the compiler will serialize. An explicit type annotation is needed.'
  public getMarketContract(
    marketAddress: Address,
  ): GetContractReturnType<typeof MarketAbi, { public: PublicClient }, Address> {
    return getMarketContract(marketAddress, this.config.publicClient)
  }

  // Needs explicit return type due to: 'The inferred type of this node exceeds the maximum length the compiler will serialize. An explicit type annotation is needed.'
  public getVaultContract(
    vaultAddress: Address,
  ): GetContractReturnType<typeof VaultAbi, { public: PublicClient }, Address> {
    return getVaultContract(vaultAddress, this.config.publicClient)
  }

  public getOracleContract(oracleAddress: Address) {
    return getOracleContract(oracleAddress, this.config.publicClient)
  }

  public getKeeperOracleContract(keeperOracleAddress: Address) {
    return getKeeperOracleContract(keeperOracleAddress, this.config.publicClient)
  }
}
