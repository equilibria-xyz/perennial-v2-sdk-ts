// eslint-disable-next-line no-restricted-imports
import { formatUnits, parseEther } from 'viem'

import { WeiPerEther } from '../constants/units'

export const formatBig18 = (
  value: bigint = 0n,
  {
    numSigFigs = 2,
    useGrouping = true,
    minDecimals,
  }: { numSigFigs?: number; useGrouping?: boolean | undefined; minDecimals?: number } = {},
) => {
  return Intl.NumberFormat('en-US', {
    minimumSignificantDigits: numSigFigs,
    maximumSignificantDigits: numSigFigs,
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: minDecimals,

    useGrouping,
    // @ts-ignore
    roundingPriority: 'morePrecision',
  }).format(Big18Math.toUnsafeFloat(value))
}

// Formats an 18 decimal bigint as a USD price
export const formatBig18USDPrice = (
  value: bigint = 0n,
  { compact = false, fromUsdc = false }: { compact?: boolean; fromUsdc?: boolean } = {},
) => {
  if (value === 0n) {
    return '$0.00'
  }
  const valueToFormat = fromUsdc ? Number(formatUnits(value, 6)) : Big18Math.toUnsafeFloat(value)
  return Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: compact ? 'compact' : undefined,
    minimumFractionDigits: compact ? 1 : 2,
    maximumFractionDigits: compact ? 1 : 2,
    minimumSignificantDigits: compact ? 2 : 6,
    maximumSignificantDigits: compact ? 2 : 6,
    // @ts-ignore
    roundingPriority: 'morePrecision',
  }).format(valueToFormat)
}

// Formats an 18 decimal bigint as a USD price
export const formatBig18Percent = (value: bigint = 0n, { numDecimals = 2 }: { numDecimals?: number } = {}) => {
  return Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: numDecimals,
    maximumFractionDigits: numDecimals,
  }).format(Big18Math.toUnsafeFloat(value))
}
export class Big18Math {
  public static FIXED_DECIMALS = 18
  public static BASE = WeiPerEther
  public static ZERO = 0n
  public static ONE = 1n * Big18Math.BASE
  public static TWO = 2n * Big18Math.BASE

  public static mul(a: bigint, b: bigint): bigint {
    return (a * b) / this.BASE
  }

  public static div(a: bigint, b: bigint): bigint {
    return (a * this.BASE) / b
  }

  public static add(a: bigint, b: bigint): bigint {
    return a + b
  }

  public static sub(a: bigint, b: bigint): bigint {
    return a - b
  }

  public static isZero(a: bigint): boolean {
    return this.ZERO === a
  }

  public static eq(a: bigint, b: bigint): boolean {
    return a === b
  }

  public static abs(a: bigint): bigint {
    return a < 0n ? -a : a
  }

  public static max(a: bigint, b: bigint): bigint {
    return a >= b ? a : b
  }

  public static min(a: bigint, b: bigint): bigint {
    return a <= b ? a : b
  }

  public static cmp(a: bigint, b: bigint): number {
    return a === b ? 0 : a < b ? -1 : 1
  }

  public static fromFloatString(a: string): bigint {
    if (!a || a === '.') return 0n
    return parseEther(a.replace(/','/g, '') as `${number}`)
  }

  public static toFloatString(a: bigint): string {
    return formatUnits(a, Big18Math.FIXED_DECIMALS)
  }

  public static toUnsafeFloat(a: bigint): number {
    return parseFloat(Big18Math.toFloatString(a))
  }

  public static fromDecimals(amount: bigint, decimals: number): bigint {
    return amount * 10n ** BigInt(Big18Math.FIXED_DECIMALS - decimals)
  }
}
