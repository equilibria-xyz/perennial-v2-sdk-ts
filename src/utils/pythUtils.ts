import { HermesClient } from '@pythnetwork/hermes-client'
import { Address, Hex, PublicClient } from 'viem'

import { getKeeperOracleContract } from '..'
import { BackupPythClient, SupportedChainId, mainnetChains } from '../constants/network'
import { unique } from './arrayUtils'
import { Big6Math } from './big6Utils'
import { nowSeconds } from './timeUtils'

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
  backupPythClient?: HermesClient
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
    if (backupPythClient) {
      return getRecentVaa({ pyth: backupPythClient, feeds, useBackupOnError: false })
    }

    throw err
  }
}

const getVaaForPublishTime = async ({
  pyth,
  feed,
  requestedPublishTime,
}: {
  pyth: HermesClient
  requestedPublishTime: bigint
  feed: { underlyingId: string; minValidTime: bigint }
}) => {
  const priceUpdate = await pyth.getPriceUpdatesAtTimestamp(
    Number(requestedPublishTime),
    [feed.underlyingId],
    DefaultPythOptions,
  )
  if (!priceUpdate || !priceUpdate.parsed?.at(0)) throw new Error('No VAA found')
  const publishTime = priceUpdate.parsed[0].price.publish_time

  return {
    feedId: feed.underlyingId,
    vaa: `0x${priceUpdate.binary.data[0]}`,
    publishTime,
    version: BigInt(publishTime) - feed.minValidTime,
  }
}

export const buildCommitmentsForOraclesIndividual = async ({
  chainId,
  pyth,
  publicClient,
  backupPythClient = BackupPythClient,
  marketOracles: _marketOracles,
  onError,
  onSuccess,
}: {
  chainId: SupportedChainId
  pyth: HermesClient
  publicClient: PublicClient
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
  console.error('Fetching individual commitments, this is unexpected')
  try {
    const now = BigInt(nowSeconds())

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
    const priceFeedUpdateData = await getRecentVaa({ feeds: feedIds, pyth })

    const commitments = Promise.all(
      Object.values(marketOracles).map(
        async ({ providerFactoryAddress, providerAddress, underlyingId, providerId, minValidTime }) => {
          const contract = getKeeperOracleContract(providerAddress, publicClient)
          let updateData = priceFeedUpdateData.find(({ feedId }) => `0x${feedId}` === underlyingId)
          if (!updateData) throw new Error('No update data found')

          const [global, next, timeout] = await Promise.all([
            contract.read.global(),
            contract.read.next(),
            contract.read.timeout(),
          ])
          let indexToCommit = global.latestIndex + 1n
          let version = next
          let withinGracePeriod = version > 0n ? now - version < timeout : true

          // Scan forward through the version list until we find a version that is within it's grace period
          // or we reach the end of the list
          while (!withinGracePeriod && indexToCommit < global.currentIndex) {
            indexToCommit = indexToCommit + 1n
            version = indexToCommit < global.currentIndex ? await contract.read.versions([indexToCommit]) : 0n
            withinGracePeriod = version > 0n ? now - version < timeout : true
          }

          // If version is non-zero and before existing update publish time
          // find a VAA with a publish time before version
          if (version > 0n && version < updateData.publishTime) {
            updateData = await getVaaForPublishTime({
              pyth,
              feed: { underlyingId, minValidTime },
              requestedPublishTime: version - minValidTime,
            })
          }

          return {
            keeperFactory: providerFactoryAddress,
            version: updateData.version,
            value: 1n,
            ids: [providerId],
            updateData: updateData.vaa as Hex,
          }
        },
      ),
    )
    onSuccess?.()
    return commitments
  } catch (err: any) {
    // Only use backup if we are on mainnet
    if (backupPythClient && mainnetChains.some((c) => c.id === chainId)) {
      return buildCommitmentsForOracles({
        chainId,
        pyth: backupPythClient,
        marketOracles: _marketOracles,
        publicClient,
        backupPythClient: null,
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

export const buildCommitmentsForOracles = async ({
  chainId,
  pyth,
  publicClient,
  backupPythClient = BackupPythClient,
  marketOracles: _marketOracles,
  onError,
  onSuccess,
}: {
  chainId: SupportedChainId
  pyth: HermesClient
  publicClient: PublicClient
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
    if (!priceFeedUpdateData || !priceFeedUpdateData.parsed)
      return buildCommitmentsForOraclesIndividual({ chainId, pyth, publicClient, marketOracles, onError, onSuccess })

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
    // Only use backup if we are on mainnet
    if (backupPythClient && mainnetChains.some((c) => c.id === chainId)) {
      return buildCommitmentsForOracles({
        chainId,
        pyth: backupPythClient,
        marketOracles: _marketOracles,
        publicClient,
        backupPythClient: null,
      })
    }
    if (onError) {
      onError()
    }
    throw err
  }
}
