import { AbiParametersToPrimitiveTypes, ExtractAbiFunction, TypedDataToPrimitiveTypes } from 'abitype'

import { MarketAbi } from '../abi/Market.abi'
import { MultiInvokerAbi } from '../abi/MultiInvoker.abi'
import { IntentSigningTypes } from './eip712/intent'

export type JumpRateUtilizationCurve = AbiParametersToPrimitiveTypes<
  ExtractAbiFunction<typeof MarketAbi, 'riskParameter'>['outputs']
>[0]['utilizationCurve']
export type MultiInvokerAction = Exclude<
  AbiParametersToPrimitiveTypes<ExtractAbiFunction<typeof MultiInvokerAbi, 'invoke'>['inputs']>[0][0],
  string
>

export type Intent = TypedDataToPrimitiveTypes<typeof IntentSigningTypes>['Intent']
export type Common = TypedDataToPrimitiveTypes<typeof CommonSigningTypes>['Common']
