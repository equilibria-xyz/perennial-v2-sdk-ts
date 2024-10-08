export const EIP712_Common = [
  {
    name: 'account',
    type: 'address',
  },
  {
    name: 'signer',
    type: 'address',
  },
  {
    name: 'domain',
    type: 'address',
  },
  {
    name: 'nonce',
    type: 'uint256',
  },
  {
    name: 'group',
    type: 'uint256',
  },
  {
    name: 'expiry',
    type: 'uint256',
  },
] as const

export const CommonSigningTypes = {
  Common: EIP712_Common,
} as const
