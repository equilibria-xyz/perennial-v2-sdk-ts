import { Address, Hex, getAddress, zeroHash } from 'viem'
import { arbitrum, arbitrumSepolia, base } from 'viem/chains'

import { Big6Math } from '../utils'
import { notEmpty } from '../utils/arrayUtils'
import {
  centimilliPowerTwoTransform,
  centimilliPowerTwoUntransform,
  linearTransform,
  microPowerTwoTransform,
  microPowerTwoUntransform,
} from '../utils/payoffUtils'
import { SupportedChainId } from './network'

export enum SupportedMarket {
  btc = 'btc',
  eth = 'eth',
  arb = 'arb',
  sol = 'sol',
  matic = 'matic',
  tia = 'tia',
  rlb = 'rlb',
  link = 'link',
  bnb = 'bnb',
  xrp = 'xrp',
  msqBTC = 'btc²',
  cmsqETH = 'eth²',
  jup = 'jup',

  unknown = 'unknown',
}

export enum QuoteCurrency {
  usd = 'USDC',
}

export enum PositionSide {
  maker = 'maker',
  long = 'long',
  short = 'short',
  none = 'none',
}

export enum PositionStatus {
  open = 'open',
  closed = 'closed',
  opening = 'opening',
  closing = 'closing',
  pricing = 'pricing',
  resolved = 'noValue',
  failed = 'failed',
  syncError = 'syncError',
  notMargined = 'notMargined',
}

export type MarketMetadataType = {
  [market in SupportedMarket]: {
    name: string
    symbol: string
    displayDecimals: number
    tvTicker: string
    baseCurrency: SupportedMarket
    quoteCurrency: QuoteCurrency
    providerId: Hex
    pythFeedId: string // TODO(arjun): remove PythFeedId if possible
    transform: (value: bigint) => bigint
    untransform: (value: bigint) => bigint
  }
}

