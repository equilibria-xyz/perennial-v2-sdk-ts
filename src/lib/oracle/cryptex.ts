import { Hex } from 'viem'

import { UpdateDataRequest, UpdateDataResponse } from '.'
import { Big6Math, notEmpty } from '../../utils'
import { pythPriceToBig18 } from './pyth'

type PriceResponse = {
  binary: { data: string }
  parsed: {
    id: string
    price: {
      price: number
      expo: number
      publish_time: number
    }
  }[]
}

export async function fetchPrices({
  url,
  timestamp,
  feeds,
}: {
  url: string
  timestamp?: bigint
  feeds: UpdateDataRequest[]
}): Promise<Omit<UpdateDataResponse, 'keeperFactory'>> {
  const params = new URLSearchParams()
  if (timestamp) params.append('timestamp', timestamp.toString())
  feeds.forEach(({ underlyingId }) => params.append('feedID[]', underlyingId))

  const data: PriceResponse = await fetch(`${url}/prices?${params.toString()}`).then((res) => res.json())
  if (data.parsed.length !== feeds.length) throw new Error('Missing price feed data')

  return transformPriceResponse({ data, feeds })
}

function transformPriceResponse({
  data,
  feeds,
}: {
  data: PriceResponse
  feeds: UpdateDataRequest[]
}): Omit<UpdateDataResponse, 'keeperFactory'> {
  const maxMinValidTime = Big6Math.max(...feeds.map(({ minValidTime }) => minValidTime))
  const maxPublishTime = Math.max(...data.parsed.map((price) => price.price.publish_time))

  return {
    details: data.parsed
      .map((data) => {
        const underlyingId: Hex = `0x${data.id}`
        const id = feeds.find((feed) => feed.underlyingId === underlyingId)?.id
        if (!id) return null
        return {
          id,
          underlyingId,
          price: pythPriceToBig18(BigInt(data.price.price), data.price.expo),
          publishTime: data.price.publish_time,
        }
      })
      .filter(notEmpty),
    ids: feeds.map(({ id }) => id),
    updateData: `0x${data.binary.data}` as Hex,
    version: BigInt(maxPublishTime) - maxMinValidTime,
    value: 0n,
  }
}
