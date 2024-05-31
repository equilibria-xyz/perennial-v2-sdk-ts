import { EvmPriceServiceConnection } from '@perennial/pyth-evm-js'
import { Address, PublicClient, encodeFunctionData, zeroAddress } from 'viem'

import { fetchVaultCommitments } from '.'
import { getMultiInvokerContract } from '..'
import { MaxUint256, SupportedChainId, chainVaultsWithAddress } from '../../constants'
import { MultiInvokerAction } from '../../types/perennial'
import { Big6Math, sum } from '../../utils'
import { buildUpdateVault } from '../../utils/multiinvoker'
import { MarketOracles, fetchMarketOracles } from '../markets/chain'
import { VaultSnapshot, VaultSnapshots, fetchVaultSnapshots } from './chain'

type BaseVaultUpdateTxArgs = {
  chainId: SupportedChainId
  publicClient: PublicClient
  pythClient: EvmPriceServiceConnection
  vaultAddress: Address
  address?: Address
  marketOracles?: MarketOracles
  vaultSnapshots?: VaultSnapshots
}

export type BuildDepositTxArgs = BaseVaultUpdateTxArgs & { amount: bigint }
export function buildDepositTx(args: BuildDepositTxArgs) {
  const updateAction = buildUpdateVault({
    vault: args.vaultAddress,
    deposit: args.amount,
    wrap: true,
  })

  return buildPerformVaultUpdateTx({
    ...args,
    baseAction: updateAction,
  })
}

export type BuildRedeemSharesTxArgs = BaseVaultUpdateTxArgs & { amount: bigint; assets?: boolean; max?: boolean }
export async function buildRedeemSharesTx(args: BuildRedeemSharesTxArgs) {
  const vaultType = chainVaultsWithAddress(args.chainId).find(({ vaultAddress: v }) => v === args.vaultAddress)
  if (!vaultType) throw new Error('Invalid Vault')

  const assets = args.assets ?? true
  const max = args.max ?? false

  let vaultAmount = max ? MaxUint256 : args.amount
  const vaultSnapshots =
    args.vaultSnapshots ??
    (await fetchVaultSnapshots({
      ...args,
      address: zeroAddress,
    }))

  const vaultSnapshot = vaultSnapshots?.vault[vaultType.vault]
  if (assets && !max && vaultSnapshot) {
    vaultAmount = convertAssetsToShares({ vaultSnapshot, assets: args.amount })
  }
  const updateAction = buildUpdateVault({
    vault: args.vaultAddress,
    redeem: vaultAmount,
    wrap: true,
  })

  return buildPerformVaultUpdateTx({
    ...args,
    baseAction: updateAction,
    vaultSnapshots,
  })
}

export type BuildClaimTxArgs = BaseVaultUpdateTxArgs
export function buildClaimTx(args: BuildClaimTxArgs) {
  const updateAction = buildUpdateVault({
    vault: args.vaultAddress,
    claim: MaxUint256,
    wrap: true,
  })

  return buildPerformVaultUpdateTx({
    ...args,
    baseAction: updateAction,
  })
}

const buildPerformVaultUpdateTx = async ({
  chainId,
  publicClient,
  pythClient,
  baseAction,
  vaultAddress,
  marketOracles,
  vaultSnapshots,
  address,
}: BaseVaultUpdateTxArgs & { baseAction: MultiInvokerAction }) => {
  const vaultType = chainVaultsWithAddress(chainId).find(({ vaultAddress: v }) => v === vaultAddress)
  if (!vaultType) throw new Error('Invalid Vault')

  const multiInvoker = getMultiInvokerContract(chainId, publicClient)
  if (!marketOracles) {
    marketOracles = await fetchMarketOracles(chainId, publicClient)
  }
  if (!vaultSnapshots) {
    vaultSnapshots = await fetchVaultSnapshots({
      chainId,
      address: zeroAddress,
      publicClient,
      marketOracles,
      pythClient,
    })
  }
  if (!vaultSnapshots) throw new Error('Unable to fetch Vault Snapshots')

  const vaultMarketSnapshot = vaultSnapshots.vault[vaultType.vault]?.pre.marketSnapshots
  if (!vaultMarketSnapshot) throw new Error('Unable to fetch Vault Market Snapshots')

  const commitments = await fetchVaultCommitments({
    chainId,
    pythClient,
    marketOracles,
    publicClient,
    preMarketSnapshots: vaultMarketSnapshot,
  })
  const actions = commitments.length ? [...commitments.map((c) => c.commitAction), baseAction] : [baseAction]

  const data = encodeFunctionData({
    abi: multiInvoker.abi,
    functionName: 'invoke',
    args: address ? [address, actions] : [actions],
  })

  return {
    to: multiInvoker.address,
    value: sum(commitments.map((c) => c.value)),
    data,
  }
}

const convertAssetsToShares = ({ vaultSnapshot, assets }: { vaultSnapshot: VaultSnapshot; assets: bigint }) => {
  const totalAssets = Big6Math.max(vaultSnapshot.totalAssets, 0n)
  const totalShares = vaultSnapshot.totalShares
  if (totalShares === 0n) return assets
  return Big6Math.div(Big6Math.mul(assets, totalShares), totalAssets)
}
