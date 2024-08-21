import { Address, Hash, PublicClient, TransactionReceipt, encodeErrorResult, parseEventLogs } from 'viem'

import { MarketAbi, OracleAbi } from '..'
import { PositionSide, PositionStatus, SupportedChainId, SupportedMarket } from '../constants'
import { MaxUint256 } from '../constants/units'
import { MarketSnapshot, MarketSnapshots, UserMarketSnapshot } from '../lib'
import { Big6Math, formatBig6Percent } from './big6Utils'
import { Big18Math } from './big18Utils'
import { Day, Hour, Year } from './timeUtils'

export const UpdateNoOp = MaxUint256

export function magnitude(maker: bigint | string, long: bigint | string, short: bigint | string) {
  return Big6Math.max(BigInt(maker), Big6Math.max(BigInt(long), BigInt(short)))
}

export function side(maker: bigint | string, long: bigint | string, short: bigint | string): PositionSide {
  if (BigInt(maker) > 0n) return PositionSide.maker
  if (BigInt(long) > 0n) return PositionSide.long
  if (BigInt(short) > 0n) return PositionSide.short

  return PositionSide.none
}

export function orderSize(maker: bigint | string, long: bigint | string, short: bigint | string) {
  return BigInt(maker) + BigInt(long) + BigInt(short)
}

export function efficiency(maker: bigint, major: bigint) {
  return major > 0n ? Big6Math.min(Big6Math.div(maker, major), Big6Math.ONE) : Big6Math.ONE
}

// LiquidationPrice = ((position * abs(price) + collateral) / (position * (1 + maintenanceRatio))
/**
 * Calculates the liquidation price for a position
 * @param params - { marketSnapshot, collateral, position, limitPrice }
 * @returns Liquidation price for long and short positions
 */
export const calcLiquidationPrice = ({
  marketSnapshot,
  collateral,
  position,
  limitPrice,
}: {
  marketSnapshot?: MarketSnapshot
  collateral?: bigint
  position?: bigint
  limitPrice?: bigint
}) => {
  const noValue = { long: 0n, short: 0n }
  if (!collateral || !marketSnapshot || !position) return noValue

  const price = limitPrice ? limitPrice : marketSnapshot.global.latestPrice

  const notional = calcNotional(position, price)
  const maintenance = Big6Math.mul(notional, marketSnapshot.riskParameter.maintenance)

  // If maintenance is less than minMaintenance, then the liquidation calc is slightly simplified:
  // LiqPrice = ((minMaintenance - collateral) / (position * (long ? 1 : -1)) + price
  if (maintenance < marketSnapshot.riskParameter.minMaintenance) {
    const minMaintenanceLiqPriceLong = Big6Math.abs(
      Big6Math.div(marketSnapshot.riskParameter.minMaintenance - collateral, position) + price,
    )
    const minMaintenanceLiqPriceShort = Big6Math.abs(
      Big6Math.div(marketSnapshot.riskParameter.minMaintenance - collateral, position * -1n) + price,
    )
    return { long: minMaintenanceLiqPriceLong, short: minMaintenanceLiqPriceShort }
  }

  const longNumerator = notional - collateral
  const longDenominator = Big6Math.mul(position, marketSnapshot.riskParameter.maintenance - Big6Math.ONE)
  const long = Big6Math.abs(Big6Math.div(longNumerator, longDenominator))

  const shortNumerator = collateral + notional
  const shortDenominator = Big6Math.mul(position, marketSnapshot.riskParameter.maintenance + Big6Math.ONE)
  const short = Big6Math.abs(Big6Math.div(shortNumerator, shortDenominator))

  return { long, short }
}

/**
 * Calculates the leverage for a position
 * @param price - Current price
 * @param position - Position size
 * @param collateral - Collateral
 * @returns Leverage
 */
export const calcLeverage = (price: bigint, position: bigint, collateral: bigint) => {
  if (Big6Math.isZero(collateral)) return 0n
  return Big6Math.div(calcNotional(position, price), collateral)
}

