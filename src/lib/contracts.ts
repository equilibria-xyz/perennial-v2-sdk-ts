import { Address, GetContractReturnType, PublicClient, WalletClient, getContract } from 'viem'

import { DefaultChain, SupportedChainId } from '..'
import { ERC20Abi } from '../abi/ERC20.abi'
import { MarketFactoryAbi } from '../abi/MarketFactory.abi'
import { MultiInvoker2Abi } from '../abi/MultiInvoker2.abi'
import { PythFactoryAbi } from '../abi/PythFactory.abi'
import { VaultFactoryAbi } from '../abi/VaultFactory.abi'
import {
  DSUAddresses,
  MarketFactoryAddresses,
  MultiInvokerV2Addresses,
  PythFactoryAddresses,
  USDCAddresses,
  VaultFactoryAddresses,
} from '../constants/contracts'
import { getOperatorTransactions } from './operators'

export const getDSUContract = (
  chainId: SupportedChainId = DefaultChain.id,
  publicClient: PublicClient,
): GetContractReturnType<typeof ERC20Abi, { public: PublicClient }, Address> => {
  const contract = getContract({
    address: DSUAddresses[chainId],
    abi: ERC20Abi,
    client: { public: publicClient },
  })
  return contract as any
}

export const getUSDCContract = (
  chainId: SupportedChainId = DefaultChain.id,
  publicClient: PublicClient,
): GetContractReturnType<typeof ERC20Abi, { public: PublicClient }, Address> => {
  const contract = getContract({
    address: USDCAddresses[chainId],
    abi: ERC20Abi,
    client: { public: publicClient },
  })
  return contract
}

// TODO: remove this when Viem fixes their typing issues
export const getUSDCContractWrite = (
  chainId: SupportedChainId = DefaultChain.id,
  publicClient: PublicClient,
  signer: WalletClient,
): GetContractReturnType<typeof ERC20Abi, { public: PublicClient; wallet: WalletClient }, Address> => {
  const contract = getContract({
    address: USDCAddresses[chainId],
    abi: ERC20Abi,
    client: { public: publicClient, wallet: signer },
  })
  return contract
}

export const getMultiInvokerV2Contract = (
  chainId: SupportedChainId = DefaultChain.id,
  publicClient: PublicClient,
): GetContractReturnType<typeof MultiInvoker2Abi, { public: PublicClient }, Address> => {
  const contract = getContract({
    address: MultiInvokerV2Addresses[chainId],
    abi: MultiInvoker2Abi,
    client: { public: publicClient },
  })

  return contract
}

// TODO: remove this when Viem fixes their typing issues
export const getMultiInvokerV2ContractWrite = (
  chainId: SupportedChainId = DefaultChain.id,
  publicClient: PublicClient,
  signer: WalletClient,
): GetContractReturnType<typeof MultiInvoker2Abi, { public: PublicClient; wallet: WalletClient }, Address> => {
  const contract = getContract({
    address: MultiInvokerV2Addresses[chainId],
    abi: MultiInvoker2Abi,
    client: { public: publicClient, wallet: signer },
  })

  return contract
}

export const getMarketFactoryContract = (
  chainId: SupportedChainId = DefaultChain.id,
  publicClient: PublicClient,
): GetContractReturnType<typeof MarketFactoryAbi, { public: PublicClient }, Address> => {
  const contract = getContract({
    address: MarketFactoryAddresses[chainId],
    abi: MarketFactoryAbi,
    client: { public: publicClient },
  })
  return contract
}

export const getMarketFactoryContractWrite = (
  chainId: SupportedChainId = DefaultChain.id,
  publicClient: PublicClient,
  signer: WalletClient,
): GetContractReturnType<typeof MarketFactoryAbi, { public: PublicClient; wallet: WalletClient }, Address> => {
  const contract = getContract({
    address: MarketFactoryAddresses[chainId],
    abi: MarketFactoryAbi,
    client: { public: publicClient, wallet: signer },
  })
  return contract
}

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

export const getVaultFactoryContract = (
  chainId: SupportedChainId = DefaultChain.id,
  publicClient: PublicClient,
): GetContractReturnType<typeof VaultFactoryAbi, { public: PublicClient }, Address> => {
  const contract = getContract({
    address: VaultFactoryAddresses[chainId],
    abi: VaultFactoryAbi,
    client: { public: publicClient },
  })
  return contract
}

// TODO: remove this when Viem fixes their typing issues
export const getVaultFactoryContractWrite = (
  chainId: SupportedChainId = DefaultChain.id,
  publicClient: PublicClient,
  signer: WalletClient,
): GetContractReturnType<typeof VaultFactoryAbi, { public: PublicClient; wallet: WalletClient }, Address> => {
  const contract = getContract({
    address: VaultFactoryAddresses[chainId],
    abi: VaultFactoryAbi,
    client: { public: publicClient, wallet: signer },
  })
  return contract
}

export class ContractsModule {
  private config: {
    chainId: SupportedChainId
    publicClient: PublicClient
    signer?: WalletClient
  }

  constructor(config: { chainId: SupportedChainId; publicClient: PublicClient; signer?: WalletClient }) {
    if (!config.chainId) throw new Error('chainId is required')
    if (!config.publicClient) throw new Error('PublicClient is required')
    this.config = config
  }

  public updateConfig(
    config: Partial<{
      chainId: SupportedChainId
      publicClient: PublicClient
      signer?: WalletClient
    }>,
  ) {
    this.config = { ...this.config, ...config }
  }

  public getDSUContract = (): GetContractReturnType<typeof ERC20Abi, { public: PublicClient }, Address> => {
    return getDSUContract(this.config.chainId, this.config.publicClient)
  }

  public getUSDCContract = (): GetContractReturnType<typeof ERC20Abi, { public: PublicClient }, Address> => {
    return getUSDCContract(this.config.chainId, this.config.publicClient)
  }

  public getMultiInvokerV2Contract = (): GetContractReturnType<
    typeof MultiInvoker2Abi,
    { public: PublicClient },
    Address
  > => {
    return getMultiInvokerV2Contract(this.config.chainId, this.config.publicClient)
  }

  public getMarketFactoryContract = (): GetContractReturnType<
    typeof MarketFactoryAbi,
    { public: PublicClient },
    Address
  > => {
    return getMarketFactoryContract(this.config.chainId, this.config.publicClient)
  }

  public getPythFactoryContract = (): GetContractReturnType<
    typeof PythFactoryAbi,
    { public: PublicClient },
    Address
  > => {
    return getPythFactoryContract(this.config.chainId, this.config.publicClient)
  }

  public getVaultFactoryContract = (): GetContractReturnType<
    typeof VaultFactoryAbi,
    { public: PublicClient },
    Address
  > => {
    return getVaultFactoryContract(this.config.chainId, this.config.publicClient)
  }

  public getOperatorTransactions = (walletClient: WalletClient) => {
    return getOperatorTransactions({
      chainId: this.config.chainId,
      publicClient: this.config.publicClient,
      walletClient,
    })
  }
}
