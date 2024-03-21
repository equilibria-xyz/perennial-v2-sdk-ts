import { AbiParametersToPrimitiveTypes, ExtractAbiFunction } from 'abitype'

import { MarketAbi } from '../abi/Market.abi'
import { MultiInvoker2Abi } from '../abi/MultiInvoker2.abi'

export type JumpRateUtilizationCurve = AbiParametersToPrimitiveTypes<
  ExtractAbiFunction<typeof MarketAbi, 'riskParameter'>['outputs']
>[0]['utilizationCurve']
export type MultiInvoker2Action = AbiParametersToPrimitiveTypes<
  ExtractAbiFunction<typeof MultiInvoker2Abi, 'invoke'>['inputs']
>[0][0]
