import { Address, getAddress, zeroAddress } from 'viem'
import { arbitrum, arbitrumSepolia } from 'viem/chains'

import { perennial, perennialSepolia } from './customChains'
import { SupportedChainId } from './network'

type AddressMapping = { [chain in SupportedChainId]: Address }

export const MultiInvokerAddresses: AddressMapping = {
  [arbitrum.id]: getAddress('0x431603567EcBb4aa1Ce5a4fdBe5554cAEa658832'),
  [arbitrumSepolia.id]: getAddress('0x1927DE7c9765Ae74050D1d0aa8BB0e93D737F579'),
  [perennial.id]: getAddress('0xB3DC5187B1Fb6F1b41852cFeBE06d370384110eF'),
  [perennialSepolia.id]: getAddress('0xbcA65Ce3629167600d52492b61A97627305F4E0e'),
}

export const MarketFactoryAddresses: AddressMapping = {
  [arbitrum.id]: getAddress('0xDaD8A103473dfd47F90168A0E46766ed48e26EC7'),
  [arbitrumSepolia.id]: getAddress('0x32F3aB7b3c5BBa0738b72FdB83FcE6bb1a1a943c'),
  [perennial.id]: getAddress('0xC27399bE9E39f7F6b1f94fBd512F5c2aD2b5eDb7'),
  [perennialSepolia.id]: getAddress('0xFfB33F838096cF3C3c7dD21c1F941BB2705248E1'),
}

export const VaultFactoryAddresses: AddressMapping = {
  [arbitrum.id]: getAddress('0xad3565680aEcEe27A39249D8c2D55dAc79BE5Ad0'),
  [arbitrumSepolia.id]: getAddress('0x877682C7a8840D59A63a6227ED2Aeb20C3ae7FeB'),
  [perennial.id]: getAddress('0xAEf566ca7E84d1E736f999765a804687f39D9094'),
  [perennialSepolia.id]: getAddress('0xD174C71aBB6De9d71F62eb666921C950c5a81853'),
}

export const OracleFactoryAddresses: AddressMapping = {
  [arbitrum.id]: getAddress('0x8CDa59615C993f925915D3eb4394BAdB3feEF413'),
  [arbitrumSepolia.id]: getAddress('0x9d2CaE012AAe0aE00f4d8F42CD287a6923612456'),
  [perennial.id]: getAddress('0x49bCb3e1b0bA6A68EE1f1941EB56Ac7F46B67e09'),
  [perennialSepolia.id]: getAddress('0x5f2fc88cC29726D5643072Bf423338D69AE47053'),
}

export const VerifierAddresses: AddressMapping = {
  [arbitrum.id]: getAddress('0xF12a4ACDA6cA2e777b353538cb8e5ad6f05e0437'),
  [arbitrumSepolia.id]: getAddress('0x6FaabfA2fDb093A027Ed16F291ADc7F07780014A'),
  [perennial.id]: getAddress('0xfC20BccA96BDE758E9C69151d99cEcfEAE3AB37E'),
  [perennialSepolia.id]: getAddress('0x7AAF9184EE1299226d46fFEB36595Bb8D0EdF753'),
}

export const ControllerAddresses: AddressMapping = {
  [arbitrum.id]: getAddress('0x197dE1B26ad733380fD22159A2671f497A6DDd7C'),
  [arbitrumSepolia.id]: getAddress('0x80f5b854971B1B302FE9f94E9B19ef0C41c544Fb'),
  [perennial.id]: getAddress('0xe69FdDc2c8aDA6BE0ed02aE414f138B8edBC1D1c'),
  [perennialSepolia.id]: getAddress('0x07B891ae5E0eeAF7FB407552C28EAc785Ac8AF9C'),
}

export const ManagerAddresses: AddressMapping = {
  [arbitrum.id]: getAddress('0xbbF8A9D4961496FFE3F9c35F76106ec697Af2261'),
  [arbitrumSepolia.id]: getAddress('0x1D5DB9e0832E23C9A771b59c81aAF82A2D30a1Bb'),
  [perennial.id]: getAddress('0x2C19eac953048801FfE1358D109A1Ac2aF7930fD'),
  [perennialSepolia.id]: getAddress('0xa9AF20277A894EC90BC4EB308eB0B077332DAcd8'),
}

