import { Address, PublicClient, WalletClient, encodeFunctionData } from 'viem'

import {
  Big6Math,
  ERC20Abi,
  MarketFactoryAbi,
  MarketFactoryAddresses,
  MaxUint256,
  MultiInvokerAddresses,
  SupportedChainId,
  USDCAddresses,
  VaultFactoryAbi,
  VaultFactoryAddresses,
  chainIdToChainMap,
  getUSDCContract,
  getVaultFactoryContract,
} from '..'
import { getMarketFactoryContract } from '..'

/**
 * Builds a transaction to approve USDC for the MultiInvoker contract.
 *
 * @param chainId {@link SupportedChainId}
 * @param suggestedAmount - The amount to approve. Defaults to the maximum value.
 *
 * @returns Transaction calldata, destination address and transaction value.
 */
export async function buildApproveUSDCTx({
  chainId,
  suggestedAmount = MaxUint256,
}: {
  chainId: SupportedChainId
  suggestedAmount?: bigint
}) {
  const data = encodeFunctionData({
    functionName: 'approve',
    abi: ERC20Abi,
    args: [MultiInvokerAddresses[chainId], Big6Math.abs(suggestedAmount)],
  })

  return {
    data,
    to: USDCAddresses[chainId],
    value: 0n,
  }
}

/**
 * Builds a transaction to approve the MarketFactory contract for the MultiInvoker contract.
 *
 * @param chainId {@link SupportedChainId}
 *
 * @returns Transaction calldata, destination address and transaction value.
 */
export async function buildApproveMarketFactoryTx({ chainId }: { chainId: SupportedChainId }) {
  const data = encodeFunctionData({
    abi: MarketFactoryAbi,
    functionName: 'updateOperator',
    args: [MultiInvokerAddresses[chainId], true],
  })

  return {
    to: MarketFactoryAddresses[chainId],
    value: 0n,
    data,
  }
}

/**
 * Builds a transaction to approve the VaultFactory contract for the MultiInvoker contract.
 *
 * @param chainId {@link SupportedChainId}
 *
 * @returns Transaction calldata, destination address and transaction value.
 */
export async function buildApproveVaultFactoryTx({ chainId }: { chainId: SupportedChainId }) {
  const data = encodeFunctionData({
    abi: VaultFactoryAbi,
    functionName: 'updateOperator',
    args: [MultiInvokerAddresses[chainId], true],
  })

  return {
    to: VaultFactoryAddresses[chainId],
    value: 0n,
    data,
  }
}

/**
 * Gets the USDC allowance for the MultiInvoker contract.
 *
 * @param chainId {@link SupportedChainId}
 * @param publicClient Public Client
 * @param address Wallet Address
 *
 * @returns The USDC allowance.
 */
export async function getUSDCAllowance({
  chainId,
  publicClient,
  address,
}: {
  chainId: SupportedChainId
  publicClient: PublicClient
  address: Address
}) {
  const contract = getUSDCContract(chainId, publicClient)
  const allowance = await contract.read.allowance([address, MultiInvokerAddresses[chainId]])
  return allowance
}

/**
 * Checks if the provided address is approved to interact with the market factory.
 *
 * @param chainId {@link SupportedChainId}
 * @param publicClient Public Client
 * @param address Wallet Address
 *
 * @returns Whether the MarketFactory contract is approved.
 */
export async function checkMarketFactoryApproval({
  chainId,
  publicClient,
  address,
}: {
  chainId: SupportedChainId
  publicClient: PublicClient
  address: Address
}) {
  const isMarketFactoryApproved = await getMarketFactoryContract(chainId, publicClient).read.operators([
    address,
    MultiInvokerAddresses[chainId],
  ])
  return isMarketFactoryApproved
}

/**
 * Checks if the provided address is approved to interact with the vault factory.
 *
 * @param chainId {@link SupportedChainId}
 * @param publicClient Public Client
 * @param address Wallet Address
 *
 * @returns Whether the VaultFactory contract is approved.
 */
