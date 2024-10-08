import { SignTypedDataParameters } from 'viem'

import { EIP712_Common } from '../shared/common'
import { EIP712_CollateralAccountAction } from './collateralAccountAction'

export const EIP712_RelayedNonceCancellation = [
  {
    name: 'nonceCancellation',
    type: 'Common',
  },
  {
    name: 'action',
    type: 'Action',
  },
] as const

export const RelayedNonceCancellationSigningTypes = {
  RelayedNonceCancellation: EIP712_RelayedNonceCancellation,
  Common: EIP712_Common,
  Action: EIP712_CollateralAccountAction,
} as const

export type RelayedNonceCancellationSigningPayload = Omit<
  SignTypedDataParameters<typeof RelayedNonceCancellationSigningTypes, 'RelayedNonceCancellation'>,
  'account'
>
