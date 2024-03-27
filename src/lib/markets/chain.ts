import { EvmPriceServiceConnection } from '@perennial/pyth-evm-js'
import {
  Address,
  Hex,
  PublicClient,
  decodeFunctionResult,
  encodeFunctionData,
  getAddress,
  getContractAddress,
  parseEther, // eslint-disable-line no-restricted-imports
  toHex,
  zeroAddress,
} from 'viem'

import {
  AssetMetadata,
  Big6Math,
  DefaultChain,
  MaxUint256,
  PositionSide,
  PositionStatus,
  SupportedAsset,
  SupportedChainId,
  addressToAsset,
  calculateFundingForSides,
  chainAssetsWithAddress,
  notEmpty,
} from '../..'
import { LensAbi, LensDeployedBytecode } from '../../abi/Lens.abi'
import { getRpcURLFromPublicClient } from '../../constants/network'
import { calcLeverage, calcNotional, getSideFromPosition, getStatusForSnapshot } from '../../utils/positionUtils'
import { buildCommitmentsForOracles } from '../../utils/pythUtils'
import { getMarketContract, getOracleContract, getPythFactoryContract } from '../contracts'

export type MarketOracles = NonNullable<Awaited<ReturnType<typeof fetchMarketOracles>>>

export async function fetchMarketOracles(chainId: SupportedChainId = DefaultChain.id, publicClient: PublicClient) {
  const markets = chainAssetsWithAddress(chainId)
  const fetchMarketOracles = async (asset: SupportedAsset, marketAddress: Address) => {
    const metadata = AssetMetadata[asset]
    const market = getMarketContract(marketAddress, publicClient)
    const pythFactory = getPythFactoryContract(chainId, publicClient)
    const oracleAddress = await market.read.oracle()
    // Fetch oracle data
    const oracle = getOracleContract(oracleAddress, publicClient)
    const global = await oracle.read.global()
    const [keeperOracle] = await oracle.read.oracles([global[0]])

    // TODO(arjun): Pull these from the registry once available
    const underlyingId = metadata.pythFeedId as Hex
    const [validFrom, providerId] = await Promise.all([
      pythFactory.read.validFrom(),
      pythFactory.read.fromUnderlyingId([underlyingId]),
    ])

    return {
      asset,
      marketAddress,
      address: oracleAddress,
      providerFactoryAddress: pythFactory.address,
      providerAddress: keeperOracle,
      providerId,
      underlyingId,
      minValidTime: validFrom,
    }
  }

  const marketData = await Promise.all(
    markets.map(({ asset, marketAddress }) => {
      return fetchMarketOracles(asset, marketAddress)
    }),
  )

  return marketData.reduce(
    (acc, market) => {
      acc[market.asset] = market
      return acc
    },
    {} as Record<SupportedAsset, Awaited<ReturnType<typeof fetchMarketOracles>>>,
  )
}

export type MarketSnapshot = ChainMarketSnapshot & {
  pre: ChainMarketSnapshot
  major: bigint
  majorSide: PositionSide
  minor: bigint
  minorSide: PositionSide
  nextMajor: bigint
  nextMajorSide: PositionSide
  nextMinor: bigint
  nextMinorSide: PositionSide
  fundingRate: {
    long: bigint
    short: bigint
    maker: bigint
  }
  socializationFactor: bigint
  isSocialized: boolean
}

export type UserMarketSnapshot = ChainUserMarketSnapshot & {
  pre: Omit<ChainUserMarketSnapshot, 'priceUpdate'>
  side: PositionSide
  nextSide: PositionSide
  status: PositionStatus
  magnitude: bigint
  nextMagnitude: bigint
  maintenance: bigint
  nextMaintenance: bigint
  margin: bigint
  nextMargin: bigint
  leverage: bigint
  nextLeverage: bigint
  notional: bigint
  nextNotional: bigint
  priceUpdate: Address
}

