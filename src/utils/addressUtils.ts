import { Address, getAddress, isAddressEqual, zeroAddress } from 'viem'

export function throwIfZeroAddress(address_: string | Address) {
  const address = getAddress(address_)
  if (isAddressEqual(address, zeroAddress)) throw new Error('Address cannot be zero')
}
