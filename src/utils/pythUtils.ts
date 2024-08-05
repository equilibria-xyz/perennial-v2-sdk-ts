import { HermesClient } from '@pythnetwork/hermes-client'
import { Address, Hex, PublicClient } from 'viem'

import { BackupPythClient, SupportedChainId } from '../constants/network'
import { notEmpty, unique } from './arrayUtils'
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
    const parsedData = priceFeeds.parsed

    return feeds
      .map((priceFeed) => {
        const priceFeedUpdate = parsedData.find((p) => priceFeed.underlyingId === `0x${p.id}`.toLowerCase())
        if (!priceFeedUpdate) return null
        const publishTime = priceFeedUpdate?.price.publish_time
        return {
          feedId: priceFeed.underlyingId,
          vaa: `0x${priceFeeds.binary.data}`,
          publishTime,
          version: BigInt(publishTime) - priceFeed.minValidTime,
        }
      })
      .filter(notEmpty)
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
  marketOracles,
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
        const oracles = marketOracles.filter((o) => o.underlyingId.toLowerCase() === `0x${p.id}`.toLowerCase())
        if (!oracles) return acc

        // We can't commit two oracles with the same underlying ID at once
        // So if there is multiple oracles with the same underlying ID, split them into separate commitments
        oracles.forEach((o, i) => {
          if (!acc[p.price.publish_time][i]) acc[p.price.publish_time][i] = []
          acc[p.price.publish_time][i].push(o)
        })
        return acc
      },
      {} as Record<number, { providerId: Hex; minValidTime: bigint }[][]>,
    )

    onSuccess?.()
    return Object.entries(publishTimeMap)
      .map(([publishTime, allOracles]) => {
        return allOracles.map((oracles) => ({
          keeperFactory: marketOracles[0].providerFactoryAddress,
          version: BigInt(publishTime) - Big6Math.max(...oracles.map((o) => o.minValidTime)),
          value: BigInt(uniqueFeeds.length),
          ids: oracles.map((o) => o.providerId),
          updateData: `0x${priceFeedUpdateData.binary.data[0]}` as Hex,
        }))
      })
      .flat()
  } catch (err: any) {
    console.error('Pyth Recent VAA Error', `Use backup: ${useBackupOnError}`, err)
    if (useBackupOnError && backupPythClient) {
      return buildCommitmentsForOracles({
        chainId,
        pyth: backupPythClient,
        marketOracles,
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

export function pythPriceToBig18(price: bigint, expo: number) {
  const normalizedExpo = price ? 18 + expo : 0
  const normalizedPrice =
    normalizedExpo >= 0 ? price * 10n ** BigInt(normalizedExpo) : price / 10n ** BigInt(Math.abs(normalizedExpo))
  return normalizedPrice
}
