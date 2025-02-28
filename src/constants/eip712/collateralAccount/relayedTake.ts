import { SignTypedDataParameters } from 'viem'

import { EIP712_Take } from '../core/take'
import { EIP712_Common } from '../shared/common'
import { EIP712_CollateralAccountAction } from './collateralAccountAction'

export const EIP712_RelayedTake = [
  {
    name: 'take',
    type: 'Take',
  },
  {
    name: 'action',
    type: 'Action',
  },
] as const

export const RelayedTakeSigningTypes = {
  RelayedTake: EIP712_RelayedTake,
  Action: EIP712_CollateralAccountAction,
  Common: EIP712_Common,
  Take: EIP712_Take,
} as const

export type RelayedTakeSigningPayload = Omit<
  SignTypedDataParameters<typeof RelayedTakeSigningTypes, 'RelayedTake'>,
  'account'
>