export const calcMakerExposure = (userMaker: bigint, globalMaker: bigint, globalLong: bigint, globalShort: bigint) => {
  if (globalMaker === 0n) return 0n

  return Big6Math.div(Big6Math.mul(userMaker, globalShort - globalLong), globalMaker)
}
/**
 * Returns whether a position is closed or inactive
 * @param status
 * @returns True if the position is closed or resolved
 */
export const closedOrResolved = (status?: PositionStatus) =>
  status && [PositionStatus.closed, PositionStatus.resolved].includes(status)

export const calcNotional = (position: bigint, price: bigint) => {
  return Big6Math.abs(Big6Math.mul(position, price))
}

export const calcMakerStats = ({
  funding,
  interest,
  positionFee,
  positionSize,
  collateral,
}: {
  funding: bigint
  interest: bigint
  positionFee: bigint
  positionSize: bigint
  collateral: bigint
}) => {
  if (collateral === 0n) return { fundingAPR: 0n, interestAPR: 0n, positionFeeAPR: 0n }
  const fundingAccumulated = Big6Math.mul(funding, positionSize)
  const interestAccumulated = Big6Math.mul(interest, positionSize)
  const positionFeeAccumulated = Big6Math.mul(positionFee, positionSize)

  return {
    fundingAPR: Big6Math.div(fundingAccumulated * 52n, collateral),
    interestAPR: Big6Math.div(interestAccumulated * 52n, collateral),
    positionFeeAPR: Big6Math.div(positionFeeAccumulated * 52n, collateral),
  }
}

/**
 * Gets a user's position from a selected market
 */
export const getPositionFromSelectedMarket = ({
  isMaker,
  userMarketSnapshots,
  selectedMarket,
  selectedMakerMarket,
}: {
  isMaker?: boolean
  userMarketSnapshots?: MarketSnapshots['user']
  selectedMarket: SupportedMarket
  selectedMakerMarket: SupportedMarket
}) => {
  if (!userMarketSnapshots) return undefined
  if (isMaker) {
    // TODO: we need to check also if the user has collateral
    const userMarketSnapshot = userMarketSnapshots[selectedMakerMarket]
    return [userMarketSnapshot.side, userMarketSnapshot.nextSide].includes(PositionSide.maker)
      ? userMarketSnapshot
      : undefined
  }
  const userMarketSnapshot = userMarketSnapshots[selectedMarket]
  return [PositionSide.long, PositionSide.short].includes(userMarketSnapshot.side) ||
    [PositionSide.long, PositionSide.short].includes(userMarketSnapshot.nextSide)
    ? userMarketSnapshot
    : undefined
}

export function getSideFromPosition(position?: UserMarketSnapshot['position']) {
  if (!position) return PositionSide.none
  return position.maker > 0n
    ? PositionSide.maker
    : position.long > 0n
      ? PositionSide.long
      : position.short > 0n
        ? PositionSide.short
        : PositionSide.none
}

/**
 * Helper to get the status of a position
 * @param magnitude
 * @param nextMagnitude
 * @param collateral
 * @param hasVersionError
 * @param priceUpdate
 * @returns Position status {@link PositionStatus}
 */
export function getStatusForSnapshot(
  magnitude: bigint,
  nextMagnitude: bigint,
  collateral: bigint,
  hasVersionError: boolean,
  priceUpdate?: Address,
): PositionStatus {
  if (hasVersionError && magnitude !== nextMagnitude) return PositionStatus.failed
  if (priceUpdate === encodeErrorResult({ abi: MarketAbi, errorName: 'MarketInsufficientMarginError' }))
    return PositionStatus.notMargined
  if (priceUpdate !== '0x') return PositionStatus.syncError
  if (Big6Math.isZero(magnitude) && !Big6Math.isZero(nextMagnitude)) return PositionStatus.opening
  if (!Big6Math.isZero(magnitude) && Big6Math.eq(magnitude, nextMagnitude)) return PositionStatus.open
  if (!Big6Math.isZero(magnitude) && Big6Math.isZero(nextMagnitude)) return PositionStatus.closing
  if (!Big6Math.isZero(magnitude) && !Big6Math.eq(magnitude, nextMagnitude)) return PositionStatus.pricing
  if (Big18Math.isZero(magnitude) && Big18Math.isZero(nextMagnitude) && !Big18Math.isZero(collateral))
    return PositionStatus.closed
  return PositionStatus.resolved
}

