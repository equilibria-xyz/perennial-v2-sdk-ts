import { Address, PublicClient, getAddress, getContractAddress, maxUint256, zeroAddress } from 'viem'

import {
  Big6Math,
  Big18Math,
  DefaultChain,
  MaxUint256,
  PositionSide,
  PositionStatus,
  SupportedChainId,
  SupportedMarket,
  addressToMarket,
  calculateFundingAndInterestForSides,
  chainMarketsWithAddress,
} from '../..'
import { GasOracleAbi } from '../../abi/GasOracle.abi'
import { LensAbi, LensDeployedBytecode } from '../../abi/Lens.abi'
import { SupportedMarketMapping } from '../../constants'
import { calcLeverage, calcNotional, getStatusForSnapshot, sideFromPosition } from '../../utils/positionUtils'
import {
  getKeeperFactoryContract,
  getKeeperOracleContract,
  getMarketContract,
  getOracleContract,
  getOracleFactoryContract,
} from '../contracts'
import { OracleClients, marketOraclesToUpdateDataRequest, oracleCommitmentsLatest } from '../oracle'

export type MarketOracles = NonNullable<Awaited<ReturnType<typeof fetchMarketOracles>>>

/**
 * Fetches the market oracles for a given chain
 * @param chainId Chain ID {@link SupportedChainId}
 * @param publicClient Public Client
 * @param markets List of {@link SupportedMarket}
 */
