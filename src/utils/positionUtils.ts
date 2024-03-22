import { Address, encodeErrorResult } from 'viem'

import { MarketAbi } from '..'
import { PositionSideV2, PositionStatus, SupportedAsset, SupportedChainId, interfaceFeeBps } from '../constants'
import { MaxUint256 } from '../constants/units'
import { MarketSnapshot, MarketSnapshots, UserMarketSnapshot } from '../lib'
import { Big6Math, formatBig6Percent } from './big6Utils'
import { Big18Math } from './big18Utils'
import { Day, Hour, Year } from './timeUtils'

export const UpdateNoOp = MaxUint256

export function magnitude(maker: bigint | string, long: bigint | string, short: bigint | string) {
  return Big6Math.max(BigInt(maker), Big6Math.max(BigInt(long), BigInt(short)))
}

export function side2(maker: bigint | string, long: bigint | string, short: bigint | string): PositionSideV2 {
  if (BigInt(maker) > 0n) return PositionSideV2.maker
  if (BigInt(long) > 0n) return PositionSideV2.long
  if (BigInt(short) > 0n) return PositionSideV2.short

  return PositionSideV2.none
}

export function efficiency(maker: bigint, major: bigint) {
  return major > 0n ? Big6Math.min(Big6Math.div(maker, major), Big6Math.ONE) : Big6Math.ONE
}

// LiquidationPrice = ((position * abs(price) + collateral) / (position * (1 + maintenanceRatio))
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

export const calcLeverage = (price: bigint, position: bigint, collateral: bigint) => {
  if (Big6Math.isZero(collateral)) return 0n
  return Big6Math.div(calcNotional(position, price), collateral)
}

export const calcMakerExposure = (userMaker: bigint, globalMaker: bigint, globalLong: bigint, globalShort: bigint) => {
  if (globalMaker === 0n) return 0n

  return Big6Math.div(Big6Math.mul(userMaker, globalShort - globalLong), globalMaker)
}

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

export const getPositionFromSelectedMarket = ({
  isMaker,
  userMarketSnapshots,
  selectedMarket,
  selectedMakerMarket,
}: {
  isMaker?: boolean
  userMarketSnapshots?: MarketSnapshots['user']
  selectedMarket: SupportedAsset
  selectedMakerMarket: SupportedAsset
}) => {
  if (!userMarketSnapshots) return undefined
  if (isMaker) {
    // TODO: we need to check also if the user has collateral
    const userMarketSnapshot = userMarketSnapshots[selectedMakerMarket]
    return [userMarketSnapshot.side, userMarketSnapshot.nextSide].includes(PositionSideV2.maker)
      ? userMarketSnapshot
      : undefined
  }
  const userMarketSnapshot = userMarketSnapshots[selectedMarket]
  return [PositionSideV2.long, PositionSideV2.short].includes(userMarketSnapshot.side) ||
    [PositionSideV2.long, PositionSideV2.short].includes(userMarketSnapshot.nextSide)
    ? userMarketSnapshot
    : undefined
}

export function getSideFromPosition(position?: UserMarketSnapshot['position']) {
  if (!position) return PositionSideV2.none
  return position.maker > 0n
    ? PositionSideV2.maker
    : position.long > 0n
      ? PositionSideV2.long
      : position.short > 0n
        ? PositionSideV2.short
        : PositionSideV2.none
}

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

  const majorPosition = majorSide === PositionSideV2.long ? long : short
  const minorPosition = majorSide === PositionSideV2.long ? short : long

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

export const calcSkew = (marketSnapshot?: MarketSnapshot) => {
  if (!marketSnapshot) return undefined
  const {
    nextPosition: { long, short },
    riskParameter: { virtualTaker },
  } = marketSnapshot
  const nextMajor = long > short ? long : short
  const skew = nextMajor + virtualTaker > 0n ? Big6Math.div(long - short, nextMajor + virtualTaker) : 0n

  const totalTaker = long + short
  const longSkew = totalTaker > 0n ? Big6Math.div(long, totalTaker) : 0n
  const shortSkew = totalTaker > 0n ? Big6Math.div(short, totalTaker) : 0n
  return {
    skew,
    longSkew,
    shortSkew,
  }
}

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

