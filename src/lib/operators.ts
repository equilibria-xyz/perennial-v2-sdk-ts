import { Address, PublicClient, WalletClient, encodeFunctionData, getContract, zeroAddress } from 'viem'

import { MultiInvokerV2Addresses, SupportedChainId, chainIdToChainMap } from '..'
import { getMarketFactoryContract } from '..'

export const getOperatorTransactions = ({
  chainId,
  publicClient,
  walletClient,
}: {
  chainId: SupportedChainId
  publicClient: PublicClient
  walletClient?: WalletClient
}) => {
  const multiInvokerAddress = MultiInvokerV2Addresses[chainId]
  const marketFactoryContract = getMarketFactoryContract(chainId, publicClient)
  const address = walletClient?.account?.address

  const getApproveMarketFactoryTxData = async () => {
    const callData = encodeFunctionData({
      abi: marketFactoryContract.abi,
      functionName: 'updateOperator',
      args: [multiInvokerAddress, true],
    })

    return {
      to: marketFactoryContract.address,
      value: 0n,
      callData,
    }
  }

  const approveMarketFactory = async () => {
    if (!walletClient || !walletClient.account?.address) throw new Error('No wallet client provided')
    const factoryContractWritable = getContract({
      address: marketFactoryContract.address,
      abi: marketFactoryContract.abi,
      client: walletClient,
    })
    const hash = await factoryContractWritable.write.updateOperator([multiInvokerAddress, true], {
      account: address ?? zeroAddress,
      chainId,
      chain: chainIdToChainMap[chainId],
    })
    return hash
  }

  const checkMarketFactoryApproval = async (address?: Address) => {
    if (!address && !walletClient?.account?.address) {
      throw new Error('No address provided')
    }
    const isMarketFactoryApproved = await marketFactoryContract.read.operators([
      address ?? walletClient?.account?.address ?? zeroAddress,
      MultiInvokerV2Addresses[chainId],
    ])
    return isMarketFactoryApproved
  }

  return { approveMarketFactory, checkMarketFactoryApproval, getApproveMarketFactoryTxData }
}
