import { HermesClient } from '@pythnetwork/hermes-client'
import { Address, Hex, PublicClient, WalletClient, zeroAddress } from 'viem'

import { SupportedChainId, SupportedMarket, chainIdToChainMap } from '../../constants'
import { OptionalAddress } from '../../types/shared'
import { throwIfZeroAddress } from '../../utils/addressUtils'
import { buildCommitPrice, encodeInvoke } from '../../utils/multiinvoker'
import { getKeeperFactoryContract } from '../contracts'
import { MarketOracles, fetchMarketOracles } from '../markets/chain'
import { fetchPrices } from './cryptex'
import { buildCommitmentsForOracles as pythBuildCommitmentsForOracles } from './pyth'

export type OracleProviderType = 'PythFactory' | 'CryptexFactory' | 'ChainlinkFactory' | 'unknown'
export type OracleClients = {
  pyth: HermesClient | HermesClient[]
  cryptex?: string
}

export async function oracleProviderTypeForFactoryAddress({
  publicClient,
  factory,
}: {
  publicClient: PublicClient
  factory: Address
}): Promise<OracleProviderType> {
  try {
    const oracleFactory = getKeeperFactoryContract(factory, publicClient)
    const type = await oracleFactory.read.factoryType()
    return type as OracleProviderType
  } catch (err) {
    console.error(err)
  }

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
        const providerType = await oracleProviderTypeForFactoryAddress({ publicClient, factory })
        if (providerType === 'PythFactory') {
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

        if (providerType === 'CryptexFactory' && oracleClients.cryptex) {
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
        const providerType = await oracleProviderTypeForFactoryAddress({ publicClient, factory })
        if (providerType === 'PythFactory') {
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

        if (providerType === 'CryptexFactory' && oracleClients.cryptex) {
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
    factory: marketOracle.subOracleFactoryAddress,
    subOracle: marketOracle.subOracleAddress,
    id: marketOracle.id,
    underlyingId: marketOracle.underlyingId,
    minValidTime: marketOracle.minValidTime,
    staleAfter: marketOracle.staleAfter,
  }))
}

export type BuildCommitPriceTxArgs = {
  chainId: SupportedChainId
  keeperFactory: Address
  address: Address
  value: bigint
  ids: Hex[]
  version: bigint
  updateData: Hex
  revertOnFailure?: boolean
}
export function buildCommitPriceTx({
  chainId,
  keeperFactory,
  address,
  value,
  ids,
  version,
  updateData,
  revertOnFailure = true,
}: BuildCommitPriceTxArgs) {
  const actions = [buildCommitPrice({ keeperFactory, value, ids, version, vaa: updateData, revertOnFailure })]
  return encodeInvoke({
    chainId,
    address,
    actions,
    value,
  })
}

type OracleConfig = {
  chainId: SupportedChainId
  publicClient: PublicClient
  oracleClients: OracleClients
  supportedMarkets: SupportedMarket[]
  walletClient?: WalletClient
  operatingFor?: Address
}
type OmitBound<T> = Omit<T, 'chainId' | 'publicClient' | 'oracleClients' | 'requests' | 'address'>
type OptionalRequests = { requests?: UpdateDataRequest[]; markets?: SupportedMarket[] }
export class OraclesModule {
  private defaultAddress: Address = zeroAddress
  constructor(private config: OracleConfig) {
    this.defaultAddress = config.operatingFor ?? config.walletClient?.account?.address ?? this.defaultAddress
  }

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
          publicClient: this.config.publicClient,
          ...args,
        })
      },
    }
  }

  get build() {
    return {
      commitPrice: (args: OmitBound<Parameters<typeof buildCommitPriceTx>[0]> & OptionalAddress) => {
        const address = args.address ?? this.defaultAddress
        throwIfZeroAddress(address)

        return buildCommitPriceTx({
          chainId: this.config.chainId,
          ...args,
          address,
        })
      },
    }
  }

  get write() {
    const walletClient = this.config.walletClient
    if (!walletClient || !walletClient.account) {
      throw new Error('Wallet client required for write methods.')
    }

    const { chainId } = this.config
    const address = walletClient.account

    const txOpts = { account: address, chainId, chain: chainIdToChainMap[chainId] }

    return {
      commitPrice: async (...args: Parameters<typeof this.build.commitPrice>) => {
        const tx = this.build.commitPrice(...args)
        const hash = await walletClient.sendTransaction({ ...tx, ...txOpts })
        return hash
      },
    }
  }
}
