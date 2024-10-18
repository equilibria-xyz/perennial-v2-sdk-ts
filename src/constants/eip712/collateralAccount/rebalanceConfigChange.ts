import { SignTypedDataParameters } from 'viem'

import { EIP712_Common } from '../shared/common'
import { EIP712_CollateralAccountAction } from './collateralAccountAction'

export const EIP712_RebalanceConfig = [
  {
    name: 'target',
    type: 'uint256',
  },
  {
    name: 'threshold',
    type: 'uint256',
  },
] as const

export const EIP712_RebalanceConfigChange = [
  {
    name: 'group',
    type: 'uint256',
  },
  {
    name: 'markets',
    type: 'address[]',
  },
  {
    name: 'configs',
    type: 'RebalanceConfig[]',
  },
  {
    name: 'maxFee',
    type: 'uint256',
  },
  {
    name: 'action',
    type: 'Action',
  },
] as const

export const RebalanceConfigChangeSigningTypes = {
  RebalanceConfigChange: EIP712_RebalanceConfigChange,
  Action: EIP712_CollateralAccountAction,
  Common: EIP712_Common,
  RebalanceConfig: EIP712_RebalanceConfig,
} as const

export type RebalanceConfigChangeSigningPayload = Omit<
  SignTypedDataParameters<typeof RebalanceConfigChangeSigningTypes, 'RebalanceConfigChange'>,
  'account'
>
