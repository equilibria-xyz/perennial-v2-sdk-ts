import { EvmPriceServiceConnection } from '@perennial/pyth-evm-js'
import {
  Address,
  PublicClient,
  encodePacked,
  getAbiItem,
  getAddress,
  getContractAddress,
  keccak256,
  maxUint256,
  pad,
  toHex,
  zeroAddress,
} from 'viem'

import { getVaultContract } from '..'
import { LensDeployedBytecode } from '../../abi/Lens.abi'
import { VaultAbi } from '../../abi/Vault.abi'
import { VaultLensAbi, VaultLensDeployedBytecode } from '../../abi/VaultLens.abi'
import { DSUAddresses, MultiInvokerAddresses } from '../../constants/contracts'
import { SupportedAsset, addressToAsset } from '../../constants/markets'
import { SupportedChainId } from '../../constants/network'
import { MaxUint256 } from '../../constants/units'
import { PerennialVaultType, chainVaultsWithAddress } from '../../constants/vaults'
import { notEmpty, sum } from '../../utils/arrayUtils'
import { Big6Math } from '../../utils/big6Utils'
import { Big18Math } from '../../utils/big18Utils'
import { buildCommitmentsForOracles } from '../../utils/pythUtils'
import { MarketOracles, fetchMarketOracles } from '../markets/chain'

export type VaultSnapshots = NonNullable<Awaited<ReturnType<typeof fetchVaultSnapshots>>>
export type VaultSnapshot = ChainVaultSnapshot & {
  pre: ChainVaultSnapshot
  assets: { asset: SupportedAsset; weight: bigint }[]
}
export type VaultAccountSnapshot = ChainVaultAccountSnapshot & {
  pre: ChainVaultAccountSnapshot
}

export async function fetchVaultSnapshots({
  chainId,
  publicClient,
  address = zeroAddress,
  marketOracles,
  pythClient,
  onError,
  onSuccess,
}: {
  chainId: SupportedChainId
  address: Address
  marketOracles?: MarketOracles
  publicClient: PublicClient
  pythClient: EvmPriceServiceConnection
  onError?: () => void
  onSuccess?: () => void
}) {
  const vaults = chainVaultsWithAddress(chainId)
  if (!vaults) {
    return
  }

  if (!marketOracles) {
    marketOracles = await fetchMarketOracles(chainId, publicClient)
  }

  const snapshotData = await fetchVaultSnapshotsAfterSettle({
    chainId,
    address,
    marketOracles,
    publicClient,
    pyth: pythClient,
    onPythError: onError,
    resetPythError: onSuccess,
  })

  const vaultSnapshots = snapshotData.vault.reduce(
    (acc, vaultData) => {
      acc[vaultData.vaultType] = {
        ...vaultData,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        pre: snapshotData.vaultPre.find((pre) => pre.vaultType === vaultData.vaultType)!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        assets: vaultData.registrations.map((r) => ({ weight: r.weight, asset: addressToAsset(r.market)! })),
      }
      return acc
    },
    {} as { [key in PerennialVaultType]?: VaultSnapshot },
  )

  const userSnapshots = snapshotData.user.reduce(
    (acc, vaultData) => {
      acc[vaultData.vaultType] = {
        ...vaultData,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        pre: snapshotData.userPre.find((pre) => pre.vaultType === vaultData.vaultType)!,
      }
      return acc
    },
    {} as { [key in PerennialVaultType]?: VaultAccountSnapshot },
  )

  return {
    user: address === zeroAddress ? undefined : userSnapshots,
    vault: vaultSnapshots,
    commitments: snapshotData.commitments,
    settles: snapshotData.settles,
    updates: snapshotData.updates,
  }
}

