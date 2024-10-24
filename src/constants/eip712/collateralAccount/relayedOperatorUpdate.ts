import { SignTypedDataParameters } from 'viem'

import { EIP712_AccessUpdate } from '../core/accessUpdate'
import { EIP712_OperatorUpdate } from '../core/operatorUpdate'
import { EIP712_Common } from '../shared/common'
import { EIP712_CollateralAccountAction } from './collateralAccountAction'

export const EIP712_RelayedOperatorUpdate = [
  {
    name: 'operatorUpdate',
    type: 'OperatorUpdate',
  },
  {
    name: 'action',
    type: 'Action',
  },
] as const

export const RelayedOperatorUpdateSigningTypes = {
  RelayedOperatorUpdate: EIP712_RelayedOperatorUpdate,
  AccessUpdate: EIP712_AccessUpdate,
  Action: EIP712_CollateralAccountAction,
  Common: EIP712_Common,
  OperatorUpdate: EIP712_OperatorUpdate,
} as const

export type RelayedOperatorUpdateSigningPayload = Omit<
  SignTypedDataParameters<typeof RelayedOperatorUpdateSigningTypes, 'RelayedOperatorUpdate'>,
  'account'
>
