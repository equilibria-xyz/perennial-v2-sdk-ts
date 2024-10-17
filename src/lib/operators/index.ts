import { Address, PublicClient, WalletClient, encodeFunctionData, getAddress, zeroAddress } from 'viem'

import {
  Big6Math,
  DSUAddresses,
  ERC20Abi,
  EmptysetReserveAbi,
  EmptysetReserveAddresses,
  MarketFactoryAbi,
  MarketFactoryAddresses,
  MaxUint256,
  MultiInvokerAddresses,
  SupportedChainId,
  USDCAddresses,
  VaultFactoryAbi,
  VaultFactoryAddresses,
  chainIdToChainMap,
  getDSUContract,
  getMarketFactoryContract,
  getMultiInvokerContract,
  getUSDCContract,
  getVaultFactoryContract,
} from '../..'
import { OptionalAddress } from '../../types/shared'

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
 * Builds a transaction to approve DSU for the EmptysetReserve contract.
 *
 * @param chainId {@link SupportedChainId}
 * @param suggestedAmount - The amount to approve in 18 decimal precision. Defaults to the maximum value.
 *
 * @returns Transaction calldata, destination address and transaction value.
 */
export async function buildApproveDSUReserveTx({
  chainId,
  suggestedAmount = MaxUint256,
}: {
  chainId: SupportedChainId
  suggestedAmount?: bigint
}) {
  const data = encodeFunctionData({
    abi: ERC20Abi,
    functionName: 'approve',
    args: [EmptysetReserveAddresses[chainId], Big6Math.abs(suggestedAmount)],
  })

  return {
    to: DSUAddresses[chainId],
    value: 0n,
    data,
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
 * Builds a transaction to update the MultiInvoker operator.
 *
 * @param chainId {@link SupportedChainId}
 * @param operator - The operator address.
 * @param enabled - Set the address as enabled or disabled.
 *
 * @returns Transaction calldata, destination address and transaction value.
 */
export async function buildUpdateMultiInvokerOperatorTx({
  chainId,
  operator,
  enabled,
}: {
  chainId: SupportedChainId
  operator: Address
  enabled: boolean
}) {
  const data = encodeFunctionData({
    abi: MarketFactoryAbi,
    functionName: 'updateOperator',
    args: [operator, enabled],
  })

  return {
    to: MultiInvokerAddresses[chainId],
    value: 0n,
    data,
  }
}

/**
 * Builds a transaction to update the access for a batch of signers and operators in the MarketFactory contract.
 *
 * @param chainId {@link SupportedChainId}
 * @param signers - The signers to update access for.
 * @param operators - The operators to update access for.
 *
 * @returns Transaction calldata, destination address and transaction value.
 */
export async function buildAccessUpdateBatchTx({
  chainId,
  signers,
  operators,
}: {
  chainId: SupportedChainId
  signers: {
    signer: Address
    approved: boolean
  }[]
  operators: {
    operator: Address
    approved: boolean
  }[]
}) {
  const data = encodeFunctionData({
    abi: MarketFactoryAbi,
    functionName: 'updateAccessBatch',
    args: [
      signers.map(({ signer, approved }) => ({ accessor: signer, approved })),
      operators.map(({ operator, approved }) => ({ accessor: operator, approved })),
    ],
  })

  return {
    to: MarketFactoryAddresses[chainId],
    value: 0n,
    data,
  }
}

/**
 * Builds a transaction to unwrap DSU into USDC.
 * @param chainId {@link SupportedChainId}
 * @param amount - The amount to unwrap in 18 decimal precision.
 */
export async function buildUnwrapDSUTx({ chainId, amount }: { chainId: SupportedChainId; amount: bigint }) {
  const data = encodeFunctionData({
    abi: EmptysetReserveAbi,
    functionName: 'redeem',
    args: [amount],
  })

  return {
    to: EmptysetReserveAddresses[chainId],
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
 * Gets the DSU allowance for the EmptysetReserve contract.
 *
 * @param chainId {@link SupportedChainId}
 * @param publicClient Public Client
 * @param address Wallet Address
 *
 * @returns The DSU allowance.
 */
export async function getDSUAllowance({
  chainId,
  publicClient,
  address,
}: {
  chainId: SupportedChainId
  publicClient: PublicClient
  address: Address
}) {
  const contract = getDSUContract(chainId, publicClient)
  const allowance = await contract.read.allowance([address, EmptysetReserveAddresses[chainId]])
  return allowance
}

/**
 * Checks if the MultiInvoker contract is approved to interact with Perennial Markets by the provided address.
 *
 * @param chainId {@link SupportedChainId}
 * @param publicClient Public Client
 * @param address Wallet Address
 *
 * @returns Whether the MultiInvoker contract is approved.
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
  const { operators } = await checkMarketFactoryAccessors({
    chainId,
    publicClient,
    address,
    signers: [],
    operators: [MultiInvokerAddresses[chainId]],
  })
  return Boolean(operators.find(({ operator }) => operator === MultiInvokerAddresses[chainId])?.approved)
}

/**
 * Checks if the provided signers and operators have access to the MarketFactory contract.
 *
 * @param chainId {@link SupportedChainId}
 * @param publicClient Public Client
 * @param address Wallet Address
 * @param signers - The signers to check access for.
 * @param operators - The operators to check access for.
 *
 * @returns The access status for the provided signers and operators.
 */
export async function checkMarketFactoryAccessors({
  chainId,
  publicClient,
  address,
  signers,
  operators,
}: {
  chainId: SupportedChainId
  publicClient: PublicClient
  address: Address
  signers: Address[]
  operators: Address[]
}): Promise<{
  signers: {
    signer: Address
    approved: boolean
  }[]
  operators: {
    operator: Address
    approved: boolean
  }[]
}> {
  const marketFactory = getMarketFactoryContract(chainId, publicClient)
  const signerAccess = await Promise.all(
    signers.map(async (signer) => ({
      signer: getAddress(signer),
      approved: await marketFactory.read.signers([address, signer]),
    })),
  )
  const operatorAccess = await Promise.all(
    operators.map(async (operator) => ({
      operator: getAddress(operator),
      approved:
        (await marketFactory.read.operators([address, operator])) || (await marketFactory.read.extensions([operator])),
    })),
  )
  return {
    signers: signerAccess,
    operators: operatorAccess,
  }
}

/**
 * Checks if the MultiInvoker contract is approved to interact with Perennial Vaults by the provided address.
 *
 * @param chainId {@link SupportedChainId}
 * @param publicClient Public Client
 * @param address Wallet Address
 *
 * @returns Whether the MultiInvoker contract is approved.
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

/**
 * Checks if the provided operator address is approved to operator on behalf of the address in the MultiInvoker contract.
 *
 * @param chainId {@link SupportedChainId}
 * @param publicClient Public Client
 * @param address Wallet Address
 * @param operator Operator Address
 *
 * @returns Whether the Operator is approve in the MultiInvoker contract.
 */
export async function checkMultiInvokerOperatorApproval({
  chainId,
  publicClient,
  address,
  operator,
}: {
  chainId: SupportedChainId
  publicClient: PublicClient
  address: Address
  operator: Address
}) {
  const isOperatorApproved = await getMultiInvokerContract(chainId, publicClient).read.operators([address, operator])
  return isOperatorApproved
}

type OmitBound<T> = Omit<T, 'chainId' | 'publicClient' | 'address'>

/**
 * Operator module class
 *
 * @param config SDK configuration
 * @param config.chainId {@link SupportedChainId}
 * @param config.publicClient Public Client
 * @param config.walletClient Wallet Client
 * @param config.operatingFor If set, the module will read data on behalf of this address.
 *
 * @returns Operator module instance
 */
export class OperatorModule {
  private config: {
    chainId: SupportedChainId
    publicClient: PublicClient
    walletClient?: WalletClient
    operatingFor?: Address
  }
  private defaultAddress: Address = zeroAddress

  constructor(config: {
    chainId: SupportedChainId
    publicClient: PublicClient
    walletClient?: WalletClient
    operatingFor?: Address
  }) {
    this.config = config
    this.defaultAddress = config.operatingFor ?? config.walletClient?.account?.address ?? this.defaultAddress
  }

  get read() {
    return {
      /**
       * Get USDC allowance for the MultiInvoker contract
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @returns The USDC allowance
       */
      usdcAllowance: (args: OmitBound<Parameters<typeof getUSDCAllowance>[0]> & OptionalAddress = {}) =>
        getUSDCAllowance({
          chainId: this.config.chainId,
          address: this.defaultAddress,
          publicClient: this.config.publicClient,
          ...args,
        }),

      /**
       * Get DSU allowance for the EmptysetReserve contract
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @returns The DSU allowance
       */
      dsuAllowance: (args: OmitBound<Parameters<typeof getDSUAllowance>[0]> & OptionalAddress = {}) =>
        getDSUAllowance({
          chainId: this.config.chainId,
          address: this.defaultAddress,
          publicClient: this.config.publicClient,
          ...args,
        }),
      /**
       * Check if the MultiInvoker contract is approved to interact with Perennial Markets by the provided address.
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @returns Whether the MarketFactory contract is approved
       */
      marketFactoryApproval: (
        args: OmitBound<Parameters<typeof checkMarketFactoryApproval>[0]> & OptionalAddress = {},
      ) =>
        checkMarketFactoryApproval({
          chainId: this.config.chainId,
          address: this.defaultAddress,
          publicClient: this.config.publicClient,
          ...args,
        }),
      /**
       * Check if the MultiInvoker contract is approved to interact with Perennial Vaults by the provided address.
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @returns Whether the VaultFactory contract is approved
       */
      vaultFactoryApproval: (args: OmitBound<Parameters<typeof checkVaultFactoryApproval>[0]> & OptionalAddress = {}) =>
        checkVaultFactoryApproval({
          chainId: this.config.chainId,
          address: this.defaultAddress,
          publicClient: this.config.publicClient,
          ...args,
        }),

      /**
       * Check if the provided operator address is approved to operator on behalf of the address in the MultiInvoker contract
       * @param operator Operator Address
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @returns Whether the Operator is approve in the MultiInvoker contract
       */
      multiInvokerOperatorApproval: (
        args: OmitBound<Parameters<typeof checkMultiInvokerOperatorApproval>[0]> & OptionalAddress,
      ) =>
        checkMultiInvokerOperatorApproval({
          chainId: this.config.chainId,
          address: this.defaultAddress,
          publicClient: this.config.publicClient,
          ...args,
        }),

      /**
       * Check if the provided signers and operators have access to operate on Perennial markets by the provided address.
       * @param address Wallet Address [defaults to operatingFor or walletSigner address if set]
       * @returns The access status for the provided signers and operators.
       */
      marketFactoryAccessors: (args: OmitBound<Parameters<typeof checkMarketFactoryAccessors>[0]> & OptionalAddress) =>
        checkMarketFactoryAccessors({
          chainId: this.config.chainId,
          address: this.defaultAddress,
          publicClient: this.config.publicClient,
          ...args,
        }),
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
       * Build a transaction to approve DSU for the EmptysetReserve contract
       * @param suggestedAmount - The amount to approve
       * @returns Transaction calldata, destination address and transaction value
       */
      approveDSU: ({ suggestedAmount }: { suggestedAmount?: bigint } = {}) =>
        buildApproveDSUReserveTx({ chainId: this.config.chainId, suggestedAmount }),

      /**
       * Build a transaction to approve the MultiInvoker contract as an operator in the MarketFactory contract
       * @returns Transaction calldata, destination address and transaction value
       */
      approveMarketFactoryTx: () => buildApproveMarketFactoryTx({ chainId: this.config.chainId }),
      /**
       * Build a transaction to approve the MultiInvoker contract as an operator in the VaultFactory contract
       * @returns Transaction calldata, destination address and transaction value
       */
      approveVaultFactoryTx: () => buildApproveVaultFactoryTx({ chainId: this.config.chainId }),

      /**
       * Build a transaction to update the MultiInvoker operator
       * @param operator - The operator address
       * @param enabled - Set the address as enabled or disabled
       * @returns Transaction calldata, destination address and transaction value
       */
      approveMultiInvokerOperatorTx: (args: OmitBound<Parameters<typeof buildUpdateMultiInvokerOperatorTx>[0]>) =>
        buildUpdateMultiInvokerOperatorTx({ chainId: this.config.chainId, ...args }),

      /**
       * Build a transaction to unwrap DSU into USDC
       * @param amount - The amount to unwrap in 18 decimal precision
       * @returns Transaction calldata, destination address and transaction value
       */
      unwrapDSU: ({ amount }: { amount: bigint }) => buildUnwrapDSUTx({ chainId: this.config.chainId, amount }),

      /**
       * Build a transaction to update the access for a batch of signers and operators in the MarketFactory contract.
       * @param signers - The signers to update access for.
       * @param operators - The operators to update access for.
       * @returns Transaction calldata, destination address and transaction value
       */
      accessUpdateBatch: (args: OmitBound<Parameters<typeof buildAccessUpdateBatchTx>[0]>) =>
        buildAccessUpdateBatchTx({ chainId: this.config.chainId, ...args }),
    }
  }

  /**
   * Operator module write methods
   * @throws Error if wallet client is not provided
   */
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
       * approves DSU for the EmptysetReserve contract
       * @param suggestedAmount - The amount to approve
       * @returns Transaction hash
       */
      approveDSU: async ({ suggestedAmount }: { suggestedAmount?: bigint } = {}) => {
        const tx = await this.build.approveDSU({ suggestedAmount })
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },

      /**
       * approves the MultiInvoker contract as an operator in the MarketFactory contract
       * @returns Transaction hash
       */
      approveMarketFactory: async () => {
        const tx = await this.build.approveMarketFactoryTx()
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
      /**
       * approves the MultiInvoker contract as an operator in the VaultFactory contract
       * @returns Transaction hash
       */
      approveVaultFactory: async () => {
        const tx = await this.build.approveVaultFactoryTx()
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },

      /**
       * updates the MultiInvoker operator
       * @param operator - The operator address
       * @param enabled - Set the address as enabled or disabled
       * @returns Transaction hash
       */
      approveMultiInvokerOperator: async (...args: Parameters<typeof this.build.approveMultiInvokerOperatorTx>) => {
        const tx = await this.build.approveMultiInvokerOperatorTx(...args)
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },

      /**
       * Build a transaction to unwrap DSU into USDC
       * @param amount - The amount to unwrap in 18 decimal precision
       * @returns Transaction calldata, destination address and transaction value
       */
      unwrapDSU: async (...args: Parameters<typeof this.build.unwrapDSU>) => {
        const tx = await this.build.unwrapDSU(...args)
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },

      /**
       * Build a transaction to update the access for a batch of signers and operators in the MarketFactory contract.
       * @param signers - The signers to update access for.
       * @param operators - The operators to update access for.
       * @returns Transaction calldata, destination address and transaction value
       */
      accessUpdateBatch: async (...args: Parameters<typeof this.build.accessUpdateBatch>) => {
        const tx = await this.build.accessUpdateBatch(...args)
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
    }
  }
}
