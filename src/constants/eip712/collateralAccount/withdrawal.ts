import { SignTypedDataParameters } from 'viem'

import { EIP712_Common } from '../shared/common'
import { EIP712_CollateralAccountAction } from './collateralAccountAction'

export const EIP712_Withdrawal = [
  {
    name: 'amount',
    type: 'uint256',
  },
  {
    name: 'unwrap',
    type: 'bool',
  },
  {
    name: 'action',
    type: 'Action',
  },
] as const

export const WithdrawalSigningTypes = {
  Withdrawal: EIP712_Withdrawal,
  Action: EIP712_CollateralAccountAction,
  Common: EIP712_Common,
}

export type WithdrawalSigningPayload = Omit<
  SignTypedDataParameters<typeof WithdrawalSigningTypes, 'Withdrawal'>,
  'account'
>