/**
 * Calculates liquidity for a market
 * @param marketSnapshot
 * @returns Available and total liquidity for long and short positions
 */
export function calcTakerLiquidity(marketSnapshot: MarketSnapshot) {
  const {
    nextPosition: { long, short, maker },
    riskParameter: { efficiencyLimit },
  } = marketSnapshot
  const makerEfficiencyLimit = Big6Math.div(maker, efficiencyLimit)
  const availableLongLiquidity = Big6Math.min(short + maker - long, makerEfficiencyLimit - long)
  const totalLongLiquidity = Big6Math.min(short + maker, makerEfficiencyLimit)
  const availableShortLiquidity = Big6Math.min(long + maker - short, makerEfficiencyLimit - short)
  const totalShortLiquidity = Big6Math.min(long + maker, makerEfficiencyLimit)

  return {
    availableLongLiquidity: Big6Math.max(availableLongLiquidity, 0n),
    totalLongLiquidity,
    availableShortLiquidity: Big6Math.max(availableShortLiquidity, 0n),
    totalShortLiquidity,
  }
}

export function calcLpExposure(marketSnapshot?: MarketSnapshot) {
  if (!marketSnapshot) return undefined
  const {
    majorSide,
    minorSide,
    nextPosition: { long, short, maker },
  } = marketSnapshot

  const majorPosition = majorSide === PositionSide.long ? long : short
  const minorPosition = majorSide === PositionSide.long ? short : long

  const lpExposure = maker > 0n ? Big6Math.div(majorPosition - minorPosition, maker) : 0n

  return {
    lpExposure: lpExposure,
    formattedLpExposure: formatBig6Percent(lpExposure, { numDecimals: 2 }),
    exposureSide: minorSide,
  }
}

export const isActivePosition = (userMarketSnapshot?: UserMarketSnapshot) => {
  return userMarketSnapshot?.status !== PositionStatus.resolved
}

/**
 * Calculates market skew
 * @param marketSnapshot
 * @returns Skew, long skew, and short skew
 */
export const calcSkew = (marketSnapshot?: MarketSnapshot) => {
  if (!marketSnapshot) return undefined
  const {
    nextPosition: { long, short },
  } = marketSnapshot
  const nextMajor = long > short ? long : short
  const skew = nextMajor > 0n ? Big6Math.div(long - short, nextMajor) : 0n

  const totalTaker = long + short
  const longSkew = totalTaker > 0n ? Big6Math.div(long, totalTaker) : 0n
  const shortSkew = totalTaker > 0n ? Big6Math.div(short, totalTaker) : 0n
  return {
    skew,
    longSkew,
    shortSkew,
  }
}

/**
 * Calculates the funding rates for a position organized by time period
 * @param fundingRate
 * @returns Funding rates for hourly, 8-hour, daily, and yearly periods
 */
export const calcFundingRates = (fundingRate: bigint = 0n) => {
  const rate = Big6Math.div(fundingRate, Year)
  const hourlyFunding = Big6Math.mul(rate, Hour)
  const eightHourFunding = Big6Math.mul(rate, Hour * 8n)
  const dailyFunding = Big6Math.mul(rate, Day)
  return {
    hourlyFunding,
    eightHourFunding,
    dailyFunding,
    yearlyFunding: fundingRate,
  }
}

export type TradeFeeInfo = {
  tradeFee: bigint
  tradeImpact: bigint
  feeBasisPoints: bigint
  proportionalFee: bigint
  linearFee: bigint
  adiabaticFee: bigint
}

