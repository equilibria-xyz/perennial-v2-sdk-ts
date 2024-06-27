import { HermesClient } from '@pythnetwork/hermes-client'
import { Address, Hex, PublicClient } from 'viem'

import { BackupPythClient, SupportedChainId } from '../constants/network'
import { unique } from './arrayUtils'
import { Big6Math } from './big6Utils'

const DefaultPythOptions = { encoding: 'hex', parsed: true } as const

export const getRecentVaa = async ({
  pyth,
  feeds,
  useBackupOnError = true,
  backupPythClient = BackupPythClient,
}: {
  pyth: HermesClient
  feeds: { underlyingId: string; minValidTime: bigint }[]
  useBackupOnError?: boolean
  backupPythClient?: HermesClient | null
}): Promise<
  {
    feedId: string
    vaa: string
    publishTime: number
    version: bigint
  }[]
> => {
  try {
    const uniqueFeeds = unique(feeds.map((f) => f.underlyingId))
    const priceFeeds = await pyth.getLatestPriceUpdates(uniqueFeeds, DefaultPythOptions)
    if (!priceFeeds || !priceFeeds.parsed) throw new Error('No price feeds found')

    return priceFeeds.parsed.map((priceFeed) => {
      const publishTime = priceFeed.price.publish_time
      const minValidTime = feeds.find(({ underlyingId }) => `0x${underlyingId}` === priceFeed.id)?.minValidTime
      return {
        feedId: priceFeed.id,
        vaa: `0x${priceFeeds.binary.data}`,
        publishTime,
        version: BigInt(publishTime) - (minValidTime ?? 4n),
      }
    })
  } catch (err: any) {
    console.error('Pyth Recent VAA Error', `Use backup: ${useBackupOnError}`, err)
    // Only use backup if we are on mainnet
    if (useBackupOnError && backupPythClient) {
      return getRecentVaa({ pyth: backupPythClient, feeds, useBackupOnError: false, backupPythClient: null })
    }

    throw err
  }
}

export const buildCommitmentsForOracles = async ({
  chainId,
  pyth,
  publicClient,
  useBackupOnError = true,
  backupPythClient = BackupPythClient,
  marketOracles: _marketOracles,
  onError,
  onSuccess,
}: {
  chainId: SupportedChainId
  pyth: HermesClient
  publicClient: PublicClient
  useBackupOnError?: boolean
  backupPythClient?: HermesClient | null
  marketOracles: {
    providerAddress: Address
    providerFactoryAddress: Address
    underlyingId: Hex
    providerId: Hex
    minValidTime: bigint
  }[]
  onError?: () => void
  onSuccess?: () => void
}): Promise<
  {
    keeperFactory: Address
    version: bigint
    value: bigint
    ids: Hex[]
    updateData: Address
  }[]
> => {
  try {
    // Filter market oracles which have the same providerFactory and providerID
    const marketOracles = _marketOracles.filter(
      (oracle, i, self) =>
        self.findIndex(
          (t) => t.providerFactoryAddress === oracle.providerFactoryAddress && t.underlyingId === oracle.underlyingId,
        ) === i,
    )

    const feedIds = marketOracles.map(({ underlyingId, minValidTime }) => ({
      underlyingId,
      minValidTime,
    }))
    // Get current VAAs for each price feed
    const uniqueFeeds = unique(feedIds.map((f) => f.underlyingId))
    const priceFeedUpdateData = await pyth.getLatestPriceUpdates(uniqueFeeds)
    if (!priceFeedUpdateData || !priceFeedUpdateData.parsed) throw new Error('No price feed update data found')

    const publishTimeMap = priceFeedUpdateData.parsed.reduce(
      (acc, p) => {
        if (!acc[p.price.publish_time]) acc[p.price.publish_time] = []
        const oracle = marketOracles.find((o) => o.underlyingId.toLowerCase() === `0x${p.id}`.toLowerCase())
        if (!oracle) return acc

        acc[p.price.publish_time].push(oracle)
        return acc
      },
      {} as Record<number, { providerId: Hex; minValidTime: bigint }[]>,
    )

    onSuccess?.()
    return Object.entries(publishTimeMap).map(([publishTime, oracles]) => ({
      keeperFactory: marketOracles[0].providerFactoryAddress,
      version: BigInt(publishTime) - Big6Math.max(...oracles.map((o) => o.minValidTime)),
      value: BigInt(uniqueFeeds.length),
      ids: oracles.map((o) => o.providerId),
      updateData: `0x${priceFeedUpdateData.binary.data[0]}` as Hex,
    }))
  } catch (err: any) {
    console.error('Pyth Recent VAA Error', `Use backup: ${useBackupOnError}`, err)
    if (useBackupOnError && backupPythClient) {
      return buildCommitmentsForOracles({
        chainId,
        pyth: backupPythClient,
        marketOracles: _marketOracles,
        publicClient,
        backupPythClient: null,
        useBackupOnError: false,
      })
    }
    if (onError) {
      onError()
    }
    throw err
  }
}

export function pythPriceToBig6(price: bigint, expo: number) {
  const normalizedExpo = price ? 6 + expo : 0
  const normalizedPrice =
    normalizedExpo >= 0 ? price * 10n ** BigInt(normalizedExpo) : price / 10n ** BigInt(Math.abs(normalizedExpo))
  return normalizedPrice
}
