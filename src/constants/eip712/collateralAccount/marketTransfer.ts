import { SignTypedDataParameters } from 'viem'

import { EIP712_Common } from '../shared/common'
import { EIP712_CollateralAccountAction } from './collateralAccountAction'

export const EIP712_MarketTransfer = [
  {
    name: 'market',
    type: 'address',
  },
  {
    name: 'amount',
    type: 'int256',
  },
  {
    name: 'action',
    type: 'Action',
  },
] as const

export const MarketTransferSigningTypes = {
  MarketTransfer: EIP712_MarketTransfer,
  Action: EIP712_CollateralAccountAction,
  Common: EIP712_Common,
} as const

export type MarketTransferSigningPayload = Omit<
  SignTypedDataParameters<typeof MarketTransferSigningTypes, 'MarketTransfer'>,
  'account'
>
