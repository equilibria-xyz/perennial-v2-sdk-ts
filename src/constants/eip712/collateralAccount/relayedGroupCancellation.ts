import { SignTypedDataParameters } from 'viem'

import { EIP712_GroupCancellation } from '../core/groupCancellation'
import { EIP712_Common } from '../shared/common'
import { EIP712_CollateralAccountAction } from './collateralAccountAction'

export const EIP712_RelayedGroupCancellation = [
  {
    name: 'groupCancellation',
    type: 'GroupCancellation',
  },
  {
    name: 'action',
    type: 'Action',
  },
] as const

export const RelayedGroupCancellationSigningTypes = {
  RelayedGroupCancellation: EIP712_RelayedGroupCancellation,
  Action: EIP712_CollateralAccountAction,
  Common: EIP712_Common,
  GroupCancellation: EIP712_GroupCancellation,
} as const

export type RelayedGroupCancellationSigningPayload = Omit<
  SignTypedDataParameters<typeof RelayedGroupCancellationSigningTypes, 'RelayedGroupCancellation'>,
  'account'
>
