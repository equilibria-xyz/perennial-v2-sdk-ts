import { SignTypedDataParameters } from 'viem'

import { EIP712_Common } from '../shared'

export const EIP712_Take = [
  {
    name: 'amount',
    type: 'int256',
  },
  {
    name: 'referrer',
    type: 'address',
  },
  {
    name: 'common',
    type: 'Common',
  },
] as const

export const TakeSigningTypes = {
  Take: EIP712_Take,
  Common: EIP712_Common,
} as const

export type TakeSigningPayload = Omit<SignTypedDataParameters<typeof TakeSigningTypes, 'Take'>, 'account'>