export const AccountVerifierAddresses: AddressMapping = {
  [arbitrum.id]: getAddress('0x0E9D1dF540aCB30A321D3D3edd4996E0248aaf5C'),
  [arbitrumSepolia.id]: getAddress('0x4d556433d056f6e749b90CbBFFfbe590b0CA017e'),
  [perennial.id]: getAddress('0xB5585A0cAac9f384A6Db545e89d0AC58215DBeFb'),
  [perennialSepolia.id]: getAddress('0x1cc0E7883DC01cCa0CC7A04b1Eb3e51C290645E7'),
}

export const OrderVerifierAddresses: AddressMapping = {
  [arbitrum.id]: getAddress('0x7C65ab8fc1f2d31c7144e148dd900Ea4EdC7EDd3'),
  [arbitrumSepolia.id]: getAddress('0x04e570a5Ef49b3Dc79a01A9552B803110a3F5e6b'),
  [perennial.id]: getAddress('0x32F3aB7b3c5BBa0738b72FdB83FcE6bb1a1a943c'),
  [perennialSepolia.id]: getAddress('0x6b1C4978142A9BC9dD5777866AA8Ad610deD696c'),
}

export const DSUAddresses: AddressMapping = {
  [arbitrum.id]: getAddress('0x52C64b8998eB7C80b6F526E99E29ABdcC86B841b'),
  [arbitrumSepolia.id]: getAddress('0x5FA881826AD000D010977645450292701bc2f56D'),
  [perennial.id]: getAddress('0x7b4Adf64B0d60fF97D672E473420203D52562A84'),
  [perennialSepolia.id]: getAddress('0x52C64b8998eB7C80b6F526E99E29ABdcC86B841b'),
}

export const EmptysetReserveAddresses: AddressMapping = {
  [arbitrum.id]: getAddress('0x0d49c416103Cbd276d9c3cd96710dB264e3A0c27'),
  [arbitrumSepolia.id]: getAddress('0x841d7C994aC0Bb17CcD65a021E686e3cFafE2118'),
  [perennial.id]: getAddress('0x0d49c416103Cbd276d9c3cd96710dB264e3A0c27'),
  [perennialSepolia.id]: getAddress('0x16b38364bA6f55B6E150cC7f52D22E89643f3535'),
}

export const USDCAddresses: AddressMapping = {
  [arbitrum.id]: getAddress('0xaf88d065e77c8cC2239327C5EDb3A432268e5831'),
  [arbitrumSepolia.id]: getAddress('0x16b38364bA6f55B6E150cC7f52D22E89643f3535'),
  [perennial.id]: getAddress('0x39CD9EF9E511ec008247aD5DA01245D84a9521be'),
  [perennialSepolia.id]: getAddress('0x37Fa204b282e46f54744660bf3dF48b43A554EbC'),
}

export const PythFactoryAddresses: AddressMapping = {
  [arbitrum.id]: getAddress('0xFeB35f293D2114DF6b284876dc8fbfcFfB873B7C'),
  [arbitrumSepolia.id]: getAddress('0xC2782aaA8aEd48056f0E2D9877681267B0bcC065'),
  [perennial.id]: zeroAddress,
  [perennialSepolia.id]: zeroAddress,
}

export const CryptexFactoryAddresses: AddressMapping = {
  [arbitrum.id]: getAddress('0xcB3B6A451Ca973F99BE29cC616bD9fD1D35ef048'),
  [arbitrumSepolia.id]: getAddress('0x4c71662764748375545fD2613d19F21c9C8A04FE'),
  [perennial.id]: zeroAddress,
  [perennialSepolia.id]: zeroAddress,
}

export const StorkFactoryAddresses: AddressMapping = {
  [arbitrum.id]: zeroAddress,
  [arbitrumSepolia.id]: zeroAddress,
  [perennial.id]: getAddress('0xfFE829F928Cb8C07961bfFF04512ac0749d65d27'),
  [perennialSepolia.id]: getAddress('0x7A18A52EF9Ab4E2EDE9113ef13483eD18b395ca7'),
}

export const ChainlinkFactoryAddresses: AddressMapping = {
  [arbitrum.id]: zeroAddress,
  [arbitrumSepolia.id]: zeroAddress,
  [perennial.id]: zeroAddress,
  [perennialSepolia.id]: zeroAddress,
}
