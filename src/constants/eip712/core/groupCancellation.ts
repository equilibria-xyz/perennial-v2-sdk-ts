import { SignTypedDataParameters } from 'viem'

import { EIP712_Common } from '../shared'

export const EIP712_GroupCancellation = [
  {
    name: 'group',
    type: 'uint256',
  },
  {
    name: 'common',
    type: 'Common',
  },
] as const

export const GroupCancellationSigningTypes = {
  GroupCancellation: EIP712_GroupCancellation,
  Common: EIP712_Common,
}

export type GroupCancellationSigningPayload = Omit<
  SignTypedDataParameters<typeof GroupCancellationSigningTypes, 'GroupCancellation'>,
  'account'
>
