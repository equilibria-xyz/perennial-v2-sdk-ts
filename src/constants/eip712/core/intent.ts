import { SignTypedDataParameters } from 'viem'

import { EIP712_Common } from '../shared'

export const EIP712_Intent = [
  {
    name: 'amount',
    type: 'int256',
  },
  {
    name: 'price',
    type: 'int256',
  },
  {
    name: 'fee',
    type: 'uint256',
  },
  {
    name: 'originator',
    type: 'address',
  },
  {
    name: 'solver',
    type: 'address',
  },
  {
    name: 'collateralization',
    type: 'uint256',
  },
  {
    name: 'common',
    type: 'Common',
  },
] as const

export const IntentSigningTypes = {
  Intent: EIP712_Intent,
  Common: EIP712_Common,
} as const

export type IntentSigningPayload = Omit<SignTypedDataParameters<typeof IntentSigningTypes, 'Intent'>, 'account'>