export const MarketMetadata: MarketMetadataType = {
  [SupportedMarket.btc]: {
    symbol: 'BTC-USD',
    name: 'Bitcoin',
    displayDecimals: 2,
    tvTicker: 'Crypto.BTC/USD',
    baseCurrency: SupportedMarket.btc,
    quoteCurrency: QuoteCurrency.usd,
    providerId: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    pythFeedId: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    transform: linearTransform,
    untransform: linearTransform,
  },
  [SupportedMarket.eth]: {
    symbol: 'ETH-USD',
    name: 'Ethereum',
    displayDecimals: 6,
    tvTicker: 'Crypto.ETH/USD',
    baseCurrency: SupportedMarket.eth,
    quoteCurrency: QuoteCurrency.usd,
    providerId: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    pythFeedId: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    transform: linearTransform,
    untransform: linearTransform,
  },
  [SupportedMarket.arb]: {
    symbol: 'ARB-USD',
    name: 'Arbitrum',
    displayDecimals: 4,
    tvTicker: 'Crypto.ARB/USD',
    baseCurrency: SupportedMarket.arb,
    quoteCurrency: QuoteCurrency.usd,
    providerId: '0x3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5',
    pythFeedId: '0x3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5',
    transform: linearTransform,
    untransform: linearTransform,
  },

  [SupportedMarket.sol]: {
    symbol: 'SOL-USD',
    name: 'Solana',
    displayDecimals: 4,
    tvTicker: 'Crypto.SOL/USD',
    baseCurrency: SupportedMarket.sol,
    quoteCurrency: QuoteCurrency.usd,
    providerId: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
    pythFeedId: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
    transform: linearTransform,
    untransform: linearTransform,
  },
  [SupportedMarket.matic]: {
    symbol: 'MATIC-USD',
    name: 'Polygon',
    displayDecimals: 6,
    tvTicker: 'Crypto.MATIC/USD',
    baseCurrency: SupportedMarket.matic,
    quoteCurrency: QuoteCurrency.usd,
    providerId: '0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52',
    pythFeedId: '0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52',
    transform: linearTransform,
    untransform: linearTransform,
  },
  [SupportedMarket.tia]: {
    symbol: 'TIA-USD',
    name: 'Celestia',
    displayDecimals: 6,
    tvTicker: 'Crypto.TIA/USD',
    baseCurrency: SupportedMarket.tia,
    quoteCurrency: QuoteCurrency.usd,
    providerId: '0x09f7c1d7dfbb7df2b8fe3d3d87ee94a2259d212da4f30c1f0540d066dfa44723',
    pythFeedId: '0x09f7c1d7dfbb7df2b8fe3d3d87ee94a2259d212da4f30c1f0540d066dfa44723',
    transform: linearTransform,
    untransform: linearTransform,
  },
  [SupportedMarket.rlb]: {
    symbol: 'RLB-USD',
    name: 'Rollbit',
    displayDecimals: 6,
    tvTicker: 'Crypto.RLB/USD',
    baseCurrency: SupportedMarket.rlb,
    quoteCurrency: QuoteCurrency.usd,
    providerId: '0x2f2d17abbc1e781bd87b4a5d52c8b2856886f5c482fa3593cebf6795040ab0b6',
    pythFeedId: '0x2f2d17abbc1e781bd87b4a5d52c8b2856886f5c482fa3593cebf6795040ab0b6',
    transform: linearTransform,
    untransform: linearTransform,
  },

  [SupportedMarket.link]: {
    symbol: 'LINK-USD',
    name: 'Chainlink',
    displayDecimals: 6,
    tvTicker: 'Crypto.LINK/USD',
    baseCurrency: SupportedMarket.link,
    quoteCurrency: QuoteCurrency.usd,
    providerId: '0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221',
    pythFeedId: '0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221',
    transform: linearTransform,
    untransform: linearTransform,
  },
  [SupportedMarket.bnb]: {
    symbol: 'BNB-USD',
    name: 'BNB',
    displayDecimals: 6,
    tvTicker: 'Crypto.BNB/USD',
    baseCurrency: SupportedMarket.bnb,
    quoteCurrency: QuoteCurrency.usd,
    providerId: '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f',
    pythFeedId: '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f',
    transform: linearTransform,
    untransform: linearTransform,
  },
  [SupportedMarket.xrp]: {
    symbol: 'XRP-USD',
    name: 'XRP',
    displayDecimals: 6,
    tvTicker: 'Crypto.XRP/USD',
    baseCurrency: SupportedMarket.xrp,
    quoteCurrency: QuoteCurrency.usd,
    providerId: '0xec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8',
    pythFeedId: '0xec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8',
    transform: linearTransform,
    untransform: linearTransform,
  },
  [SupportedMarket.msqBTC]: {
    symbol: 'BTC²-USD',
    name: 'Bitcoin²',
    displayDecimals: 6,
    tvTicker: 'Crypto.BTC/USD',
    baseCurrency: SupportedMarket.msqBTC,
    quoteCurrency: QuoteCurrency.usd,
    providerId: '0x403d2f23c2015aee67e9311896907cc05c139b2c771a92ae48a2c0e50e6883a4',
    pythFeedId: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    transform: microPowerTwoTransform,
    untransform: microPowerTwoUntransform,
  },
  [SupportedMarket.cmsqETH]: {
    symbol: 'ETH²-USD',
    name: 'Ethereum²',
    displayDecimals: 6,
    tvTicker: 'Crypto.ETH/USD',
    baseCurrency: SupportedMarket.cmsqETH,
    quoteCurrency: QuoteCurrency.usd,
    providerId: '0x002aa13b58df1c483e925045e9a580506812ed5bc85c188d3d8b501501294ad4',
    pythFeedId: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    transform: centimilliPowerTwoTransform,
    untransform: centimilliPowerTwoUntransform,
  },
  [SupportedMarket.jup]: {
    symbol: 'JUP-USD',
    name: 'Jupiter',
    displayDecimals: 6,
    tvTicker: 'Crypto.JUP/USD',
    baseCurrency: SupportedMarket.jup,
    quoteCurrency: QuoteCurrency.usd,
    providerId: '0x0a0408d619e9380abad35060f9192039ed5042fa6f82301d0e48bb52be830996',
    pythFeedId: '0x0a0408d619e9380abad35060f9192039ed5042fa6f82301d0e48bb52be830996',
    transform: linearTransform,
    untransform: linearTransform,
  },
  [SupportedMarket.unknown]: {
    symbol: 'UNKNOWN',
    name: 'UNKNOWN',
    displayDecimals: 6,
    tvTicker: 'Crypto.UNKNOWN/USD',
    baseCurrency: SupportedMarket.unknown,
    quoteCurrency: QuoteCurrency.usd,
    providerId: zeroHash,
    pythFeedId: zeroHash,
    transform: linearTransform,
    untransform: linearTransform,
  },
}

/**
 * @description Map of market addresses organized by chain ID and market
 */
