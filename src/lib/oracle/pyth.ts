import { HermesClient } from '@pythnetwork/hermes-client'
import { Address, Hex, PublicClient } from 'viem'

import { SupportedChainId } from '../../constants/network'
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
  }[]
}): Promise<
  {
    keeperFactory: Address
    version: bigint
    value: bigint
    ids: Hex[]
    updateData: Hex
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
    const priceFeedUpdateData = Boolean(timestamp)
      ? await pyth.getPriceUpdatesAtTimestamp(Number(timestamp), uniqueFeeds, DefaultPythArgs)
      : await pyth.getLatestPriceUpdates(uniqueFeeds, DefaultPythArgs)

    if (!priceFeedUpdateData || !priceFeedUpdateData.parsed) throw new Error('No price feed update data found')

    // TODO: Throw an error if price is stale and the market is open. We need to wait until Pyth returns market open status in Hermes

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
          acc[p.price.publish_time][i].push(o)
        })
        return acc
      },
      {} as Record<number, { providerId: Hex; minValidTime: bigint }[][]>,
    )

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
