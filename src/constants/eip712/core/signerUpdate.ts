import { SignTypedDataParameters } from 'viem'

import { EIP712_AccessUpdate } from '../core'
import { EIP712_Common } from '../shared'

export const EIP712_SignerUpdate = [
  {
    name: 'access',
    type: 'AccessUpdate',
  },
  {
    name: 'common',
    type: 'Common',
  },
] as const

export const SignerUpdateSigningTypes = {
  SignerUpdate: EIP712_SignerUpdate,
  AccessUpdate: EIP712_AccessUpdate,
  Common: EIP712_Common,
} as const

export type SignerUpdateSigningPayload = Omit<
  SignTypedDataParameters<typeof SignerUpdateSigningTypes, 'SignerUpdate'>,
  'account'
>
