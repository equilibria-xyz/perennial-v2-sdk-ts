import { Address } from 'viem'

import { MarketFactoryAddresses } from '../../../constants'
import {
  EIP712_Domain,
  OperatorUpdateSigningPayload,
  OperatorUpdateSigningTypes,
  RelayedOperatorUpdateSigningPayload,
  RelayedOperatorUpdateSigningTypes,
} from '../../../constants/eip712'
import { CommonOverrides, CommonRequired } from '../../../types/shared'
import { ActionRequred, buildActionMessage } from './_util'

export type BuildRelayedOperatorUpdateSigningPayloadArgs = CommonRequired &
  ActionRequred &
  CommonOverrides & {
    newOperator: Address
    approved: boolean
  }
export function buildRelayedOperatorUpdateSigningPayload({
  chainId,
  address: account,
  newOperator,
  approved,
  maxFee,
  overrides,
  expiry,
}: BuildRelayedOperatorUpdateSigningPayloadArgs): {
  operatorUpdate: OperatorUpdateSigningPayload
  relayedOperatorUpdate: RelayedOperatorUpdateSigningPayload
} {
  const action = buildActionMessage({ maxFee, overrides, expiry, account, chainId })

  const message = {
    operatorUpdate: {
      access: {
        accessor: newOperator,
        approved,
      },
      common: {
        ...action.common,
        domain: MarketFactoryAddresses[chainId],
      },
    },
    action,
  }

  const outerPayload: RelayedOperatorUpdateSigningPayload = {
    domain: EIP712_Domain(chainId, 'collateralAccount'),
    types: RelayedOperatorUpdateSigningTypes,
    primaryType: 'RelayedOperatorUpdate',
    message,
  }
  const innerPayload: OperatorUpdateSigningPayload = {
    domain: EIP712_Domain(chainId, 'core'),
    types: OperatorUpdateSigningTypes,
    primaryType: 'OperatorUpdate',
    message: message.operatorUpdate,
  }

  return { relayedOperatorUpdate: outerPayload, operatorUpdate: innerPayload }
}