export const calcTradeFee = ({
  positionDelta,
  marketSnapshot,
  isMaker,
  direction,
}: {
  positionDelta: bigint
  marketSnapshot?: MarketSnapshot
  isMaker: boolean
  direction: PositionSideV2
}) => {
  const noValue = { total: 0n, impactFee: 0n, skewFee: 0n, feeBasisPoints: 0n }
  if (!marketSnapshot || !positionDelta) return noValue

  const {
    riskParameter: { takerFee, takerSkewFee, takerImpactFee, makerFee, makerImpactFee, virtualTaker },
    nextPosition: { long, short, maker },
    global: { latestPrice },
  } = marketSnapshot

  const notional = calcNotional(positionDelta, latestPrice)

  if (isMaker) {
    const major = Big6Math.max(long, short)
    const minor = Big6Math.min(long, short)
    const currentUtilization = maker + minor !== 0n ? Big6Math.div(major, maker + minor) : 0n
    const newUtilization =
      maker + minor + positionDelta !== 0n ? Big6Math.div(major, maker + minor + positionDelta) : 0n
    const utilizationDelta = newUtilization - currentUtilization
    const impactFee = Big6Math.mul(makerImpactFee, utilizationDelta)
    const total = Big6Math.max(Big6Math.mul(notional, impactFee + makerFee), 0n)
    const feeBasisPoints = !Big6Math.isZero(total) ? Big6Math.div(total, notional) : makerFee

    return { impactFee, total, skewFee: undefined, feeBasisPoints }
  }

  const adjustedLong = direction === PositionSideV2.long ? long + positionDelta : long
  const adjustedShort = direction === PositionSideV2.short ? short + positionDelta : short
  const major = Big6Math.max(adjustedLong, adjustedShort)
  const calculatedSkew = calcSkew(marketSnapshot)
  const currentSkew = calculatedSkew?.skew ?? 0n
  const skewDenominator = major + virtualTaker
  const newSkew = skewDenominator !== 0n ? Big6Math.div(adjustedLong - adjustedShort, skewDenominator) : 0n
  const skewDelta = Big6Math.abs(newSkew - currentSkew)
  const absSkewDelta = Big6Math.abs(newSkew) - Big6Math.abs(currentSkew)
  const skewFee = Big6Math.mul(takerSkewFee, skewDelta)
  const impactFee = Big6Math.mul(takerImpactFee, absSkewDelta)
  const total = Big6Math.max(Big6Math.mul(notional, skewFee + impactFee + takerFee), 0n)
  const feeBasisPoints = !Big6Math.isZero(total) ? Big6Math.div(total, notional) : takerFee

  return { skewFee, impactFee, total, feeBasisPoints }
}

export function calcPriceImpactFromTradeFee({
  totalTradeFee,
  positionFee,
}: {
  totalTradeFee: bigint
  positionFee: bigint
}) {
  return Big6Math.mul(totalTradeFee, Big6Math.ONE - positionFee)
}

export function calcEstExecutionPrice({
  oraclePrice,
  calculatedFee,
  positionFee,
  orderDirection,
  positionDelta,
}: {
  positionDelta: bigint
  oraclePrice: bigint
  calculatedFee: bigint
  positionFee: bigint // marketSnapshot.parameter.positionFee
  orderDirection: PositionSideV2.long | PositionSideV2.short
}) {
  const notional = calcNotional(positionDelta, oraclePrice)
  const priceImpact = calcPriceImpactFromTradeFee({ totalTradeFee: calculatedFee, positionFee })
  const priceImpactPercentage = notional > 0n ? Big6Math.div(priceImpact, calcNotional(positionDelta, oraclePrice)) : 0n
  const fee = Big6Math.div(priceImpact, positionDelta)

  return {
    priceImpact: fee,
    total: orderDirection === PositionSideV2.long ? oraclePrice + fee : oraclePrice - fee,
    priceImpactPercentage,
    nonPriceImpactFee: calculatedFee - priceImpact,
  }
}

export function calcInterfaceFee({
  positionStatus = PositionStatus.resolved,
  latestPrice,
  chainId,
  positionDelta,
  side,
  referrerInterfaceFeeDiscount,
  referrerInterfaceFeeShare,
}: {
  positionStatus?: PositionStatus
  latestPrice: bigint
  chainId: SupportedChainId
  positionDelta: bigint
  side: PositionSideV2
  referrerInterfaceFeeDiscount: bigint
  referrerInterfaceFeeShare: bigint
}) {
  const feeInfo = interfaceFeeBps[chainId]
  if (!latestPrice || !positionDelta || !feeInfo || positionStatus === PositionStatus.failed) {
    return {
      interfaceFeeBps: feeInfo?.feeAmount[PositionSideV2.none] ?? 0n,
      interfaceFee: 0n,
      referrerFee: 0n,
      ecosystemFee: 0n,
    }
  }

  const notional = calcNotional(positionDelta, latestPrice)
  const feeAmount = feeInfo.feeAmount[side]
  const discountedFeeAmount = feeAmount - Big6Math.mul(feeAmount, referrerInterfaceFeeDiscount)
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
}: {
  chainId: SupportedChainId
  positionDelta: bigint
  marketSnapshot?: MarketSnapshot
  direction: PositionSideV2
  positionStatus?: PositionStatus
  referrerInterfaceFeeDiscount: bigint
}) {
  const tradeFee = calcTradeFee({
    positionDelta,
    marketSnapshot,
    isMaker: direction === PositionSideV2.maker,
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
  })

  const settlementFee = positionDelta !== 0n && marketSnapshot ? marketSnapshot.parameter.settlementFee : 0n

  return {
    total: tradeFee.total + interfaceFee.interfaceFee + settlementFee,
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
  if (!margin) return 10
  const marginMaxLeverage = Big6Math.div(Big6Math.ONE, margin)
  const minCollateralForFullRange = Big6Math.mul(minMargin ?? 0n, marginMaxLeverage)
  const collateralMaxLeverage = !!collateral
    ? Big6Math.div(Big6Math.mul(collateral, marginMaxLeverage), minCollateralForFullRange)
    : marginMaxLeverage

  const maxLeverage = Big6Math.min(marginMaxLeverage, collateralMaxLeverage)

  const flooredLeverage = Math.floor(Big6Math.toUnsafeFloat(Big6Math.min(maxLeverage, Big6Math.ONE * 100n)))
  // Round to nearest 5x
  return flooredLeverage < 5 ? flooredLeverage : Math.floor(flooredLeverage / 5) * 5
}
