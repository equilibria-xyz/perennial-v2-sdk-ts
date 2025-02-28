import { Address } from 'viem'

import { SupportedMarket } from '../../../constants'
import {
  EIP712_Domain,
  RelayedTakeSigningPayload,
  RelayedTakeSigningTypes,
  TakeSigningPayload,
  TakeSigningTypes,
} from '../../../constants/eip712'
import { CommonOverrides, CommonRequired } from '../../../types/shared'
import { addressForMarket } from '../../../utils/addressUtils'
import { ActionRequred, buildActionMessage } from './_util'

export type BuildRelayedTakeSigningPayloadArgs = CommonRequired &
  ActionRequred &
  CommonOverrides & {
    market: SupportedMarket | Address
    amount: bigint
    referrer: Address
  }

export function buildRelayedTakeSigningPayload({
  chainId,
  address: account,
  amount,
  referrer,
  maxFee,
  overrides,
  expiry,
  market,
}: BuildRelayedTakeSigningPayloadArgs): {
  relayedTake: RelayedTakeSigningPayload
  take: TakeSigningPayload
} {
  const marketAddress = addressForMarket(chainId, market)
  const action = buildActionMessage({ maxFee, overrides, expiry, account, chainId })

  const message = {
    take: {
      amount,
      referrer,
      common: {
        ...action.common,
        domain: marketAddress,
      },
    },
    action,
  }

  const outerPayload: RelayedTakeSigningPayload = {
    domain: EIP712_Domain(chainId, 'collateralAccount'),
    types: RelayedTakeSigningTypes,
    primaryType: 'RelayedTake',
    message,
  }
  const innerPayload: TakeSigningPayload = {
    domain: EIP712_Domain(chainId, 'core'),
    types: TakeSigningTypes,
    primaryType: 'Take',
    message: message.take,
  }

  return { relayedTake: outerPayload, take: innerPayload }
}
