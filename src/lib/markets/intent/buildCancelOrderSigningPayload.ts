import { Address } from 'viem'

import { ManagerAddresses, SupportedMarket } from '../../../constants'
import { CancelOrderSigningPayload, CancelOrderSigningTypes, EIP712_Domain } from '../../../constants/eip712'
import { CommonOverrides, CommonRequired } from '../../../types/shared'
import { addressForMarket } from '../../../utils/addressUtils'
import { generateNonce } from '../../../utils/intentUtils'

export type BuildCancelOrderSigningPayloadArgs = CommonRequired &
  CommonOverrides & {
    market: Address | SupportedMarket
    orderId: bigint
    maxFee: bigint
  }

export function buildCancelOrderSigningPayload({
  chainId,
  expiry,
  address: account,
  overrides,
  market: market_,
  orderId,
  maxFee,
}: BuildCancelOrderSigningPayloadArgs): { cancelOrder: CancelOrderSigningPayload } {
  const market = addressForMarket(chainId, market_)
  const nonce = overrides?.nonce ?? generateNonce()

  const message = {
    action: {
      market,
      orderId,
      maxFee,
      common: {
        nonce,
        group: overrides?.group ?? nonce,
        account,
        signer: overrides?.signer ?? account,
        domain: ManagerAddresses[chainId],
        expiry,
      },
    },
  }

  const payload: CancelOrderSigningPayload = {
    domain: EIP712_Domain(chainId, 'orders'),
    types: CancelOrderSigningTypes,
    primaryType: 'CancelOrderAction',
    message,
  }

  return { cancelOrder: payload }
}