export async function checkVaultFactoryApproval({
  chainId,
  publicClient,
  address,
}: {
  chainId: SupportedChainId
  publicClient: PublicClient
  address: Address
}) {
  const isVaultFactoryApproved = await getVaultFactoryContract(chainId, publicClient).read.operators([
    address,
    MultiInvokerAddresses[chainId],
  ])
  return isVaultFactoryApproved
}

export class OperatorModule {
  /**
   * Operator module class
   *
   * @param config SDK configuration
   * @param config.chainId {@link SupportedChainId}
   * @param config.publicClient Public Client
   * @param config.walletClient Wallet Client
   *
   * @returns Operator module instance
   */
  private config: {
    chainId: SupportedChainId
    publicClient: PublicClient
    walletClient?: WalletClient
  }

  constructor(config: { chainId: SupportedChainId; publicClient: PublicClient; walletClient?: WalletClient }) {
    this.config = config
  }

  get read() {
    return {
      /**
       * Get USDC allowance for the MultiInvoker contract
       * @param address Wallet Address
       * @returns The USDC allowance
       */
      usdcAllowance: ({ address }: { address: Address }) =>
        getUSDCAllowance({ chainId: this.config.chainId, address, publicClient: this.config.publicClient }),
      /**
       * Check if the provided address is approved to interact with the market factory
       * @param address Wallet Address
       * @returns Whether the MarketFactory contract is approved
       */
      marketFactoryApproval: ({ address }: { address: Address }) =>
        checkMarketFactoryApproval({ chainId: this.config.chainId, address, publicClient: this.config.publicClient }),
      /**
       * Check if the provided address is approved to interact with the vault factory
       * @param address Wallet Address
       * @returns Whether the VaultFactory contract is approved
       */
      vaultFactoryApproval: ({ address }: { address: Address }) =>
        checkVaultFactoryApproval({ chainId: this.config.chainId, address, publicClient: this.config.publicClient }),
    }
  }

  get build() {
    return {
      /**
       * Build a transaction to approve USDC for the MultiInvoker contract
       * @param suggestedAmount - The amount to approve
       * @returns Transaction calldata, destination address and transaction value
       */
      approveUSDC: ({ suggestedAmount }: { suggestedAmount?: bigint } = {}) =>
        buildApproveUSDCTx({ chainId: this.config.chainId, suggestedAmount }),
      /**
       * Build a transaction to approve the MarketFactory contract for the MultiInvoker contract
       * @returns Transaction calldata, destination address and transaction value
       */
      approveMarketFactoryTx: () => buildApproveMarketFactoryTx({ chainId: this.config.chainId }),
      /**
       * Build a transaction to approve the VaultFactory contract for the MultiInvoker contract
       * @returns Transaction calldata, destination address and transaction value
       */
      approveVaultFactoryTx: () => buildApproveVaultFactoryTx({ chainId: this.config.chainId }),
    }
  }

  get write() {
    /**
     * Operator module write methods
     * @throws Error if wallet client is not provided
     */
    const walletClient = this.config.walletClient
    if (!walletClient || !walletClient.account) {
      throw new Error('Wallet client required for write methods.')
    }

    const { chainId } = this.config
    const address = walletClient.account

    const txOpts = { account: address, chainId, chain: chainIdToChainMap[chainId] }

    return {
      /**
       * approves USDC for the MultiInvoker contract
       * @param suggestedAmount - The amount to approve
       * @returns Transaction hash
       */
      approveUSDC: async ({ suggestedAmount }: { suggestedAmount?: bigint } = {}) => {
        const tx = await this.build.approveUSDC({ suggestedAmount })
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
      /**
       * approves the MarketFactory contract for the MultiInvoker contract
       * @returns Transaction hash
       */
      approveMarketFactory: async () => {
        const tx = await this.build.approveMarketFactoryTx()
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
      /**
       * approves the VaultFactory contract for the MultiInvoker contract
       * @returns Transaction hash
       */
      approveVaultFactory: async () => {
        const tx = await this.build.approveVaultFactoryTx()
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
    }
  }
}
