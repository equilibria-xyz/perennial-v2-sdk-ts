import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from 'abitype'

import { MarketAbi } from '../abi/Market.abi'
import { MultiInvokerAbi } from '../abi/MultiInvoker.abi'

export type JumpRateUtilizationCurve = AbiParametersToPrimitiveTypes<
  ExtractAbiFunction<typeof MarketAbi, 'riskParameter'>['outputs']
>[0]['utilizationCurve']
export type MultiInvokerAction = Exclude<
  AbiParametersToPrimitiveTypes<ExtractAbiFunction<typeof MultiInvokerAbi, 'invoke'>['inputs']>[0][0],
  string
>
