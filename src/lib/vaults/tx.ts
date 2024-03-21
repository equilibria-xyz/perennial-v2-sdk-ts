import { EvmPriceServiceConnection } from '@perennial/pyth-evm-js'
import { Address, PublicClient, WalletClient, zeroAddress } from 'viem'

import {
  MaxUint256,
  MultiInvokerV2Addresses,
  SupportedChainId,
  chainIdToChainMap,
  chainVaultsWithAddress,
} from '../../constants'
import { MultiInvoker2Action } from '../../types/perennial'
import { Big6Math, bufferGasLimit, notEmpty, parseViemContractCustomError, sum } from '../../utils'
import { buildCommitPrice, buildUpdateVault } from '../../utils/multiinvokerV2'
import { buildCommitmentsForOracles } from '../../utils/pythUtils'
import { getMultiInvokerV2ContractWrite, getUSDCContractWrite, getVaultFactoryContractWrite } from '../contracts'
import { MarketOracles, fetchMarketOraclesV2 } from '../markets/chain'
import { VaultSnapshot2, VaultSnapshots, fetchVaultSnapshotsV2 } from './chain'

export function getVaultTransactions({
  chainId,
  publicClient,
  address,
  vaultAddress,
  walletClient,
  marketOracles,
  vaultSnapshots,
  pythClient,
}: {
  chainId: SupportedChainId
  publicClient: PublicClient
  address?: Address
  walletClient?: WalletClient
  marketOracles?: MarketOracles
  vaultSnapshots?: VaultSnapshots
  vaultAddress: Address
  pythClient: EvmPriceServiceConnection
}) {
  const vaultType = chainVaultsWithAddress(chainId).find(({ vaultAddress: v }) => v === vaultAddress)

  const txOpts = { account: address || zeroAddress, chainId, chain: chainIdToChainMap[chainId] }
  const updateTxOpts = { ...txOpts, value: 0n }

  const approveUSDC = async () => {
    if (!walletClient) throw new Error('No wallet client provided')
    const usdcContract = getUSDCContractWrite(chainId, publicClient, walletClient)
    const hash = await usdcContract.write.approve([MultiInvokerV2Addresses[chainId], MaxUint256], txOpts)
    return hash
  }

  const approveOperator = async () => {
    if (!walletClient) throw new Error('No wallet client provided')
    const vaultFactory = getVaultFactoryContractWrite(chainId, publicClient, walletClient)
    const hash = await vaultFactory.write.updateOperator([MultiInvokerV2Addresses[chainId], true], txOpts)
    return hash
  }

  const performVaultUpdate = async (baseAction: MultiInvoker2Action) => {
    if (!walletClient) throw new Error('No wallet client provided')
    const multiInvoker = getMultiInvokerV2ContractWrite(chainId, publicClient, walletClient)
    if (!marketOracles) {
      marketOracles = await fetchMarketOraclesV2(chainId, publicClient)
    }
    if (!vaultSnapshots) {
      vaultSnapshots = await fetchVaultSnapshotsV2({
        chainId,
        address: address || zeroAddress,
        publicClient,
        marketOracles,
        pythClient,
      })
    }
    if (!vaultType || !address || !chainId || !walletClient || !vaultSnapshots) return
    const vaultMarketSnapshot = vaultSnapshots.vault[vaultType.vault]?.pre.marketSnapshots
    if (!vaultMarketSnapshot) return
    const commitments = await commitmentsForVaultAction({
      chainId,
      pyth: pythClient,
      marketOracles,
      publicClient,
      preMarketSnapshots: vaultMarketSnapshot,
    })
    const actions = commitments.length ? [...commitments.map((c) => c.commitAction), baseAction] : [baseAction]

    try {
      // Extra buffer to account to changes to underlying state
      const gasLimit = await multiInvoker.estimateGas.invoke([actions], {
        ...updateTxOpts,
        value: sum(commitments.map((c) => c.value)),
      })
      const hash = await multiInvoker.write.invoke([actions], {
        ...updateTxOpts,
        gas: bufferGasLimit(gasLimit),
        value: sum(commitments.map((c) => c.value)),
      })

      // Wait for transaction to avoid race conditions in settlement
      await publicClient.waitForTransactionReceipt({ hash })
      return hash
    } catch (err) {
      console.error(err)
      const customError = parseViemContractCustomError(err)
      if (customError) throw customError
      throw err
    }
  }

  const depositToVault = async (amount: bigint) => {
    const updateAction = buildUpdateVault({
      vault: vaultAddress,
      deposit: amount,
      wrap: true,
    })

    return performVaultUpdate(updateAction)
  }

  const redeemShares = async (amount: bigint, { assets = true, max = false }) => {
    if (!vaultType || !vaultSnapshots) return

    let vaultAmount = max ? MaxUint256 : amount
    const vaultSnapshot = vaultSnapshots.vault[vaultType.vault]
    if (assets && !max && vaultSnapshot) {
      vaultAmount = convertAssetsToShares({ vaultSnapshot, assets: amount })
    }
    const updateAction = buildUpdateVault({
      vault: vaultAddress,
      redeem: vaultAmount,
      wrap: true,
    })

    return performVaultUpdate(updateAction)
  }

  const claim = async () => {
    const updateAction = buildUpdateVault({
      vault: vaultAddress,
      claim: MaxUint256,
      wrap: true,
    })

    return performVaultUpdate(updateAction)
  }

  return { approveUSDC, approveOperator, depositToVault, redeemShares, claim }
}

const commitmentsForVaultAction = async ({
  chainId,
  pyth,
  preMarketSnapshots,
  marketOracles,
  publicClient,
}: {
  chainId: SupportedChainId
  pyth: EvmPriceServiceConnection
  preMarketSnapshots: VaultSnapshot2['pre']['marketSnapshots']
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
  const commitments = await buildCommitmentsForOracles({ chainId, pyth, publicClient, marketOracles: oracles })
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

const convertAssetsToShares = ({ vaultSnapshot, assets }: { vaultSnapshot: VaultSnapshot2; assets: bigint }) => {
  const totalAssets = Big6Math.max(vaultSnapshot.totalAssets, 0n)
  const totalShares = vaultSnapshot.totalShares
  if (totalShares === 0n) return assets
  return Big6Math.div(Big6Math.mul(assets, totalShares), totalAssets)
}
