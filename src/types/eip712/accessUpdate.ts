import { EIP712_Common } from '.'

export const EIP712_AccessUpdate = [
  {
    name: 'accessor',
    type: 'address',
  },
  {
    name: 'approved',
    type: 'bool',
  },
] as const

export const EIP712_AccessUpdateBatch = [
  {
    name: 'operators',
    type: 'AccessUpdate[]',
  },
  {
    name: 'signers',
    type: 'AccessUpdate[]',
  },
  {
    name: 'common',
    type: 'Common',
  },
] as const

export const AccessUpdateSigningTypes = {
  AccessUpdateBatch: EIP712_AccessUpdateBatch,
  AccessUpdate: EIP712_AccessUpdate,
  Common: EIP712_Common,
} as const
