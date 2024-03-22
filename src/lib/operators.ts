import { Address, PublicClient, WalletClient, encodeFunctionData } from 'viem'

import {
  Big6Math,
  ERC20Abi,
  MarketFactoryAbi,
  MarketFactoryAddresses,
  MaxUint256,
  MultiInvokerV2Addresses,
  SupportedChainId,
  USDCAddresses,
  VaultFactoryAbi,
  VaultFactoryAddresses,
  chainIdToChainMap,
  getUSDCContract,
  getVaultFactoryContract,
} from '..'
import { getMarketFactoryContract } from '..'

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
    args: [MultiInvokerV2Addresses[chainId], Big6Math.abs(suggestedAmount)],
  })

  return {
    data,
    to: USDCAddresses[chainId],
    value: 0n,
  }
}

export async function buildApproveMarketFactoryTx({ chainId }: { chainId: SupportedChainId }) {
  const data = encodeFunctionData({
    abi: MarketFactoryAbi,
    functionName: 'updateOperator',
    args: [MultiInvokerV2Addresses[chainId], true],
  })

  return {
    to: MarketFactoryAddresses[chainId],
    value: 0n,
    data,
  }
}

export async function buildApproveVaultFactoryTx({ chainId }: { chainId: SupportedChainId }) {
  const data = encodeFunctionData({
    abi: VaultFactoryAbi,
    functionName: 'updateOperator',
    args: [MultiInvokerV2Addresses[chainId], true],
  })

  return {
    to: VaultFactoryAddresses[chainId],
    value: 0n,
    data,
  }
}

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
  const allowance = await contract.read.allowance([address, MultiInvokerV2Addresses[chainId]])
  return allowance
}

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
    MultiInvokerV2Addresses[chainId],
  ])
  return isMarketFactoryApproved
}

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
    MultiInvokerV2Addresses[chainId],
  ])
  return isVaultFactoryApproved
}

export class OperatorModule {
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
      usdcAllowance: ({ address }: { address: Address }) =>
        getUSDCAllowance({ chainId: this.config.chainId, address, publicClient: this.config.publicClient }),
      marketFactoryApproval: ({ address }: { address: Address }) =>
        checkMarketFactoryApproval({ chainId: this.config.chainId, address, publicClient: this.config.publicClient }),
      vaultFactoryApproval: ({ address }: { address: Address }) =>
        checkVaultFactoryApproval({ chainId: this.config.chainId, address, publicClient: this.config.publicClient }),
    }
  }

  get build() {
    return {
      approveUSDC: ({ suggestedAmount }: { suggestedAmount?: bigint }) =>
        buildApproveUSDCTx({ chainId: this.config.chainId, suggestedAmount }),
      approveMarketFactoryTx: () => buildApproveMarketFactoryTx({ chainId: this.config.chainId }),
      approveVaultFactoryTx: () => buildApproveVaultFactoryTx({ chainId: this.config.chainId }),
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
      approveUSDC: async ({ suggestedAmount }: { suggestedAmount?: bigint }) => {
        const tx = await this.build.approveUSDC({ suggestedAmount })
        const hash = await this.config.walletClient?.sendTransaction({ ...tx, ...txOpts })
        return hash
      },

      approveMarketFactory: async () => {
        const tx = this.build.approveMarketFactoryTx()
        const hash = await this.config.walletClient?.sendTransaction({ ...tx, ...txOpts })
        return hash
      },

      approveVaultFactory: async () => {
        const tx = this.build.approveVaultFactoryTx()
        const hash = await this.config.walletClient?.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
    }
  }
}
