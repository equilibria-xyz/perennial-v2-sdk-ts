import { EIP712_AccessUpdate, EIP712_Common } from '.'

export const EIP712_OperatorUpdate = [
  {
    name: 'access',
    type: 'AccessUpdate',
  },
  {
    name: 'common',
    type: 'Common',
  },
] as const

export const OperatorUpdateSigningTypes = {
  OperatorUpdate: EIP712_OperatorUpdate,
  AccessUpdate: EIP712_AccessUpdate,
  Common: EIP712_Common,
} as const