export const ChainMarkets: {
  [chainId in SupportedChainId]: {
    [market in SupportedMarket]?: Address
  }
} = {
  [arbitrum.id]: {
    [SupportedMarket.eth]: getAddress('0x90A664846960AaFA2c164605Aebb8e9Ac338f9a0'),
    [SupportedMarket.btc]: getAddress('0xcC83e3cDA48547e3c250a88C8D5E97089Fd28F60'),
    [SupportedMarket.sol]: getAddress('0x02258bE4ac91982dc1AF7a3D2C4F05bE6079C253'),
    [SupportedMarket.matic]: getAddress('0x7e34B5cBc6427Bd53ECFAeFc9AC2Cad04e982f78'),
    [SupportedMarket.tia]: getAddress('0x2CD8651b0dB6bE605267fdd737C840442A96fAFE'),
    [SupportedMarket.rlb]: getAddress('0x708B750f9f5bD23E074a5a0A64EF542585906e85'),
    [SupportedMarket.link]: getAddress('0xD9c296A7Bee1c201B9f3531c7AC9c9310ef3b738'),
    [SupportedMarket.bnb]: getAddress('0x362c6bC2A4EA2033063bf20409A4c5E8C5754056'),
    [SupportedMarket.xrp]: getAddress('0x2402E92f8C58886F716F5554039fA6398d7A1EfB'),
    [SupportedMarket.arb]: getAddress('0x3D1D603073b3CEAB5974Db5C54568058a9551cCC'),
    [SupportedMarket.msqBTC]: getAddress('0x768a5909f0B6997efa56761A89344eA2BD5560fd'),
    [SupportedMarket.cmsqETH]: getAddress('0x004E1Abf70e4FF99BC572843B63a63a58FAa08FF'),
    [SupportedMarket.jup]: getAddress('0xbfa99F19a376F25968865983c41535fa368B28da'),
  },
  [arbitrumSepolia.id]: {
    [SupportedMarket.eth]: getAddress('0x0142a8bfF8D887Fc4f04469fCA6c66F5e0936Ea7'),
  },
  [base.id]: {
    [SupportedMarket.eth]: getAddress('0xfed3725b449c79791e9771e069fc0c75749fe385'),
    [SupportedMarket.btc]: getAddress('0x9bb798317f002682a33a686598ee87bfb91be675'),
  },
}

export const chainMarketsWithAddress = (chainId: SupportedChainId, supportedMarkets?: SupportedMarket[]) => {
  return Object.entries(ChainMarkets[chainId])
    .map(([market, marketAddress]) => (isSupportedMarket(market) && !!marketAddress ? { market, marketAddress } : null))
    .filter((entry): entry is { market: SupportedMarket; marketAddress: `0x${string}` } => {
      return notEmpty(entry) && (!supportedMarkets || supportedMarkets.includes(entry.market))
    })
}

/**
 * Helper to retrieve a market name from a market address
 * @param chainId Chain ID
 * @param address Market Address
 * @returns SupportedMarket {@link SupportedMarket}
 */
export const addressToMarket = (chainId: SupportedChainId, address: Address | string) => {
  for (const market of Object.keys(ChainMarkets[Number(chainId) as SupportedChainId])) {
    if (ChainMarkets[Number(chainId) as SupportedChainId][market as SupportedMarket] === getAddress(address)) {
      return market as SupportedMarket
    }
  }

  console.warn(`Market not found for address: ${address}`)
  return SupportedMarket.unknown
}

export enum TriggerComparison {
  lte = 'lte',
  gte = 'gte',
}

export enum OrderTypes {
  market = 'market',
  limit = 'limit',
  stopLoss = 'stopLoss',
  takeProfit = 'takeProfit',
}

export const orderTypes = [OrderTypes.market, OrderTypes.limit, OrderTypes.stopLoss, OrderTypes.takeProfit]
export const triggerOrderTypes = [OrderTypes.stopLoss, OrderTypes.takeProfit]

function isSupportedMarket(market: any): market is SupportedMarket {
  return Object.values(SupportedMarket).includes(market)
}

export type ReferrerInterfaceFeeInfo =
  | {
      referralCode: string
      referralTarget: string
      share: bigint
      discount: bigint
      tier: string
    }
  | null
  | undefined

/**
 * @description Interface fee for the contract
 */
export type InterfaceFee = {
  /**
   * Indicates whether to unwrap the value from DSU to USDC
   */
  unwrap: boolean
  /**
   * Fee recipient address
   */
  receiver: Address
  /**
   * Fee amount
   */
  amount: bigint
}

/**
 * @description Deposit required for placing trigger orders
 */
export const OrderExecutionDeposit = Big6Math.fromFloatString('20')
/**
 * @description When passed to trigger orders, this value will fully close the position.
 */
export const TriggerOrderFullCloseMagicValue = 0n