export type MarketSnapshots = NonNullable<Awaited<ReturnType<typeof fetchMarketSnapshots>>>
// TODO: make market oracles an optional parameter so we can skip that fetch
export async function fetchMarketSnapshots({
  publicClient,
  pythClient,
  chainId = DefaultChain.id,
  address = zeroAddress,
  marketOracles,
  onError,
  onSuccess,
}: {
  publicClient: PublicClient
  pythClient: EvmPriceServiceConnection
  chainId: SupportedChainId
  address: Address
  marketOracles?: MarketOracles
  onError?: () => void
  onSuccess?: () => void
}) {
  const rpcUrl = getRpcURLFromPublicClient(publicClient)
  if (!publicClient || !rpcUrl) {
    return
  }
  if (!marketOracles) {
    marketOracles = await fetchMarketOracles(chainId, publicClient)
  }
  const snapshotData = await fetchMarketSnapshotsAfterSettle({
    chainId,
    address,
    marketOracles,
    publicClient,
    providerUrl: rpcUrl,
    pyth: pythClient,
    onPythError: onError,
    resetPythError: onSuccess,
  })
  if (snapshotData.commitments.some((commitment) => commitment !== '0x')) {
    const commitmentError = snapshotData.commitments.find((commitment) => commitment !== '0x')
    console.error('Snapshot commitment error', [commitmentError, address, chainId].join(', '))
  }
  if (snapshotData.updates.some((update) => update !== '0x')) {
    const updateError = snapshotData.updates.find((update) => update !== '0x')
    console.error('Snapshot update error', [updateError, address, chainId].join(', '))
  }
  const marketSnapshots = snapshotData.market.reduce(
    (acc, snapshot) => {
      const major = Big6Math.max(snapshot.position.long, snapshot.position.short)
      const nextMajor = Big6Math.max(snapshot.nextPosition.long, snapshot.nextPosition.short)
      const minor = Big6Math.min(snapshot.position.long, snapshot.position.short)
      const nextMinor = Big6Math.min(snapshot.nextPosition.long, snapshot.nextPosition.short)
      const fundingRates = calculateFundingForSides(snapshot)
      const socializationFactor = !Big6Math.isZero(major)
        ? Big6Math.min(Big6Math.div(minor + snapshot.nextPosition.maker, major), Big6Math.ONE)
        : Big6Math.ONE
      acc[snapshot.asset] = {
        ...snapshot,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        pre: snapshotData.marketPre.find((pre) => pre.asset === snapshot.asset)!,
        major,
        majorSide: major === snapshot.position.long ? PositionSide.long : PositionSide.short,
        nextMajor,
        nextMajorSide: nextMajor === snapshot.nextPosition.long ? PositionSide.long : PositionSide.short,
        minor,
        minorSide: minor === snapshot.position.long ? PositionSide.long : PositionSide.short,
        nextMinor,
        nextMinorSide: nextMinor === snapshot.nextPosition.long ? PositionSide.long : PositionSide.short,
        fundingRate: {
          long: fundingRates.long,
          short: fundingRates.short,
          maker: fundingRates.maker,
        },
        socializationFactor,
        isSocialized: socializationFactor < Big6Math.ONE,
      }
      return acc
    },
    {} as { [key in SupportedAsset]?: MarketSnapshot },
  )
  const userSnapshots = snapshotData.user.reduce(
    (acc, snapshot) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const pre = snapshotData.userPre.find((pre) => pre.asset === snapshot.asset)!
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const marketSnapshot = marketSnapshots[snapshot.asset]!
      const marketPrice = marketSnapshot.global.latestPrice ?? 0n
      const latestPosition = snapshot.versions[0].valid ? snapshot.position : pre.position
      const nextPosition = snapshot.versions[0].valid ? snapshot.nextPosition : pre.nextPosition
      const side = getSideFromPosition(latestPosition)
      const nextSide = getSideFromPosition(nextPosition)
      const magnitude = side === PositionSide.none ? 0n : latestPosition[side]
      const nextMagnitude = nextSide === PositionSide.none ? 0n : nextPosition?.[nextSide] ?? 0n
      const priceUpdate = snapshot?.priceUpdate
      if (priceUpdate !== '0x') {
        console.error('Sync error', snapshot.asset, priceUpdate, address)
      }
      const hasVersionError =
        !snapshot.versions[0].valid &&
        (pre.nextPosition.timestamp < marketSnapshot.pre.latestOracleVersion.timestamp ||
          pre.nextPosition.timestamp + 60n < BigInt(Math.floor(Date.now() / 1000)))

      if (hasVersionError && (magnitude !== 0n || nextMagnitude !== 0n) && magnitude !== nextMagnitude) {
        console.error('Version error', snapshot.asset, address)
      }
      acc[snapshot.asset] = {
        ...snapshot,
        pre,
        side,
        nextSide,
        status: getStatusForSnapshot(magnitude, nextMagnitude, snapshot.local.collateral, hasVersionError, priceUpdate),
        magnitude,
        nextMagnitude,
        maintenance: !Big6Math.isZero(magnitude)
          ? Big6Math.max(
              marketSnapshot.riskParameter.minMaintenance,
              Big6Math.mul(marketSnapshot.riskParameter.maintenance, calcNotional(magnitude, marketPrice)),
            )
          : 0n,
        nextMaintenance: !Big6Math.isZero(nextMagnitude)
          ? Big6Math.max(
              marketSnapshot.riskParameter.minMaintenance,
              Big6Math.mul(marketSnapshot.riskParameter.maintenance, calcNotional(nextMagnitude, marketPrice)),
            )
          : 0n,
        margin: !Big6Math.isZero(magnitude)
          ? Big6Math.max(
              marketSnapshot.riskParameter.minMargin,
              Big6Math.mul(marketSnapshot.riskParameter.margin, calcNotional(magnitude, marketPrice)),
            )
          : 0n,
        nextMargin: !Big6Math.isZero(nextMagnitude)
          ? Big6Math.max(
              marketSnapshot.riskParameter.minMargin,
              Big6Math.mul(marketSnapshot.riskParameter.margin, calcNotional(nextMagnitude, marketPrice)),
            )
          : 0n,
        leverage: calcLeverage(marketPrice, magnitude, snapshot.local.collateral),
        nextLeverage: calcLeverage(marketPrice, nextMagnitude, snapshot.local.collateral),
        notional: calcNotional(magnitude, marketPrice),
        nextNotional: calcNotional(nextMagnitude, marketPrice),
      }
      return acc
    },
    {} as Record<SupportedAsset, UserMarketSnapshot>,
  )

  return {
    user: address === zeroAddress ? undefined : userSnapshots,
    market: marketSnapshots,
    commitments: snapshotData.commitments,
    updates: snapshotData.updates,
  }
}

