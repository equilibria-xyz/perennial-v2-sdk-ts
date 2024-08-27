import { HermesClient } from '@pythnetwork/hermes-client'
import { Address, Hex, PublicClient } from 'viem'

import {
  ChainlinkFactoryAddresses,
  CryptexFactoryAddresses,
  PythFactoryAddresses,
  SupportedChainId,
  SupportedMarket,
} from '../../constants'
import { MarketOracles, fetchMarketOracles } from '../markets/chain'
import { fetchPrices } from './cryptex'
import { buildCommitmentsForOracles as pythBuildCommitmentsForOracles } from './pyth'

export type OracleProviderType = 'pyth' | 'cryptex' | 'chainlink' | 'unknown'
export type OracleClients = {
  pyth: HermesClient | HermesClient[]
  cryptex?: string
}

export function oracleProviderTypeForFactoryAddress({
  chainId,
  factory,
}: {
  chainId: SupportedChainId
  factory: Address
}): OracleProviderType {
  if (PythFactoryAddresses[chainId] === factory) return 'pyth'
  if (CryptexFactoryAddresses[chainId] === factory) return 'cryptex'
  if (ChainlinkFactoryAddresses[chainId] === factory) return 'chainlink'

  return 'unknown'
}

export type UpdateDataRequest = {
  factory: Address
  subOracle: Address
  id: Hex
  underlyingId: Hex
  minValidTime: bigint
  staleAfter?: bigint
}
export type UpdateDataResponse = {
  keeperFactory: Address
  version: bigint
  value: bigint
  updateData: Hex
  ids: Hex[]
  details: {
    id: Hex
    underlyingId: Hex
    price: bigint
    publishTime: number
  }[]
}
export async function oracleCommitmentsLatest({
  chainId,
  oracleClients,
  requests,
  versionOverride,
  publicClient,
  onSuccess,
  onError,
}: {
  chainId: SupportedChainId
  requests: UpdateDataRequest[]
  oracleClients: OracleClients
  versionOverride?: bigint
  publicClient: PublicClient
  onError?: () => void
  onSuccess?: () => void
}): Promise<UpdateDataResponse[]> {
  try {
    // Group by factory
    const groupedRequests = requests.reduce((acc, req) => {
      if (!acc.has(req.factory)) acc.set(req.factory, [])
      acc.get(req.factory)?.push(req)

      return acc
    }, new Map<Address, UpdateDataRequest[]>())

    // Generate commitment(s) gor each factory grouping
    const commitmentPromises = Array.from(groupedRequests.entries()).map(
      async ([factory, reqs]): Promise<UpdateDataResponse[]> => {
        const providerType = oracleProviderTypeForFactoryAddress({ chainId, factory })
        if (providerType === 'pyth') {
          const pythResponse = await pythBuildCommitmentsForOracles({
            chainId,
            publicClient,
            pyth: oracleClients.pyth,
            marketOracles: reqs.map((r) => ({
              providerFactoryAddress: factory,
              providerAddress: r.subOracle,
              underlyingId: r.underlyingId,
              providerId: r.id,
              minValidTime: r.minValidTime,
            })),
          })

          return pythResponse.map((res) => ({ ...res, keeperFactory: factory }))
        }

        if (providerType === 'cryptex' && oracleClients.cryptex) {
          const cryptexResponse = await fetchPrices({
            url: oracleClients.cryptex,
            feeds: reqs,
          })

          return [{ ...cryptexResponse, keeperFactory: factory }]
        }
        // if (providerType === 'chainlink')

        return []
      },
    )

    onSuccess?.()
    const commitments = (await Promise.all(commitmentPromises)).flat()

    // Override version if passed in
    return commitments.map((c) => ({ ...c, version: versionOverride ?? c.version }))
  } catch (err: any) {
    onError?.()
    throw err
  }
}

