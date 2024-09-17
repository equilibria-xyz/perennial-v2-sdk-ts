import { Address, GetContractReturnType, PublicClient, WalletClient, getContract } from 'viem'

import {
  DefaultChain,
  EmptysetReserveAbi,
  KeeperOracleAbi,
  MarketAbi,
  OracleAbi,
  OracleFactoryAbi,
  SupportedChainId,
  VaultAbi,
} from '..'
import { ERC20Abi } from '../abi/ERC20.abi'
import { GasOracleAbi } from '../abi/GasOracle.abi'
import { KeeperFactoryAbi } from '../abi/KeeperFactory.abi'
import { MarketFactoryAbi } from '../abi/MarketFactory.abi'
import { MultiInvokerAbi } from '../abi/MultiInvoker.abi'
import { VaultFactoryAbi } from '../abi/VaultFactory.abi'
import {
  DSUAddresses,
  EmptysetReserveAddresses,
  MarketFactoryAddresses,
  MultiInvokerAddresses,
  OracleFactoryAddresses,
  PythFactoryAddresses,
  USDCAddresses,
  VaultFactoryAddresses,
} from '../constants/contracts'

/**
 * Returns the DSU contract instance.
 * @param chainId {@link SupportedChainId}
 * @param publicClient {@link PublicClient}
 * @returns The DSU contract instance.
 */
export const getDSUContract = (chainId: SupportedChainId = DefaultChain.id, publicClient: PublicClient) => {
  const contract = getContract({
    address: DSUAddresses[chainId],
    abi: ERC20Abi,
    client: { public: publicClient },
  })
  return contract as any
}
/**
 * Returns the USDC contract instance.
 * @param chainId {@link SupportedChainId}
 * @param publicClient {@link PublicClient}
 * @returns The USDC contract instance.
 */
export const getUSDCContract = (chainId: SupportedChainId = DefaultChain.id, publicClient: PublicClient) => {
  const contract = getContract({
    address: USDCAddresses[chainId],
    abi: ERC20Abi,
    client: { public: publicClient },
  })
  return contract
}
/**
 * Returns the EmptysetReserve contract instance.
 * @param chainId {@link SupportedChainId}
 * @param publicClient {@link PublicClient}
 * @returns The EmptysetReserve contract instance.
 */
export const getEmptysetReserveContarct = (chainId: SupportedChainId = DefaultChain.id, publicClient: PublicClient) => {
  const contract = getContract({
    address: EmptysetReserveAddresses[chainId],
    abi: EmptysetReserveAbi,
    client: { public: publicClient },
  })
  return contract
}
/**
 * Returns the MultiInvoker contract instance.
 * @param chainId {@link SupportedChainId}
 * @param publicClient {@link PublicClient}
 * @returns The MultiInvoker contract instance.
 */
export const getMultiInvokerContract = (chainId: SupportedChainId = DefaultChain.id, publicClient: PublicClient) => {
  const contract = getContract({
    address: MultiInvokerAddresses[chainId],
    abi: MultiInvokerAbi,
    client: { public: publicClient },
  })

  return contract
}
/**
 * Returns the MarketFactory contract instance.
 * @param chainId {@link SupportedChainId}
 * @param publicClient {@link PublicClient}
 * @returns The MarketFactory contract instance.
 */
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

// Needs explicit return type due to: 'The inferred type of this node exceeds the maximum length the compiler will serialize. An explicit type annotation is needed.'
/**
 * Returns the KeeperFactory contract instance.
 * @param keeperFactoryAddress {@link Address}
 * @param chainId {@link SupportedChainId}
 * @param publicClient {@link PublicClient}
 * @returns The KeeperFactory contract instance.
 */
export const getKeeperFactoryContract = (
  keeperFactoryAddress: Address,
  publicClient: PublicClient,
): GetContractReturnType<typeof KeeperFactoryAbi, { public: PublicClient }, Address> => {
  const contract = getContract({
    address: keeperFactoryAddress,
    abi: KeeperFactoryAbi,
    client: { public: publicClient },
  })
  return contract
}

/**
 * Returns the OracleFactory contract instance.
 * @param chainId {@link SupportedChainId}
 * @param publicClient {@link PublicClient}
 * @returns The OracleFactory contract instance.
 */
export const getOracleFactoryContract = (
  chainId: SupportedChainId = DefaultChain.id,
  publicClient: PublicClient,
): GetContractReturnType<typeof OracleFactoryAbi, { public: PublicClient }, Address> => {
  const contract = getContract({
    address: OracleFactoryAddresses[chainId],
    abi: OracleFactoryAbi,
    client: { public: publicClient },
  })
  return contract
}

