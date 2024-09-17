import { EIP712_AccessUpdate, EIP712_Common } from './'

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
