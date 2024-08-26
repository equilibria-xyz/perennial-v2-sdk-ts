import { HermesClient } from '@pythnetwork/hermes-client'
import { Address, Hex, PublicClient, maxUint256 } from 'viem'

import { UpdateDataResponse } from '.'
import { SupportedChainId, pythBenchmarksURL } from '../../constants/network'
import { nowSeconds } from '../../utils'
import { unique } from '../../utils/arrayUtils'
import { Big6Math } from '../../utils/big6Utils'

const DefaultPythArgs = {
  encoding: 'hex',
  parsed: true,
} as const

export const buildCommitmentsForOracles = async ({
  chainId,
  pyth: pyth_,
  publicClient,
  marketOracles,
  timestamp,
}: {
  chainId: SupportedChainId
  pyth: HermesClient | HermesClient[]
  publicClient: PublicClient
  timestamp?: bigint
  marketOracles: {
    providerAddress: Address
    providerFactoryAddress: Address
    underlyingId: Hex
    providerId: Hex
    minValidTime: bigint
    staleAfter?: bigint
  }[]
}): Promise<UpdateDataResponse[]> => {
  const pyth = Array.isArray(pyth_) ? pyth_.at(0) : pyth_
  if (!pyth) throw new Error('No Pyth client provided')

  try {
    const feedIds = marketOracles.map(({ underlyingId, minValidTime }) => ({
      underlyingId,
      minValidTime,
    }))
    // Get current VAAs for each price feed
    const uniqueFeeds = unique(feedIds.map((f) => f.underlyingId))
    const priceFeedUpdateData = Boolean(timestamp)
      ? await pyth.getPriceUpdatesAtTimestamp(Number(timestamp), uniqueFeeds, DefaultPythArgs)
      : await pyth.getLatestPriceUpdates(uniqueFeeds, DefaultPythArgs)

    if (!priceFeedUpdateData || !priceFeedUpdateData.parsed) throw new Error('No price feed update data found')

    // Check if any of the prices are too old
    const now = BigInt(nowSeconds())
    for (const p of priceFeedUpdateData.parsed) {
      const oracle = marketOracles.find((o) => o.underlyingId.toLowerCase() === `0x${p.id}`.toLowerCase())
      if (!oracle) continue

      const staleAfter = oracle.staleAfter ?? maxUint256
      if (staleAfter && BigInt(p.price.publish_time) + staleAfter < now)
        if (await pythMarketOpen(`0x${p.id}`))
          // Only throw an error if the price is stale and the market is open
          throw new Error(`Price feed ${p.id} is too old: ${p.price.publish_time} < ${staleAfter}`)
    }

    const publishTimeMap = priceFeedUpdateData.parsed.reduce(
      (acc, p) => {
        if (!acc[p.price.publish_time]) acc[p.price.publish_time] = []
        const oracles = marketOracles.filter((o) => o.underlyingId.toLowerCase() === `0x${p.id}`.toLowerCase())
        if (!oracles) return acc

        // We can't commit two oracles with the same underlying ID at once
        // So if there is multiple oracles with the same underlying ID, split them into separate commitments
        // TODO: Change this once submitting for multiple oracles with the same underlying ID is supported in v2.3
        oracles.forEach((o, i) => {
          if (!acc[p.price.publish_time][i]) acc[p.price.publish_time][i] = []
          acc[p.price.publish_time][i].push({ ...o, price: pythPriceToBig18(BigInt(p.price.price), p.price.expo) })
        })
        return acc
      },
      {} as Record<number, { underlyingId: Hex; providerId: Hex; minValidTime: bigint; price: bigint }[][]>,
    )

    return Object.entries(publishTimeMap)
      .map(([publishTime, allOracles]) => {
        return allOracles.map((oracles) => ({
          keeperFactory: marketOracles[0].providerFactoryAddress,
          version: BigInt(publishTime) - Big6Math.max(...oracles.map((o) => o.minValidTime)),
          value: BigInt(uniqueFeeds.length),
          updateData: `0x${priceFeedUpdateData.binary.data[0]}` as Hex,
          ids: oracles.map((o) => o.providerId),
          details: oracles.map((o) => ({
            id: o.providerId,
            underlyingId: o.underlyingId,
            price: o.price,
            publishTime: Number(publishTime),
          })),
        }))
      })
      .flat()
  } catch (err: any) {
    const nextPyth = Array.isArray(pyth_) ? pyth_.slice(1) : []
    const useBackup = nextPyth.length > 0
    console.error('Pyth Recent VAA Error', `Use backup: ${useBackup}`, err)

    if (useBackup) {
      return buildCommitmentsForOracles({
        chainId,
        pyth: nextPyth,
        marketOracles,
        publicClient,
      })
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

const marketOpenCache = new Map<string, { isOpen: boolean; expiration: number }>()
export async function pythMarketOpen(priceFeedId: Hex) {
  const now = nowSeconds()
  const cachedResult = marketOpenCache.get(priceFeedId)

  // Query if we don't have a cached result or if the cached result is expired
  const shouldQuery = !cachedResult || cachedResult.expiration < now
  if (!shouldQuery) return cachedResult.isOpen

  const url = `${pythBenchmarksURL}/v1/price_feeds/${priceFeedId}`
  const response = await fetch(url)
  if (!response.ok) return true // default to open if we can't get the data

  const data: { market_hours: { is_open: boolean; next_open: number | null; next_close: number | null } } =
    await response.json()

  const expiration = data.market_hours.is_open ? data.market_hours.next_close : data.market_hours.next_open
  if (expiration) marketOpenCache.set(priceFeedId, { isOpen: data.market_hours.is_open, expiration })

  return data.market_hours.is_open
}
