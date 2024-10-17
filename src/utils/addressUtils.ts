import { Address, getAddress, isAddress, isAddressEqual, zeroAddress } from 'viem'

import { ChainMarkets, SupportedChainId, SupportedMarket } from '../constants'

export function throwIfZeroAddress(address_: string | Address) {
  const address = getAddress(address_)
  if (isAddressEqual(address, zeroAddress)) throw new Error('Address cannot be zero')
}

export function addressForMarket(chainId: SupportedChainId, market: SupportedMarket | Address) {
  const address = isAddress(market, { strict: false }) ? market : ChainMarkets[chainId][market]!
  if (!isAddress(address, { strict: false })) throw new Error('Invalid Market')

  return address
}
