import { ContractFunctionArgs, ContractFunctionReturnType } from 'viem'

import { MarketAbi } from '../abi/Market.abi'
import { MultiInvokerAbi } from '../abi/MultiInvoker.abi'
import { CommonSigningPayload, IntentSigningPayload } from '../constants/eip712'

export type JumpRateUtilizationCurve = ContractFunctionReturnType<
  typeof MarketAbi,
  'view',
  'riskParameter'
>['utilizationCurve']
export type MultiInvokerAction = Exclude<
  ContractFunctionArgs<typeof MultiInvokerAbi, 'payable', 'invoke'>[0],
  string
>[number]
export type Intent = IntentSigningPayload['message']
export type Common = CommonSigningPayload['message']
