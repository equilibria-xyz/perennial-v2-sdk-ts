import { EvmPriceServiceConnection } from '@perennial/pyth-evm-js'
import { Address, PublicClient, encodeFunctionData, zeroAddress } from 'viem'

import { MaxUint256, SupportedChainId, chainVaultsWithAddress } from '../../constants'
import { MultiInvoker2Action } from '../../types/perennial'
import { Big6Math, notEmpty, sum } from '../../utils'
import { buildCommitPrice, buildUpdateVault } from '../../utils/multiinvokerV2'
import { buildCommitmentsForOracles } from '../../utils/pythUtils'
import { MarketOracles, fetchMarketOracles } from '../markets/chain'
import { VaultSnapshot2, VaultSnapshots, fetchVaultSnapshots } from './chain'
import { getMultiInvokerV2Contract } from '..'

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
}: BaseVaultUpdateTxArgs & { baseAction: MultiInvoker2Action }) => {
  const vaultType = chainVaultsWithAddress(chainId).find(({ vaultAddress: v }) => v === vaultAddress)
  if (!vaultType) throw new Error('Invalid Vault')

  const multiInvoker = getMultiInvokerV2Contract(chainId, publicClient)
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

  const commitments = await commitmentsForVaultAction({
    chainId,
    pyth: pythClient,
    marketOracles,
    publicClient,
    preMarketSnapshots: vaultMarketSnapshot,
  })
  const actions = commitments.length ? [...commitments.map((c) => c.commitAction), baseAction] : [baseAction]

  const data = encodeFunctionData({
    abi: multiInvoker.abi,
    functionName: 'invoke',
    args: [actions],
  })

  return {
    to: multiInvoker.address,
    value: sum(commitments.map((c) => c.value)),
    data,
  }
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
