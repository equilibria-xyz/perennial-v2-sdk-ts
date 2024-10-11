import { SignTypedDataParameters } from 'viem'

import { EIP712_Common } from '../shared/common'
import { EIP712_OrderAction } from './orderAction'

export const EIP712_CancelOrderAction = [
  {
    name: 'action',
    type: 'Action',
  },
] as const

export const CancelOrderSigningTypes = {
  CancelOrderAction: EIP712_CancelOrderAction,
  Action: EIP712_OrderAction,
  Common: EIP712_Common,
} as const

export type CancelOrderSigningPayload = Omit<
  SignTypedDataParameters<typeof CancelOrderSigningTypes, 'CancelOrderAction'>,
  'account'
>