export type ChainMarketSnapshot = Awaited<ReturnType<typeof fetchMarketSnapshotsAfterSettle>>['market'][number]
export type ChainUserMarketSnapshot = Awaited<ReturnType<typeof fetchMarketSnapshotsAfterSettle>>['user'][number]

async function fetchMarketSnapshotsAfterSettle({
  chainId,
  address,
  marketOracles,
  providerUrl,
  publicClient,
  pyth,
  onPythError,
  resetPythError,
}: {
  chainId: SupportedChainId
  address: Address
  marketOracles: MarketOracles
  providerUrl: string
  publicClient: PublicClient
  pyth: EvmPriceServiceConnection
  onPythError?: () => void
  resetPythError?: () => void
}) {
  const lensAddress = getContractAddress({ from: address, nonce: MaxUint256 })
  const priceCommitments = await buildCommitmentsForOracles({
    chainId,
    marketOracles: Object.values(marketOracles),
    pyth,
    onError: onPythError,
    onSuccess: resetPythError,
    publicClient,
  })

  const marketAddresses = Object.values(marketOracles).map(({ marketAddress }) => marketAddress)

  const ethCallPayload = {
    to: lensAddress,
    from: address,
    data: encodeFunctionData({
      abi: LensAbi,
      functionName: 'snapshot',
      args: [priceCommitments, marketAddresses, address],
    }),
  }

  // Update marketFactory operator storage to allow lens to update address
  // Operator storage mapping is at index 1
  const alchemyRes = await fetch(providerUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_call', // use a manual eth_call here to use state overrides
      params: [
        ethCallPayload,
        'latest',
        {
          // state diff overrides
          [lensAddress]: {
            code: LensDeployedBytecode,
            balance: toHex(parseEther('1000')),
          },
        },
      ],
    }),
  })
  const batchRes = (await alchemyRes.json()) as { result: Hex }
  const lensRes = decodeFunctionResult({ abi: LensAbi, functionName: 'snapshot', data: batchRes.result })

  return {
    commitments: lensRes.commitmentStatus,
    updates: lensRes.updateStatus,
    market: lensRes.postUpdate.marketSnapshots
      .map((s) => {
        const asset = addressToAsset(getAddress(s.market))
        if (!asset) return
        return {
          ...s,
          asset,
        }
      })
      .filter(notEmpty),
    marketPre: lensRes.preUpdate.marketSnapshots
      .map((s) => {
        const asset = addressToAsset(getAddress(s.market))
        if (!asset) return
        return {
          ...s,
          asset,
        }
      })
      .filter(notEmpty),
    user: lensRes.postUpdate.marketAccountSnapshots
      .map((s, i) => {
        const asset = addressToAsset(getAddress(s.market))
        if (!asset) return
        return {
          ...s,
          asset,
          priceUpdate: lensRes.updateStatus[i],
        }
      })
      .filter(notEmpty),
    userPre: lensRes.preUpdate.marketAccountSnapshots
      .map((s) => {
        const asset = addressToAsset(getAddress(s.market))
        if (!asset) return
        return {
          ...s,
          asset,
        }
      })
      .filter(notEmpty),
  }
}
