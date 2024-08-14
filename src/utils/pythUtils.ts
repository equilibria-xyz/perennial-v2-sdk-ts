import { HermesClient } from '@pythnetwork/hermes-client'
import { Address, Hex, PublicClient } from 'viem'

import { SupportedChainId } from '../constants/network'
import { notEmpty, unique } from './arrayUtils'
import { Big6Math } from './big6Utils'

const DefaultPythOptions = { encoding: 'hex', parsed: true } as const

export const getRecentVaa = async ({
  pyth: pyth_,
  feeds,
}: {
  pyth: HermesClient | HermesClient[]
  feeds: { underlyingId: string; minValidTime: bigint }[]
}): Promise<
  {
    feedId: string
    vaa: string
    publishTime: number
    version: bigint
  }[]
> => {
  const pyth = Array.isArray(pyth_) ? pyth_.at(0) : pyth_
  if (!pyth) throw new Error('No Pyth client provided')

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
    const nextPyth = Array.isArray(pyth_) ? pyth_.slice(1) : null
    const useBackup = nextPyth !== null && nextPyth.length > 0
    console.error('Pyth Recent VAA Error', `Use backup: ${useBackup}`, err)

    if (useBackup) return getRecentVaa({ pyth: nextPyth, feeds })

    throw err
  }
}

export const buildCommitmentsForOracles = async ({
  chainId,
  pyth: pyth_,
  publicClient,
  marketOracles,
  onError,
  onSuccess,
}: {
  chainId: SupportedChainId
  pyth: HermesClient | HermesClient[]
  publicClient: PublicClient
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
  const pyth = Array.isArray(pyth_) ? pyth_.at(0) : pyth_
  if (!pyth) throw new Error('No Pyth client provided')

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
    const nextPyth = Array.isArray(pyth_) ? pyth_.slice(1) : null
    const useBackup = nextPyth !== null && nextPyth.length > 0
    console.error('Pyth Recent VAA Error', `Use backup: ${useBackup}`, err)

    if (useBackup) {
      return buildCommitmentsForOracles({
        chainId,
        pyth: nextPyth,
        marketOracles,
        publicClient,
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