/**
 * Calculates the trade fee for a position
 * @param positionDelta - Position change
 * @param marketSnapshot - Market snapshot
 * @param isMaker - Is maker
 * @param direction - Position direction
 * @param referralFee - Referral fee
 * @returns Trade fee info
 */
export const calcTradeFee = ({
  positionDelta,
  marketSnapshot,
  isMaker,
  direction,
  referralFee = 0n,
  usePreGlobalPosition = false,
}: {
  positionDelta: bigint
  marketSnapshot: MarketSnapshot
  isMaker: boolean
  direction: PositionSide
  referralFee?: bigint
  usePreGlobalPosition?: boolean
}): TradeFeeInfo => {
  let tradeFeeInfo = {
    tradeFee: 0n,
    tradeImpact: 0n,
    feeBasisPoints: 0n,
    proportionalFee: 0n,
    linearFee: 0n,
    adiabaticFee: 0n,
  }
  if (!marketSnapshot || !positionDelta) return tradeFeeInfo

  const {
    riskParameter: { takerFee, makerFee },
    nextPosition: { long, short },
    pre: {
      position: { long: preLong, short: preShort },
    },
    parameter: { positionFee },
    global: { latestPrice },
    makerTotal,
    takerTotal,
  } = marketSnapshot

  const notional = calcNotional(positionDelta, latestPrice)

  if (isMaker) {
    const adjustedMakerTotal = makerTotal + Big6Math.abs(positionDelta)
    const makerProportionalFeeRate = Big6Math.div(
      Big6Math.mul(makerFee.proportionalFee, adjustedMakerTotal),
      makerFee.scale,
    )

    const makerProportionalFee = Big6Math.mul(notional, makerProportionalFeeRate)
    const makerLinearFee = Big6Math.mul(notional, makerFee.linearFee)
    const tradeFee = makerLinearFee + makerProportionalFee
    const feeBasisPoints = !Big6Math.isZero(tradeFee) ? Big6Math.div(tradeFee, notional) : 0n

    tradeFeeInfo = {
      tradeFee,
      tradeImpact: 0n,
      feeBasisPoints,
      proportionalFee: makerProportionalFee,
      linearFee: makerLinearFee,
      adiabaticFee: 0n,
    }

    return tradeFeeInfo
  }

  const globalLong = usePreGlobalPosition ? preLong : long
  const globalShort = usePreGlobalPosition ? preShort : short
  const adjustedLong = direction === PositionSide.long ? globalLong + positionDelta : globalLong
  const adjustedShort = direction === PositionSide.short ? globalShort + positionDelta : globalShort
  const currentSkew = globalLong - globalShort
  const newSkew = adjustedLong - adjustedShort
  const takerAdiabaticFeeNumerator = Big6Math.mul(takerFee.adiabaticFee, newSkew + currentSkew)
  const signedNotional = Big6Math.mul(positionDelta * (direction === PositionSide.short ? -1n : 1n), latestPrice)
  const takerAdiabaticFee = Big6Math.div(Big6Math.mul(signedNotional, takerAdiabaticFeeNumerator), takerFee.scale * 2n)

  const adjustedTakerTotal = takerTotal + Big6Math.abs(positionDelta)
  const takerProportionalFeeNumerator = Big6Math.mul(takerFee.proportionalFee, adjustedTakerTotal)
  const takerProportionalFee = Big6Math.div(Big6Math.mul(notional, takerProportionalFeeNumerator), takerFee.scale)

  const takerLinearFee = Big6Math.mul(notional, takerFee.linearFee)
  const subtractiveFee = Big6Math.mul(takerLinearFee, referralFee)

  const marketFee = Big6Math.mul(takerLinearFee - subtractiveFee, positionFee)
  const tradeFee = subtractiveFee + marketFee
  const feeBasisPoints = !Big6Math.isZero(tradeFee) ? Big6Math.div(tradeFee, notional) : 0n
  const tradeImpact = takerLinearFee + takerProportionalFee + takerAdiabaticFee - tradeFee

  tradeFeeInfo = {
    tradeFee,
    tradeImpact,
    feeBasisPoints,
    proportionalFee: takerProportionalFee,
    linearFee: takerLinearFee,
    adiabaticFee: takerAdiabaticFee,
  }
  return tradeFeeInfo
}

