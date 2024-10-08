import { SignTypedDataParameters } from 'viem'

import { EIP712_Common } from '../shared/common'
import { EIP712_CollateralAccountAction } from './collateralAccountAction'

export const EIP712_DeployAccount = [
  {
    name: 'action',
    type: 'Action',
  },
] as const

export const DeployAccountSigningTypes = {
  DeployAccount: EIP712_DeployAccount,
  Action: EIP712_CollateralAccountAction,
  Common: EIP712_Common,
}

export type DeployAccountSigningPayload = Omit<
  SignTypedDataParameters<typeof DeployAccountSigningTypes, 'DeployAccount'>,
  'account'
>
