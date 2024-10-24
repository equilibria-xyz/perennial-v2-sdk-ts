import { SignTypedDataParameters } from 'viem'

import { EIP712_AccessUpdate, EIP712_AccessUpdateBatch } from '../core/accessUpdate'
import { EIP712_Common } from '../shared/common'
import { EIP712_CollateralAccountAction } from './collateralAccountAction'

export const EIP712_RelayedAccessUpdateBatch = [
  {
    name: 'accessUpdateBatch',
    type: 'AccessUpdateBatch',
  },
  {
    name: 'action',
    type: 'Action',
  },
] as const

export const RelayedAccessUpdateBatchSigningTypes = {
  RelayedAccessUpdateBatch: EIP712_RelayedAccessUpdateBatch,
  AccessUpdate: EIP712_AccessUpdate,
  AccessUpdateBatch: EIP712_AccessUpdateBatch,
  Action: EIP712_CollateralAccountAction,
  Common: EIP712_Common,
} as const

export type RelayedAccessUpdateBatchSigningPayload = Omit<
  SignTypedDataParameters<typeof RelayedAccessUpdateBatchSigningTypes, 'RelayedAccessUpdateBatch'>,
  'account'
>