export type ChainVaultSnapshot = Awaited<ReturnType<typeof fetchVaultSnapshotsAfterSettle>>['vault'][number]
export type ChainVaultAccountSnapshot = Awaited<ReturnType<typeof fetchVaultSnapshotsAfterSettle>>['user'][number]
const fetchVaultSnapshotsAfterSettle = async ({
  chainId,
  address,
  marketOracles,
  publicClient,
  pyth,
  onPythError,
  resetPythError,
}: {
  chainId: SupportedChainId
  address: Address
  marketOracles: MarketOracles
  publicClient: PublicClient
  pyth: EvmPriceServiceConnection
  onPythError?: () => void
  resetPythError?: () => void
}) => {
  const vaults = chainVaultsWithAddress(chainId)
  const vaultLensAddress = getContractAddress({ from: address, nonce: MaxUint256 - 1n })
  const lensAddress = getContractAddress({ from: address, nonce: MaxUint256 })

  const priceCommitments = await buildCommitmentsForOracles({
    chainId,
    marketOracles: Object.values(marketOracles),
    pyth,
    publicClient,
    onError: onPythError,
    onSuccess: resetPythError,
  })

  const vaultAddresses = vaults.map(({ vaultAddress }) => vaultAddress)

  const { result: lensRes } = await publicClient.simulateContract({
    address: vaultLensAddress,
    abi: VaultLensAbi,
    functionName: 'snapshot',
    args: [priceCommitments, lensAddress, vaultAddresses, address, MultiInvokerAddresses[chainId]],
    account: address,
    stateOverride: [
      {
        address: lensAddress,
        code: LensDeployedBytecode,
        balance: maxUint256,
      },
      {
        address: vaultLensAddress,
        code: VaultLensDeployedBytecode,
        balance: maxUint256,
      },
      {
        // Give the vaultLensAddress some DSU to pay for settlement
        address: DSUAddresses[chainId],
        stateDiff: [
          {
            slot: keccak256(encodePacked(['bytes32', 'bytes32'], [pad(vaultLensAddress), pad(toHex(1n))])),
            value: pad(toHex(Big18Math.fromFloatString('100000'))),
          },
        ],
      },
    ],
  })

  return {
    commitments: lensRes.commitmentStatus,
    updates: lensRes.updateStatus,
    settles: lensRes.settleStatus,
    vault: lensRes.postUpdate.vaultSnapshots
      .map((s) => {
        const vaultType = vaults.find(({ vaultAddress }) => vaultAddress === getAddress(s.vault))
        if (!vaultType) return
        return {
          ...s,
          vaultType: vaultType.vault,
        }
      })
      .filter(notEmpty),
    vaultPre: lensRes.preUpdate.vaultSnapshots
      .map((s) => {
        const vaultType = vaults.find(({ vaultAddress }) => vaultAddress === getAddress(s.vault))
        if (!vaultType) return
        return {
          ...s,
          vaultType: vaultType.vault,
        }
      })
      .filter(notEmpty),
    user: lensRes.postUpdate.vaultAccountSnapshots
      .map((s) => {
        const vaultType = vaults.find(({ vaultAddress }) => vaultAddress === getAddress(s.vault))
        if (!vaultType) return
        return {
          ...s,
          vaultType: vaultType.vault,
        }
      })
      .filter(notEmpty),
    userPre: lensRes.preUpdate.vaultAccountSnapshots
      .map((s) => {
        const vaultType = vaults.find(({ vaultAddress }) => vaultAddress === getAddress(s.vault))
        if (!vaultType) return
        return {
          ...s,
          vaultType: vaultType.vault,
        }
      })
      .filter(notEmpty),
  }
}

export type VaultPositionHistory = NonNullable<
  Awaited<ReturnType<typeof fetchVaultPositionHistory>>
>[PerennialVaultType]

export async function fetchVaultPositionHistory({
  chainId,
  address,
  publicClient,
}: {
  chainId: SupportedChainId
  address: Address
  publicClient: PublicClient
}) {
  const vaults = chainVaultsWithAddress(chainId)
  const getLogsArgs = { account: address }

  // TODO: migrate this to the graph when available
  const vaultPositionHistory = await Promise.all(
    vaults.map(async ({ vaultAddress, vault }) => {
      const vaultContract = getVaultContract(vaultAddress, publicClient)
      const logs_ = await publicClient.getLogs({
        address: vaultAddress,
        args: getLogsArgs,
        fromBlock: 0n,
        toBlock: 'latest',
        strict: true,
        event: getAbiItem({ abi: VaultAbi, name: 'Updated' }),
      })
      const logs = logs_.sort((a, b) => Big6Math.cmp(b.args.version, a.args.version))

      const deposits = logs.filter((l) => l.args.depositAssets > 0n)
      const redeems = logs.filter((l) => l.args.redeemShares > 0n)
      const claims = logs.filter((l) => l.args.claimAssets > 0n)

      let currentPositionStartBlock = (logs.at(-1)?.blockNumber || 0n) - 1n
      for (const claim of claims) {
        if (claim.blockNumber === null) continue
        const accountData = await vaultContract.read.accounts([address], { blockNumber: claim.blockNumber })
        if (accountData.shares === 0n) {
          // If less than 100 wei, consider it a new starting block
          currentPositionStartBlock = claim.blockNumber
          break
        }
      }

      const currentPositionDeposits = sum(
        deposits.filter((l) => (l.blockNumber ?? 0n) > currentPositionStartBlock).map((l) => l.args.depositAssets),
      )
      const currentPositionClaims = sum(
        claims.filter((l) => (l.blockNumber ?? 0n) > currentPositionStartBlock).map((l) => l.args.claimAssets),
      )

      return {
        vault,
        vaultAddress,
        logs,
        deposits,
        redeems,
        claims,
        currentPositionDeposits,
        currentPositionClaims,
      }
    }),
  )

  return vaultPositionHistory.reduce(
    (acc, vaultData) => {
      acc[vaultData.vault] = vaultData
      return acc
    },
    {} as Record<PerennialVaultType, (typeof vaultPositionHistory)[number]>,
  )
}
