import { SignTypedDataParameters } from 'viem'

import { EIP712_Common } from '../shared/common'
import { EIP712_OrderAction } from './orderAction'

export const EIP712_InterfaceFee = [
  {
    name: 'amount',
    type: 'uint64',
  },
  {
    name: 'receiver',
    type: 'address',
  },
  {
    name: 'fixedFee',
    type: 'bool',
  },
  {
    name: 'unwrap',
    type: 'bool',
  },
]

export const EIP712_TriggerOrder = [
  {
    name: 'side',
    type: 'uint8',
  },
  {
    name: 'comparison',
    type: 'int8',
  },
  {
    name: 'price',
    type: 'int64',
  },
  {
    name: 'delta',
    type: 'int64',
  },
  {
    name: 'maxFee',
    type: 'uint64',
  },
  {
    name: 'isSpent',
    type: 'bool',
  },
  {
    name: 'referrer',
    type: 'address',
  },
  {
    name: 'interfaceFee',
    type: 'InterfaceFee',
  },
]

export const EIP712_PlaceOrderAction = [
  {
    name: 'order',
    type: 'TriggerOrder',
  },
  {
    name: 'action',
    type: 'Action',
  },
]

export const PlaceOrderSigningTypes = {
  PlaceOrderAction: EIP712_PlaceOrderAction,
  Action: EIP712_OrderAction,
  Common: EIP712_Common,
  InterfaceFee: EIP712_InterfaceFee,
  TriggerOrder: EIP712_TriggerOrder,
}

export type PlaceOrderSigningPayload = Omit<
  SignTypedDataParameters<typeof PlaceOrderSigningTypes, 'PlaceOrderAction'>,
  'account'
>
