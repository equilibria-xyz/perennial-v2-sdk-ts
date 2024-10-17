import { Address } from 'viem'

import { ControllerAddresses, SupportedChainId } from '../../../constants'
import { CommonOverrides } from '../../../types/shared'
import { generateNonce } from '../../../utils/intentUtils'

export type ActionRequred = {
  maxFee: bigint
}

export function buildActionMessage({
  maxFee,
  overrides,
  expiry,
  account,
  chainId,
}: {
  maxFee: bigint
  expiry: bigint
  account: Address
  chainId: SupportedChainId
} & CommonOverrides) {
  const nonce = overrides?.nonce ?? generateNonce()

  return {
    maxFee,
    common: {
      nonce,
      group: overrides?.group ?? nonce,
      account,
      signer: overrides?.signer ?? account,
      domain: ControllerAddresses[chainId],
      expiry,
    },
  }
}
