import { HermesClient } from '@pythnetwork/hermes-client'
import { Address, Hex, PublicClient } from 'viem'

import { PythFactoryAddresses, SupportedChainId, SupportedMarket } from '../../constants'
import { MarketOracles } from '../markets/chain'
import { buildCommitmentsForOracles as pythBuildCommitmentsForOracles } from './pyth'

export type OracleProvider = 'pyth' | 'cryptex' | 'chainlink' | 'unknown'
export type OracleClients = {
  pyth: HermesClient | HermesClient[]
}

export function oracleProviderForFactoryAddress({
  chainId,
  factory,
}: {
  chainId: SupportedChainId
  factory: Address
}): OracleProvider {
  if (PythFactoryAddresses[chainId] === factory) return 'pyth'

  return 'unknown'
}

export type UpdateDataRequest = {
  factory: Address
  subOracle: Address
  id: Hex
  underlyingId: Hex
  minValidTime: bigint
}
export type UpdateDataResponse = {
  keeperFactory: Address
  version: bigint
  value: bigint
  ids: Hex[]
  updateData: Hex
}
export async function oracleCommitmentsLatest({
  chainId,
  clients,
  requests,
  publicClient,
}: {
  chainId: SupportedChainId
  requests: UpdateDataRequest[]
  clients: OracleClients
  publicClient: PublicClient
}): Promise<UpdateDataResponse[]> {
  // Group by factory
  const groupedRequests = requests.reduce((acc, req) => {
    if (!acc.has(req.factory)) acc.set(req.factory, [])
    acc.get(req.factory)?.push(req)

    return acc
  }, new Map<Address, UpdateDataRequest[]>())

  // Generate commitment(s) gor each factory grouping
  const commitmentPromises = Array.from(groupedRequests.entries()).map(
    async ([factory, reqs]): Promise<UpdateDataResponse[]> => {
      const providerType = oracleProviderForFactoryAddress({ chainId, factory })
      if (providerType === 'pyth') {
        const pythResponse = await pythBuildCommitmentsForOracles({
          chainId,
          publicClient,
          pyth: clients.pyth,
          marketOracles: reqs.map((r) => ({
            providerFactoryAddress: factory,
            providerAddress: r.subOracle,
            underlyingId: r.underlyingId,
            providerId: r.id,
            minValidTime: r.minValidTime,
          })),
        })

        return pythResponse.map((res) => ({
          keeperFactory: factory,
          version: res.version,
          value: res.value,
          ids: res.ids,
          updateData: res.updateData,
        }))
      }

      // if (providerType === 'cryptex')
      // if (providerType === 'chainlink')

      return []
    },
  )

  return (await Promise.all(commitmentPromises)).flat()
}

export function marketOraclesToUpdateDataRequest(marketOracles: MarketOracles[SupportedMarket][]): UpdateDataRequest[] {
  return marketOracles.map((marketOracle) => ({
    factory: marketOracle.providerFactoryAddress,
    subOracle: marketOracle.providerAddress,
    id: marketOracle.providerId,
    underlyingId: marketOracle.underlyingId,
    minValidTime: marketOracle.minValidTime,
  }))
}
