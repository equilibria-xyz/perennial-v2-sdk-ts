import { SignTypedDataParameters } from 'viem'

import { EIP712_AccessUpdate } from '../core/accessUpdate'
import { EIP712_SignerUpdate } from '../core/signerUpdate'
import { EIP712_Common } from '../shared/common'
import { EIP712_CollateralAccountAction } from './collateralAccountAction'

export const EIP712_RelayedSignerUpdate = [
  {
    name: 'signerUpdate',
    type: 'SignerUpdate',
  },
  {
    name: 'action',
    type: 'Action',
  },
] as const

export const RelayedSignerUpdateSigningTypes = {
  RelayedSignerUpdate: EIP712_RelayedSignerUpdate,
  AccessUpdate: EIP712_AccessUpdate,
  Action: EIP712_CollateralAccountAction,
  Common: EIP712_Common,
  SignerUpdate: EIP712_SignerUpdate,
} as const

export type RelayedSignerUpdateSigningPayload = Omit<
  SignTypedDataParameters<typeof RelayedSignerUpdateSigningTypes, 'RelayedSignerUpdate'>,
  'account'
>
