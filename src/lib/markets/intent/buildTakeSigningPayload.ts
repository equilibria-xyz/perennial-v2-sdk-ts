import { Address } from 'viem'

import { SupportedMarket } from '../../../constants'
import { EIP712_Domain, TakeSigningPayload, TakeSigningTypes } from '../../../constants/eip712'
import { CommonOverrides, CommonRequired } from '../../../types/shared'
import { addressForMarket } from '../../../utils/addressUtils'
import { generateNonce } from '../../../utils/intentUtils'

export type BuildTakeSigningPayloadArgs = CommonRequired &
  CommonOverrides & {
    market: SupportedMarket | Address
    amount: bigint
    referrer: Address
  }
export function buildTakeSigningPayload({
  chainId,
  address: account,
  market,
  amount,
  referrer,
  expiry,
  overrides,
}: BuildTakeSigningPayloadArgs): { take: TakeSigningPayload } {
  const nonce = overrides?.nonce ?? generateNonce()
  const marketAddress = addressForMarket(chainId, market)

  const message = {
    amount,
    referrer,
    common: {
      nonce,
      group: overrides?.group ?? nonce,
      account,
      signer: overrides?.signer ?? account,
      domain: marketAddress,
      expiry,
    },
  }
  const payload: TakeSigningPayload = {
    domain: EIP712_Domain(chainId, 'core'),
    types: TakeSigningTypes,
    primaryType: 'Take',
    message,
  }

  return { take: payload }
}