export async function oracleCommitmentsTimestamp({
  chainId,
  oracleClients,
  requests,
  timestamp,
  versionOverride,
  publicClient,
  onSuccess,
  onError,
}: {
  chainId: SupportedChainId
  requests: UpdateDataRequest[]
  timestamp: bigint
  versionOverride?: bigint
  oracleClients: OracleClients
  publicClient: PublicClient
  onError?: () => void
  onSuccess?: () => void
}): Promise<UpdateDataResponse[]> {
  try {
    // Group by factory
    const groupedRequests = requests.reduce((acc, req) => {
      if (!acc.has(req.factory)) acc.set(req.factory, [])
      acc.get(req.factory)?.push(req)

      return acc
    }, new Map<Address, UpdateDataRequest[]>())

    // Generate commitment(s) gor each factory grouping
    const commitmentPromises = Array.from(groupedRequests.entries()).map(
      async ([factory, reqs]): Promise<UpdateDataResponse[]> => {
        const providerType = oracleProviderTypeForFactoryAddress({ chainId, factory })
        if (providerType === 'pyth') {
          const pythResponse = await pythBuildCommitmentsForOracles({
            chainId,
            publicClient,
            pyth: oracleClients.pyth,
            timestamp,
            marketOracles: reqs.map((r) => ({
              providerFactoryAddress: factory,
              providerAddress: r.subOracle,
              underlyingId: r.underlyingId,
              providerId: r.id,
              minValidTime: r.minValidTime,
              staleAfter: r.staleAfter,
            })),
          })

          return pythResponse.map((res) => ({ ...res, keeperFactory: factory }))
        }

        if (providerType === 'cryptex' && oracleClients.cryptex) {
          const cryptexResponse = await fetchPrices({
            url: oracleClients.cryptex,
            timestamp,
            feeds: reqs,
          })

          return [{ ...cryptexResponse, keeperFactory: factory }]
        }
        // if (providerType === 'chainlink')

        return []
      },
    )

    onSuccess?.()
    const commitments = (await Promise.all(commitmentPromises)).flat()

    // Override version if passed in
    return commitments.map((c) => ({ ...c, version: versionOverride ?? c.version }))
  } catch (err: any) {
    onError?.()
    throw err
  }
}

export function marketOraclesToUpdateDataRequest(marketOracles: MarketOracles[SupportedMarket][]): UpdateDataRequest[] {
  return marketOracles.map((marketOracle) => ({
    factory: marketOracle.providerFactoryAddress,
    subOracle: marketOracle.providerAddress,
    id: marketOracle.providerId,
    underlyingId: marketOracle.underlyingId,
    minValidTime: marketOracle.minValidTime,
    staleAfter: marketOracle.staleAfter,
  }))
}

type OracleConfig = {
  chainId: SupportedChainId
  publicClient: PublicClient
  oracleClients: OracleClients
  supportedMarkets: SupportedMarket[]
}
type OmitBound<T> = Omit<T, 'chainId' | 'publicClient' | 'oracleClients' | 'requests'>
type OptionalRequests = { requests?: UpdateDataRequest[]; markets?: SupportedMarket[] }
export class OraclesModule {
  constructor(private config: OracleConfig) {}

  get read() {
    return {
      oracleCommitmentsLatest: async (
        args: OmitBound<Parameters<typeof oracleCommitmentsLatest>[0]> & OptionalRequests = {},
      ) => {
        return oracleCommitmentsLatest({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          oracleClients: this.config.oracleClients,
          requests:
            args.requests ??
            marketOraclesToUpdateDataRequest(
              Object.values(
                await fetchMarketOracles(
                  this.config.chainId,
                  this.config.publicClient,
                  args.markets ?? this.config.supportedMarkets,
                ),
              ),
            ),
          ...args,
        })
      },

      oracleCommitmentsTimestamp: async (
        args: OmitBound<Parameters<typeof oracleCommitmentsTimestamp>[0]> & OptionalRequests,
      ) => {
        return oracleCommitmentsTimestamp({
          chainId: this.config.chainId,
          publicClient: this.config.publicClient,
          oracleClients: this.config.oracleClients,
          requests:
            args.requests ??
            marketOraclesToUpdateDataRequest(
              Object.values(
                await fetchMarketOracles(
                  this.config.chainId,
                  this.config.publicClient,
                  args.markets ?? this.config.supportedMarkets,
                ),
              ),
            ),
          ...args,
        })
      },

      oracleProviderForFactoryAddress: (args: OmitBound<Parameters<typeof oracleProviderTypeForFactoryAddress>[0]>) => {
        return oracleProviderTypeForFactoryAddress({
          chainId: this.config.chainId,
          ...args,
        })
      },
    }
  }
}