/**
 * Returns the GasOracle contract instance.
 * @param gasOracleAddress {@link Address}
 * @param publicClient {@link PublicClient}
 * @returns The GasOracle contract instance.
 */
export const getGasOracleContract = (
  gasOracleAddress: Address,
  publicClient: PublicClient,
): GetContractReturnType<typeof GasOracleAbi, { public: PublicClient }, Address> => {
  const contract = getContract({
    address: gasOracleAddress,
    abi: GasOracleAbi,
    client: { public: publicClient },
  })
  return contract
}

// Needs explicit return type due to: 'The inferred type of this node exceeds the maximum length the compiler will serialize. An explicit type annotation is needed.'
/**
 * Returns the PythFactory contract instance.
 * @param chainId {@link SupportedChainId}
 * @param publicClient {@link PublicClient}
 * @returns The PythFactory contract instance.
 */
export const getPythFactoryContract = (
  chainId: SupportedChainId = DefaultChain.id,
  publicClient: PublicClient,
): GetContractReturnType<typeof KeeperFactoryAbi, { public: PublicClient }, Address> => {
  return getKeeperFactoryContract(PythFactoryAddresses[chainId], publicClient)
}
/**
 * Returns the VaultFactory contract instance.
 * @param chainId {@link SupportedChainId}
 * @param publicClient {@link PublicClient}
 * @returns The VaultFactory contract instance.
 */
export const getVaultFactoryContract = (chainId: SupportedChainId = DefaultChain.id, publicClient: PublicClient) => {
  const contract = getContract({
    address: VaultFactoryAddresses[chainId],
    abi: VaultFactoryAbi,
    client: { public: publicClient },
  })
  return contract
}

// Needs explicit return type due to: 'The inferred type of this node exceeds the maximum length the compiler will serialize. An explicit type annotation is needed.'
/**
 * Returns the Vault contract instance.
 * @param vaultAddress Vault {@link Address}
 * @param publicClient {@link PublicClient}
 * @returns The Vault contract instance.
 */
export function getVaultContract(
  vaultAddress: Address,
  publicClient: PublicClient,
): GetContractReturnType<typeof VaultAbi, { public: PublicClient }, Address> {
  return getContract({ abi: VaultAbi, address: vaultAddress, client: { public: publicClient } })
}

// Needs explicit return type due to: 'The inferred type of this node exceeds the maximum length the compiler will serialize. An explicit type annotation is needed.'
/**
 * Returns the Market contract instance.
 * @param marketAddress Market {@link Address}
 * @param publicClient {@link PublicClient}
 * @returns The Market contract instance.
 */
export function getMarketContract(
  marketAddress: Address,
  publicClient: PublicClient,
): GetContractReturnType<typeof MarketAbi, { public: PublicClient }, Address> {
  return getContract({ abi: MarketAbi, address: marketAddress, client: { public: publicClient } })
}
/**
 * Returns the Oracle contract instance.
 * @param oracleAddress Oracle {@link Address}
 * @param publicClient {@link PublicClient}
 * @returns The Oracle contract instance.
 */
export function getOracleContract(oracleAddress: Address, publicClient: PublicClient) {
  return getContract({ abi: OracleAbi, address: oracleAddress, client: { public: publicClient } })
}
/**
 * Returns the KeeperOracle contract instance.
 * @param keeperOracleAddress Keeper oracle {@link Address}
 * @param publicClient {@link PublicClient}
 * @returns The KeeperOracle contract instance.
 */
export function getKeeperOracleContract(keeperOracleAddress: Address, publicClient: PublicClient) {
  return getContract({
    abi: KeeperOracleAbi,
    address: keeperOracleAddress,
    client: { public: publicClient },
  })
}

/**
 * Contracts module class
 * @param config SDK configuration
 * @param config.chainId {@link SupportedChainId}
 * @param config.publicClient {@link PublicClient}
 * @param config.signer {@link WalletClient}
 *
 * @returns Contracts module instance
 */
export class ContractsModule {
  private config: {
    chainId: SupportedChainId
    publicClient: PublicClient
    signer?: WalletClient
  }