export async function fetchMarketOracles(
  chainId: SupportedChainId = DefaultChain.id,
  publicClient: PublicClient,
  markets?: SupportedMarket[],
) {
  // TODO: Convert this to a Lens call?
  const marketsWithAddress = chainMarketsWithAddress(chainId, markets)
  const fetchMarketOracles = async (market: SupportedMarket, marketAddress: Address) => {
    const marketContract = getMarketContract(marketAddress, publicClient)
    const [riskParameter, oracleAddress] = await Promise.all([
      marketContract.read.riskParameter(),
      marketContract.read.oracle(),
    ])
    // Fetch oracle data
    const oracle = getOracleContract(oracleAddress, publicClient)
    const [global, oracleName] = await Promise.all([oracle.read.global(), oracle.read.name()])
    const [keeperOracle] = await oracle.read.oracles([global[0]])
    const keeperOracleContract = getKeeperOracleContract(keeperOracle, publicClient)
    const subOracleFactory = getKeeperFactoryContract(await keeperOracleContract.read.factory(), publicClient)

    const oracleFactory = getOracleFactoryContract(chainId, publicClient)
    const id = await oracleFactory.read.ids([oracleAddress])
    const [parameter, underlyingId, subOracleFactoryType, commitmentGasOracle, settlementGasOracle] = await Promise.all(
      [
        subOracleFactory.read.parameter(),
        subOracleFactory.read.toUnderlyingId([id]),
        subOracleFactory.read.factoryType(),
        subOracleFactory.read.commitmentGasOracle(),
        subOracleFactory.read.settlementGasOracle(),
      ],
    )

    return {
      market,
      marketAddress,
      oracleName,
      oracleFactoryAddress: oracleFactory.address,
      oracleAddress,
      subOracleFactoryAddress: subOracleFactory.address,
      subOracleAddress: keeperOracle,
      subOracleFactoryType,
      id,
      underlyingId,
      minValidTime: parameter.validFrom,
      staleAfter: riskParameter.staleAfter,
      commitmentGasOracle,
      settlementGasOracle,
    }
  }

  const marketData = await Promise.all(
    marketsWithAddress.map(({ market, marketAddress }) => {
      return fetchMarketOracles(market, marketAddress)
    }),
  )

  return marketData.reduce(
    (acc, market) => {
      acc[market.market] = market
      return acc
    },
    {} as SupportedMarketMapping<Awaited<ReturnType<typeof fetchMarketOracles>>>,
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
  makerTotal: bigint
  takerTotal: bigint
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
/**
 * Fetches market snapshots for a given address
 * @param publicClient Public Client
 * @param oracleClients Oracle Clients {@link OracleClients}
 * @param chainId Chain ID {@link SupportedChainId}
 * @param address Wallet Address
 * @param marketOracles {@link MarketOracles}
 * @param markets Subset of availalbe markets to support.
 * @param onError Error callback
 * @param onSuccess Success callback
 */
export async function fetchMarketSnapshots({
  publicClient,
  oracleClients,
  chainId,
  address,
  marketOracles,
  markets,
  onError,
  onSuccess,
}: {
  publicClient: PublicClient
  oracleClients: OracleClients
  chainId: SupportedChainId
  address: Address
  marketOracles?: MarketOracles
  markets?: SupportedMarket[]
  onError?: () => void
  onSuccess?: () => void
}) {
  if (!marketOracles) {
    marketOracles = await fetchMarketOracles(chainId, publicClient, markets)
  }
  const snapshotData = await fetchMarketSnapshotsAfterSettle({
    chainId,
    address,
    marketOracles,
    publicClient,
    oracleClients,
    onOracleError: onError,
    resetOracleError: onSuccess,
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
      try {
        const major = Big6Math.max(snapshot.position.long, snapshot.position.short)
        const nextMajor = Big6Math.max(snapshot.nextPosition.long, snapshot.nextPosition.short)
        const minor = Big6Math.min(snapshot.position.long, snapshot.position.short)
        const nextMinor = Big6Math.min(snapshot.nextPosition.long, snapshot.nextPosition.short)
        const fundingRates = calculateFundingAndInterestForSides(snapshot)
        const socializationFactor = !Big6Math.isZero(major)
          ? Big6Math.min(Big6Math.div(minor + snapshot.nextPosition.maker, major), Big6Math.ONE)
          : Big6Math.ONE
        const makerTotal = snapshot.pendingOrder.makerPos + snapshot.pendingOrder.makerNeg
        const takerPos = snapshot.pendingOrder.longPos + snapshot.pendingOrder.shortNeg
        const takerNeg = snapshot.pendingOrder.shortPos + snapshot.pendingOrder.longNeg
        const takerTotal = takerPos + takerNeg
        acc[snapshot.market] = {
          ...snapshot,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          pre: snapshotData.marketPre.find((pre) => pre.market === snapshot.market)!,
          major,
          majorSide: major === snapshot.position.long ? PositionSide.long : PositionSide.short,
          nextMajor,
          nextMajorSide: nextMajor === snapshot.nextPosition.long ? PositionSide.long : PositionSide.short,
          minor,
          minorSide: minor === snapshot.position.long ? PositionSide.long : PositionSide.short,
          nextMinor,
          nextMinorSide: nextMinor === snapshot.nextPosition.long ? PositionSide.long : PositionSide.short,
          fundingRate: fundingRates,
          socializationFactor,
          isSocialized: socializationFactor < Big6Math.ONE,
          makerTotal,
          takerTotal,
        }
        return acc
      } catch (e) {
        console.error('Error in snapshot', snapshot.market, address, e)
        return acc
      }
    },
    {} as { [key in SupportedMarket]?: MarketSnapshot },
  )
  const userSnapshots = snapshotData.user.reduce((acc, snapshot) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const pre = snapshotData.userPre.find((pre) => pre.market === snapshot.market)!
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const marketSnapshot = marketSnapshots[snapshot.market]!
    const marketPrice = marketSnapshot.global.latestPrice ?? 0n
    const latestPosition = snapshot.versions[0].valid ? snapshot.position : pre.position
    const nextPosition = snapshot.versions[0].valid ? snapshot.nextPosition : pre.nextPosition
    const side = sideFromPosition(latestPosition)
    const nextSide = sideFromPosition(nextPosition)
    const magnitude = side === PositionSide.none ? 0n : latestPosition[side]
    const nextMagnitude = nextSide === PositionSide.none ? 0n : nextPosition?.[nextSide] ?? 0n
    const priceUpdate = snapshot?.priceUpdate
    if (priceUpdate !== '0x') {
      console.error('Sync error', snapshot.market, priceUpdate, address)
    }
    const hasVersionError =
      !snapshot.versions[0].valid &&
      (pre.nextPosition.timestamp < marketSnapshot.pre.latestOracleVersion.timestamp ||
        pre.nextPosition.timestamp + 60n < BigInt(Math.floor(Date.now() / 1000)))

    if (hasVersionError && (magnitude !== 0n || nextMagnitude !== 0n) && magnitude !== nextMagnitude) {
      console.error('Version error', snapshot.market, address)
    }
    acc[snapshot.market] = {
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
  }, {} as SupportedMarketMapping<UserMarketSnapshot>)

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
  publicClient,
  oracleClients,
  onOracleError,
  resetOracleError,
}: {
  chainId: SupportedChainId
  address: Address
  marketOracles: MarketOracles
  publicClient: PublicClient
  oracleClients: OracleClients
  onOracleError?: () => void
  resetOracleError?: () => void
}) {
  const lensAddress = getContractAddress({ from: address, nonce: MaxUint256 })

  const priceCommitments = await oracleCommitmentsLatest({
    chainId,
    oracleClients: oracleClients,
    publicClient,
    requests: marketOraclesToUpdateDataRequest(Object.values(marketOracles)),
    onError: onOracleError,
    onSuccess: resetOracleError,
  })

  const marketAddresses = Object.values(marketOracles).map(({ marketAddress }) => marketAddress)

  const { result: lensRes } = await publicClient.simulateContract({
    address: lensAddress,
    abi: LensAbi,
    functionName: 'snapshot',
    args: [priceCommitments, marketAddresses, address],
    stateOverride: [
      {
        address: lensAddress,
        code: LensDeployedBytecode,
        balance: maxUint256,
      },
    ],
  })

  return {
    commitments: lensRes.commitmentStatus,
    updates: lensRes.updateStatus,
    market: lensRes.postUpdate.marketSnapshots.map((s) => {
      const market = addressToMarket(chainId, getAddress(s.marketAddress))
      return {
        ...s,
        market,
      }
    }),
    marketPre: lensRes.preUpdate.marketSnapshots.map((s) => {
      const market = addressToMarket(chainId, getAddress(s.marketAddress))
      return {
        ...s,
        market,
      }
    }),
    user: lensRes.postUpdate.marketAccountSnapshots.map((s, i) => {
      const market = addressToMarket(chainId, getAddress(s.marketAddress))
      return {
        ...s,
        market,
        priceUpdate: lensRes.updateStatus[i],
      }
    }),
    userPre: lensRes.preUpdate.marketAccountSnapshots.map((s) => {
      const market = addressToMarket(chainId, getAddress(s.marketAddress))
      return {
        ...s,
        market,
      }
    }),
  }
}

export async function fetchMarketSettlementFees({
  chainId,
  markets,
  marketOracles,
  publicClient,
}: {
  chainId: SupportedChainId
  markets: SupportedMarket[]
  marketOracles?: MarketOracles
  publicClient: PublicClient
}) {
  if (!marketOracles) marketOracles = await fetchMarketOracles(chainId, publicClient, markets)

  const gasPrice = await publicClient.getGasPrice()
  const commitmentCostCache = new Map<Address, bigint>()
  const settlementCostCache = new Map<Address, bigint>()
  const gasCosts = {} as SupportedMarketMapping<{ commitmentCost: bigint; settlementCost: bigint }>

  const costWithGasPrice = async (oracle: Address, value: bigint, publicClient: PublicClient) => {
    const { result } = await publicClient.simulateContract({
      address: oracle,
      abi: GasOracleAbi,
      functionName: 'cost',
      args: [value],
      maxFeePerGas: gasPrice,
    })

    // The gas oracle returns a 18 decimal value, so we need to convert it to 6 decimal places
    return Big18Math.toDecimals(result, Big6Math.FIXED_DECIMALS)
  }

  for (const market of markets) {
    const commitmentOracle = marketOracles[market].commitmentGasOracle
    const settlementOracle = marketOracles[market].settlementGasOracle

    // TODO: Make "value" dynamic
    const commitmentCost =
      commitmentCostCache.get(commitmentOracle) ?? (await costWithGasPrice(commitmentOracle, 1n, publicClient))
    const settlementCost =
      settlementCostCache.get(settlementOracle) ?? (await costWithGasPrice(settlementOracle, 0n, publicClient))

    if (commitmentOracle) commitmentCostCache.set(commitmentOracle, commitmentCost)
    if (settlementOracle) settlementCostCache.set(settlementOracle, settlementCost)

    gasCosts[market] = {
      commitmentCost: commitmentCost,
      settlementCost: settlementCost,
    }
  }

  return markets.reduce(
    (acc, market) => {
      const commitmentCost = commitmentCostCache.get(marketOracles[market].commitmentGasOracle) ?? 0n
      const settlementCost = settlementCostCache.get(marketOracles[market].settlementGasOracle) ?? 0n
      acc[market] = {
        commitmentCost,
        settlementCost,
        totalCost: commitmentCost + settlementCost,
      }
      return acc
    },
    {} as SupportedMarketMapping<{
      commitmentCost: bigint
      settlementCost: bigint
      totalCost: bigint
    }>,
  )
}
