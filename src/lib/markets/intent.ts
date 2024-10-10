import { Address } from 'viem'

import { SupportedMarket } from '../../constants'
import { EIP712_Domain, IntentSigningPayload, IntentSigningTypes } from '../../constants/eip712'
import { Intent } from '../../types/perennial'
import { CommonOverrides, CommonRequired } from '../../types/shared'
import { addressForMarket } from '../../utils/addressUtils'
import { generateNonce } from '../../utils/intentUtils'

export type BuildIntentSigningPayloadArgs = CommonRequired &
  CommonOverrides & {
    intent: Omit<Intent, 'common'>
    market: SupportedMarket | Address
  }
export function buildIntentSigningPayload({
  chainId,
  intent,
  address: account,
  market,
  expiry,
  overrides,
}: BuildIntentSigningPayloadArgs): IntentSigningPayload {
  const nonce = overrides?.nonce ?? generateNonce()
  const marketAddress = addressForMarket(chainId, market)

  const message = {
    ...intent,
    common: {
      nonce,
      group: overrides?.group ?? nonce,
      account,
      signer: overrides?.signer ?? account,
      domain: marketAddress,
      expiry,
    },
  }
  const payload: IntentSigningPayload = {
    domain: EIP712_Domain(chainId, 'core'),
    types: IntentSigningTypes,
    primaryType: 'Intent',
    message,
  }

  return payload
}
