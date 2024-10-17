import { Address } from 'viem'

import { ManagerAddresses } from '../../../constants'
import { CancelOrderSigningPayload, CancelOrderSigningTypes, EIP712_Domain } from '../../../constants/eip712'
import { CommonOverrides, CommonRequired } from '../../../types/shared'
import { generateNonce } from '../../../utils/intentUtils'

export type BuildCancelOrderSigningPayloadArgs = CommonRequired &
  CommonOverrides & {
    market: Address
    orderId: bigint
    maxFee: bigint
  }

export function buildCancelOrderSigningPayload({
  chainId,
  expiry,
  address: account,
  overrides,
  market,
  orderId,
  maxFee,
}: BuildCancelOrderSigningPayloadArgs): { cancelOrder: CancelOrderSigningPayload } {
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