export function calcPriceImpactFromTradeFee({
  tradeImpact,
  positionDelta,
}: {
  tradeImpact: bigint
  positionDelta: bigint
}) {
  return positionDelta !== 0n ? Big6Math.div(tradeImpact, Big6Math.abs(positionDelta)) : 0n
}

export function calcEstExecutionPrice({
  oraclePrice,
  orderDirection,
  positionDelta,
  marketSnapshot,
  referralFee,
}: {
  positionDelta: bigint
  oraclePrice: bigint
  orderDirection: PositionSide.long | PositionSide.short
  marketSnapshot: MarketSnapshot
  referralFee?: bigint
}) {
  const notional = calcNotional(positionDelta, oraclePrice)
  const tradeFeeData = calcTradeFee({
    positionDelta,
    isMaker: false,
    direction: orderDirection,
    marketSnapshot,
    referralFee,
  })

  const priceImpact = calcPriceImpactFromTradeFee({
    positionDelta,
    tradeImpact: tradeFeeData.tradeImpact,
  })

  const priceImpactPercentage = notional !== 0n ? Big6Math.div(tradeFeeData.tradeImpact, notional) : 0n
  const directionalPriceImpact = positionDelta > 0n ? priceImpact : -priceImpact

  return {
    priceImpact,
    total:
      orderDirection === PositionSide.long
        ? oraclePrice + directionalPriceImpact
        : oraclePrice - directionalPriceImpact,
    priceImpactPercentage,
    nonPriceImpactFee: tradeFeeData.tradeFee - priceImpact,
  }
}

export function calcInterfaceFee({
  positionStatus = PositionStatus.resolved,
  latestPrice,
  positionDelta,
  referrerInterfaceFeeDiscount,
  referrerInterfaceFeeShare,
  interfaceFeeBps,
}: {
  positionStatus?: PositionStatus
  latestPrice: bigint
  chainId: SupportedChainId
  positionDelta: bigint
  side: PositionSide
  referrerInterfaceFeeDiscount: bigint
  referrerInterfaceFeeShare: bigint
  interfaceFeeBps?: bigint
}) {
  if (!latestPrice || !positionDelta || !interfaceFeeBps || positionStatus === PositionStatus.failed) {
    return {
      interfaceFeeBps: interfaceFeeBps ?? 0n,
      interfaceFee: 0n,
      referrerFee: 0n,
      ecosystemFee: 0n,
    }
  }

  const notional = calcNotional(positionDelta, latestPrice)
  const discountedFeeAmount = interfaceFeeBps - Big6Math.mul(interfaceFeeBps, referrerInterfaceFeeDiscount)
  const discountedInterfaceFee = Big6Math.mul(notional, discountedFeeAmount)
  const referrerFee = Big6Math.mul(discountedInterfaceFee, referrerInterfaceFeeShare)
  const ecosystemFee = discountedInterfaceFee - referrerFee

  return {
    interfaceFeeBps: discountedFeeAmount,
    interfaceFee: discountedInterfaceFee,
    referrerFee,
    ecosystemFee,
  }
}

// Returns the tradeFee + interfaceFee + settlementFee
export function calcTotalPositionChangeFee({
  positionStatus = PositionStatus.resolved,
  chainId,
  marketSnapshot,
  positionDelta,
  direction,
  referrerInterfaceFeeDiscount,
  interfaceFeeBps,
}: {
  chainId: SupportedChainId
  positionDelta: bigint
  marketSnapshot: MarketSnapshot
  direction: PositionSide
  positionStatus?: PositionStatus
  referrerInterfaceFeeDiscount: bigint
  interfaceFeeBps?: bigint
}) {
  const tradeFee = calcTradeFee({
    positionDelta,
    marketSnapshot,
    isMaker: direction === PositionSide.maker,
    direction,
  })
  const interfaceFee = calcInterfaceFee({
    positionStatus,
    latestPrice: marketSnapshot?.global.latestPrice ?? 0n,
    chainId,
    positionDelta,
    side: direction,
    referrerInterfaceFeeDiscount,
    referrerInterfaceFeeShare: 0n,
    interfaceFeeBps,
  })

  const settlementFee = positionDelta !== 0n && marketSnapshot ? marketSnapshot.parameter.settlementFee : 0n

  return {
    total: tradeFee.tradeFee + tradeFee.tradeImpact + interfaceFee.interfaceFee + settlementFee,
    tradeFee,
    interfaceFee,
    settlementFee,
  }
}

