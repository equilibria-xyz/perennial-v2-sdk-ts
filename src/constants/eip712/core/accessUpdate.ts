import { SignTypedDataParameters } from 'viem'

import { EIP712_Common } from '../shared'

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

export const AccessUpdateSigningTypes = {
  AccessUpdate: EIP712_AccessUpdate,
} as const

export type AccessUpdateSigningPayload = Omit<
  SignTypedDataParameters<typeof AccessUpdateSigningTypes, 'AccessUpdate'>,
  'account'
>

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

export const AccessUpdateBatchSigningTypes = {
  AccessUpdateBatch: EIP712_AccessUpdateBatch,
  AccessUpdate: EIP712_AccessUpdate,
  Common: EIP712_Common,
} as const
