import { sum } from './arrayUtils'

export type AccumulatorType = (typeof AccumulatorTypes)[number]['type']
export const AccumulatorTypes = [
  {
    type: 'offset',
    realizedKey: `collateral_subAccumulation_offset`,
    unrealizedKey: { maker: ``, long: ``, short: `` } as const,
  },
  {
    type: 'pnl',
    realizedKey: `collateral_subAccumulation_pnl`,
    unrealizedKey: { maker: `pnlMaker`, long: `pnlLong`, short: `pnlShort` } as const,
  },
  {
    type: 'funding',
    realizedKey: `collateral_subAccumulation_funding`,
    unrealizedKey: { maker: `fundingMaker`, long: `fundingLong`, short: `fundingShort` } as const,
  },
  {
    type: 'interest',
    realizedKey: `collateral_subAccumulation_interest`,
    unrealizedKey: { maker: `interestMaker`, long: `interestLong`, short: `interestShort` } as const,
  },
  {
    type: 'makerPositionFee',
    realizedKey: `collateral_subAccumulation_makerPositionFee`,
    unrealizedKey: { maker: `positionFeeMaker`, long: `positionFeeMaker`, short: `positionFeeMaker` } as const,
  },
  {
    type: 'makerExposure',
    realizedKey: `collateral_subAccumulation_makerExposure`,
    unrealizedKey: { maker: `positionFeeMaker`, long: `positionFeeMaker`, short: `positionFeeMaker` } as const,
  },
] as const

export type RealizedAccumulations = Record<(typeof AccumulatorTypes)[number]['type'], bigint>
export function accumulateRealized(
  payload: Record<(typeof AccumulatorTypes)[number]['realizedKey'], bigint | string>[],
) {
  return AccumulatorTypes.reduce((acc, { realizedKey, type }) => {
    const total = sum(payload.map((p) => BigInt(p[realizedKey])))
    return { ...acc, [type]: total }
  }, {} as RealizedAccumulations)
}

export type FeeAccumulatorType = (typeof FeeAccumulatorTypes)[number]['type']
export type RealizedFeeAccumulations = Record<(typeof FeeAccumulatorTypes)[number]['type'], bigint>
export const FeeAccumulatorTypes = [
  {
    type: 'trade',
    realizedKey: `fee_subAccumulation_trade`,
  },
  {
    type: 'settlement',
    realizedKey: `fee_subAccumulation_settlement`,
  },
  {
    type: 'additive',
    realizedKey: `fee_subAccumulation_additive`,
  },
  {
    type: 'triggerOrder',
    realizedKey: `fee_subAccumulation_triggerOrder`,
  },
  {
    type: 'liquidation',
    realizedKey: `fee_subAccumulation_liquidation`,
  },
] as const

export function accumulateRealizedFees(
  payload: Record<(typeof FeeAccumulatorTypes)[number]['realizedKey'], bigint | string>[],
) {
  return FeeAccumulatorTypes.reduce((acc, { realizedKey, type }) => {
    const total = sum(payload.map((p) => BigInt(p[realizedKey])))
    return { ...acc, [type]: total }
  }, {} as RealizedFeeAccumulations)
}