export const isFailedClose = (position?: UserMarketSnapshot) => {
  if (!position) return false
  return (
    position.status === PositionStatus.failed &&
    !Big6Math.isZero(position.magnitude) &&
    Big6Math.isZero(position.nextMagnitude)
  )
}

/* MaxLeverage is the minimum of the following:
  min(100x, 1/margin, collateral/minCollateralForFullRange * 1/margin)
*/
export const calcMaxLeverage = ({
  margin,
  minMargin,
  collateral,
}: { margin?: bigint; minMargin?: bigint; collateral?: bigint } = {}) => {
  if (!margin) return Big6Math.ONE * 10n
  const marginMaxLeverage = Big6Math.div(Big6Math.ONE, margin)
  const minCollateralForFullRange = Big6Math.mul(minMargin ?? 0n, marginMaxLeverage)
  const collateralMaxLeverage = !!collateral
    ? Big6Math.div(Big6Math.mul(collateral, marginMaxLeverage), minCollateralForFullRange)
    : marginMaxLeverage

  const maxLeverage = Big6Math.min(marginMaxLeverage, collateralMaxLeverage)

  return Big6Math.max(maxLeverage, Big6Math.ONE)
}

export const calcExecutionPriceWithImpact = ({
  notional,
  offset,
  side,
  size,
}: {
  notional: bigint
  offset: bigint
  side: PositionSide
  size: bigint
}) => {
  let numerator = notional
  if (side === PositionSide.long) numerator = numerator - (size < 0n ? -offset : offset)
  if (side === PositionSide.short) numerator = numerator + (size < 0n ? -offset : offset)
  return size !== 0n ? Big6Math.abs(Big6Math.div(numerator, size)) : 0n
}

export async function waitForOrderSettlement({
  publicClient,
  txHash,
  timeoutMs = 30000,
  onSettlement,
}: {
  publicClient: PublicClient
  txHash: Hash
  timeoutMs: number
  onSettlement?: (txReceipt?: TransactionReceipt) => void
}): Promise<TransactionReceipt> {
  return new Promise(async (resolve, reject) => {
    let timeoutId: NodeJS.Timeout
    let unwatch: (() => void) | undefined

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (unwatch) unwatch()
    }

    try {
      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

      const logs = parseEventLogs({ logs: receipt.logs, abi: OracleAbi, eventName: 'OracleProviderVersionRequested' })
      const oracleVersionRequestedEvent = logs.at(0)
      if (!oracleVersionRequestedEvent) {
        throw new Error('OracleVersionRequested event not found')
      }

      const { version } = oracleVersionRequestedEvent.args

      unwatch = publicClient.watchContractEvent({
        address: oracleVersionRequestedEvent.address,
        abi: OracleAbi,
        eventName: 'OracleProviderVersionFulfilled',
        onLogs: (logs) => {
          const versionFulfilledEvent = logs.at(0)
          if (versionFulfilledEvent?.args?.version?.timestamp === version) {
            onSettlement?.(receipt)
            cleanup()
            resolve(receipt)
          }
        },
      })

      timeoutId = setTimeout(() => {
        cleanup()
        reject(new Error('Timeout waiting for OracleVersionFulfilled event'))
      }, timeoutMs)
    } catch (error) {
      cleanup()
      reject(error)
    }
  })
}