  constructor(config: { chainId: SupportedChainId; publicClient: PublicClient; signer?: WalletClient }) {
    this.config = config
  }
  /**
   * Returns the DSU contract instance.
   * @returns The DSU contract instance.
   */
  public getDSUContract() {
    return getDSUContract(this.config.chainId, this.config.publicClient)
  }
  /**
   * Returns the USDC contract instance.
   * @returns The USDC contract instance.
   */
  public getUSDCContract() {
    return getUSDCContract(this.config.chainId, this.config.publicClient)
  }
  /**
   * Returns the EmptysetReserve contract instance.
   * @returns The EmptysetReserve contract instance.
   */
  public getEmptysetReserveContract() {
    return getEmptysetReserveContarct(this.config.chainId, this.config.publicClient)
  }
  /**
   * Returns the MultiInvoker contract instance.
   * @returns The MultiInvoker contract instance.
   */
  public getMultiInvokerContract() {
    return getMultiInvokerContract(this.config.chainId, this.config.publicClient)
  }
  /**
   * Returns the MarketFactory contract instance.
   * @returns The MarketFactory contract instance.
   */
  public getMarketFactoryContract(): GetContractReturnType<typeof MarketFactoryAbi, { public: PublicClient }, Address> {
    return getMarketFactoryContract(this.config.chainId, this.config.publicClient)
  }

  /**
   * Returns the OracleFactory contract instance.
   * @returns The OracleFactory contract instance.
   */
  public getOracleFactoryContract(): GetContractReturnType<typeof OracleFactoryAbi, { public: PublicClient }, Address> {
    return getOracleFactoryContract(this.config.chainId, this.config.publicClient)
  }

  /**
   * Returns the GasOracle contract instance.
   * @returns The GasOracle contract instance.
   */
  public getGasOracleContract(
    gasOracleAddress: Address,
  ): GetContractReturnType<typeof GasOracleAbi, { public: PublicClient }, Address> {
    return getGasOracleContract(gasOracleAddress, this.config.publicClient)
  }

  // Needs explicit return type due to: 'The inferred type of this node exceeds the maximum length the compiler will serialize. An explicit type annotation is needed.'
  /**
   * Returns the KeeperFactory contract instance.
   * @param keeperFactoryAddress - The keeper factory address.
   * @returns The KeeperFactory contract instance.
   */
  public getKeeperFactoryContract(
    keeperFactoryAddress: Address,
  ): GetContractReturnType<typeof KeeperFactoryAbi, { public: PublicClient }, Address> {
    return getKeeperFactoryContract(keeperFactoryAddress, this.config.publicClient)
  }

  // Needs explicit return type due to: 'The inferred type of this node exceeds the maximum length the compiler will serialize. An explicit type annotation is needed.'
  /**
   * Returns the PythFactory contract instance.
   * @returns The PythFactory contract instance.
   */
  public getPythFactoryContract(): GetContractReturnType<typeof KeeperFactoryAbi, { public: PublicClient }, Address> {
    return getPythFactoryContract(this.config.chainId, this.config.publicClient)
  }
  /**
   * Returns the VaultFactory contract instance.
   * @returns The VaultFactory contract instance.
   */
  public getVaultFactoryContract() {
    return getVaultFactoryContract(this.config.chainId, this.config.publicClient)
  }

  // Needs explicit return type due to: 'The inferred type of this node exceeds the maximum length the compiler will serialize. An explicit type annotation is needed.'
  /**
   * Returns the Market contract instance.
   * @param marketAddress - The market address.
   * @returns The Market contract instance.
   */
  public getMarketContract(
    marketAddress: Address,
  ): GetContractReturnType<typeof MarketAbi, { public: PublicClient }, Address> {
    return getMarketContract(marketAddress, this.config.publicClient)
  }

  // Needs explicit return type due to: 'The inferred type of this node exceeds the maximum length the compiler will serialize. An explicit type annotation is needed.'
  /**
   * Returns the Vault contract instance.
   * @param vaultAddress - The vault address.
   * @returns The Vault contract instance.
   */
  public getVaultContract(
    vaultAddress: Address,
  ): GetContractReturnType<typeof VaultAbi, { public: PublicClient }, Address> {
    return getVaultContract(vaultAddress, this.config.publicClient)
  }
  /**
   * Returns the Oracle contract instance.
   * @param oracleAddress - The oracle address.
   * @returns The Oracle contract instance.
   */
  public getOracleContract(oracleAddress: Address) {
    return getOracleContract(oracleAddress, this.config.publicClient)
  }
  /**
   * Returns the KeeperOracle contract instance.
   * @param keeperOracleAddress - The keeper oracle address.
   * @returns The KeeperOracle contract instance.
   */
  public getKeeperOracleContract(keeperOracleAddress: Address) {
    return getKeeperOracleContract(keeperOracleAddress, this.config.publicClient)
  }
}
