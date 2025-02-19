import JSONBig_ from 'json-bigint'
import { Hex, encodeAbiParameters, hexToNumber, keccak256, stringToBytes } from 'viem'

import { UpdateDataRequest, UpdateDataResponse } from '.'
import { Big6Math, notEmpty } from '../../utils'

const JSONBig = JSONBig_({ useNativeBigInt: true })

type StorkPriceResponse = {
  data: Record<
    string,
    {
      stork_signed_price: {
        public_key: Hex
        encoded_asset_id: Hex
        price: string
        timestamped_signature: {
          signature: {
            r: Hex
            s: Hex
            v: Hex
          }
          timestamp: bigint
        }
        publisher_merkle_root: Hex
        calculation_alg: {
          checksum: string
        }
      }
    }
  >
}

export async function fetchPrices({
  url,
  apiKey,
  timestamp,
  feeds,
}: {
  url: string
  apiKey?: string
  timestamp?: bigint
  feeds: UpdateDataRequest[]
}): Promise<Omit<UpdateDataResponse, 'keeperFactory'>> {
  const params = new URLSearchParams()
  // TODO: Stork doesn't support timestamping yet
  if (timestamp) throw new Error('Timestamp queries not supported')

  // Do this in a regular loop as only the first request will request the asset list
  const assets = []
  for (const { underlyingId } of feeds) {
    const asset = await idToStorkAsset({ id: underlyingId, storkUrl: url, storkApiKey: apiKey })
    assets.push(asset)
  }
  params.append('assets', assets.join(','))

  // We need to parse as JSONBig because the native JSON parse can cause rounding issues
  const headers = apiKey ? { Authorization: `${apiKey}` } : undefined
  const data: StorkPriceResponse = await fetch(`${url}/v1/prices/latest?${params.toString()}`, {
    headers,
  })
    .then((res) => res.text())
    .then((raw) => JSONBig.parse(raw))

  if (Object.keys(data.data).length !== feeds.length) throw new Error('Missing price feed data')

  return transformPriceResponse({ data, feeds })
}

function transformPriceResponse({
  data,
  feeds,
}: {
  data: StorkPriceResponse
  feeds: UpdateDataRequest[]
}): Omit<UpdateDataResponse, 'keeperFactory'> {
  const maxMinValidTime = Big6Math.max(...feeds.map(({ minValidTime }) => minValidTime))
  const maxPublishTime = Math.max(
    ...Object.values(data.data).map((price) =>
      storkTimestampNsToSeconds(price.stork_signed_price.timestamped_signature.timestamp),
    ),
  )

  return {
    details: Object.values(data.data)
      .map((data) => {
        const underlyingId = data.stork_signed_price.encoded_asset_id
        const id = feeds.find((feed) => feed.underlyingId === underlyingId)?.id
        if (!id) return null
        return {
          id,
          underlyingId,
          price: BigInt(data.stork_signed_price.price),
          publishTime: storkTimestampNsToSeconds(data.stork_signed_price.timestamped_signature.timestamp),
        }
      })
      .filter(notEmpty),
    ids: feeds.map(({ id }) => id),
    updateData: buildUpdateData({ underlyingIds: feeds.map(({ underlyingId }) => underlyingId), data: data.data }),
    version: BigInt(maxPublishTime) - maxMinValidTime,
    value: 0n,
  }
}

const storkAssetCache = new Map<Hex, string>()
async function idToStorkAsset({
  id,
  storkUrl,
  storkApiKey,
}: {
  id: Hex
  storkUrl: string
  storkApiKey?: string
}): Promise<string> {
  if (storkAssetCache.has(id)) return storkAssetCache.get(id)!
  const headers = storkApiKey ? { Authorization: `${storkApiKey}` } : undefined
  const assetList = (await fetch(`${storkUrl}/v1/prices/assets`, { headers }).then((res) => res.json())) as {
    data: string[]
  }

  for (const asset of assetList.data) {
    const id = keccak256(stringToBytes(asset))
    storkAssetCache.set(id, asset)
  }

  if (!storkAssetCache.has(id)) throw new Error('Asset not found')
  return storkAssetCache.get(id)!
}

function storkTimestampNsToSeconds(timestamp: bigint): number {
  return Number(timestamp / BigInt(1e9))
}

/*
  struct TemporalNumericValue {
    uint64 timestampNs; // 8 bytes
    int192 quantizedValue; // 8 bytes
  }
  struct TemporalNumericValueInput {
    TemporalNumericValue temporalNumericValue;
    bytes32 id;
    bytes32 publisherMerkleRoot;
    bytes32 valueComputeAlgHash;
    bytes32 r;
    bytes32 s;
    uint8 v;
  }
*/
function buildUpdateData({ underlyingIds, data }: { underlyingIds: Hex[]; data: StorkPriceResponse['data'] }): Hex {
  // encode the stork data
  const updateData = encodeAbiParameters(
    [
      {
        type: 'tuple[]',
        components: [
          { type: 'tuple', components: [{ type: 'uint64' }, { type: 'int192' }] },
          { type: 'bytes32' },
          { type: 'bytes32' },
          { type: 'bytes32' },
          { type: 'bytes32' },
          { type: 'bytes32' },
          { type: 'uint8' },
        ],
      },
    ],
    [
      Object.values(data)
        // Sort the data by the underlyingId to maintain order
        .sort((d1, d2) => {
          return (
            underlyingIds.indexOf(d1.stork_signed_price.encoded_asset_id) -
            underlyingIds.indexOf(d2.stork_signed_price.encoded_asset_id)
          )
        })
        .map((storkData) => [
          [storkData.stork_signed_price.timestamped_signature.timestamp, BigInt(storkData.stork_signed_price.price)],
          storkData.stork_signed_price.encoded_asset_id,
          storkData.stork_signed_price.publisher_merkle_root,
          `0x${storkData.stork_signed_price.calculation_alg.checksum}`,
          storkData.stork_signed_price.timestamped_signature.signature.r,
          storkData.stork_signed_price.timestamped_signature.signature.s,
          hexToNumber(storkData.stork_signed_price.timestamped_signature.signature.v),
        ]) as Array<[[bigint, bigint], Hex, Hex, Hex, Hex, Hex, number]>,
    ],
  )

  return updateData
}
