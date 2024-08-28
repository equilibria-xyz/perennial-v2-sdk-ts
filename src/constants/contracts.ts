import { Address, getAddress, zeroAddress } from 'viem'
import { arbitrum, arbitrumSepolia } from 'viem/chains'

import { SupportedChainId } from './network'

type AddressMapping = { [chain in SupportedChainId]: Address }

export const MultiInvokerAddresses: AddressMapping = {
  [arbitrum.id]: getAddress('0x431603567EcBb4aa1Ce5a4fdBe5554cAEa658832'),
  [arbitrumSepolia.id]: getAddress('0x1927DE7c9765Ae74050D1d0aa8BB0e93D737F579'),
}

export const MarketFactoryAddresses: AddressMapping = {
  [arbitrum.id]: getAddress('0xDaD8A103473dfd47F90168A0E46766ed48e26EC7'),
  [arbitrumSepolia.id]: getAddress('0x32F3aB7b3c5BBa0738b72FdB83FcE6bb1a1a943c'),
}

export const VaultFactoryAddresses: AddressMapping = {
  [arbitrum.id]: getAddress('0xad3565680aEcEe27A39249D8c2D55dAc79BE5Ad0'),
  [arbitrumSepolia.id]: getAddress('0x877682C7a8840D59A63a6227ED2Aeb20C3ae7FeB'),
}

export const OracleFactoryAddresses: AddressMapping = {
  [arbitrum.id]: getAddress('0x8CDa59615C993f925915D3eb4394BAdB3feEF413'),
  [arbitrumSepolia.id]: getAddress('0x9d2CaE012AAe0aE00f4d8F42CD287a6923612456'),
}

export const DSUAddresses: AddressMapping = {
  [arbitrum.id]: getAddress('0x52C64b8998eB7C80b6F526E99E29ABdcC86B841b'),
  [arbitrumSepolia.id]: getAddress('0x5FA881826AD000D010977645450292701bc2f56D'),
}

export const EmptysetReserveAddresses: AddressMapping = {
  [arbitrum.id]: getAddress('0x0d49c416103Cbd276d9c3cd96710dB264e3A0c27'),
  [arbitrumSepolia.id]: getAddress('0x841d7C994aC0Bb17CcD65a021E686e3cFafE2118'),
}

export const USDCAddresses: AddressMapping = {
  [arbitrum.id]: getAddress('0xaf88d065e77c8cC2239327C5EDb3A432268e5831'),
  [arbitrumSepolia.id]: getAddress('0x16b38364bA6f55B6E150cC7f52D22E89643f3535'),
}

export const PythFactoryAddresses: AddressMapping = {
  [arbitrum.id]: getAddress('0x663B38A93FdC2164D45F35051B0F905211d1C9E4'),
  [arbitrumSepolia.id]: getAddress('0xC3bE5FcBfDD38f5c6eb5d8cDdE712eb1d54A1Aa1'),
}

export const CryptexFactoryAddresses: AddressMapping = {
  [arbitrum.id]: zeroAddress,
  [arbitrumSepolia.id]: getAddress('0x161Ef7447eC2B3F9425edc405830A111F4033Cb6'),
}

export const ChainlinkFactoryAddresses: AddressMapping = {
  [arbitrum.id]: zeroAddress,
  [arbitrumSepolia.id]: getAddress('0x5250115dde6ce8d11e619003E0B2d816Dcb4546e'),
}
