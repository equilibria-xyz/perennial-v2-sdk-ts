import { Address } from 'viem'

import { SupportedChainId } from '../constants'

export type OptionalAddress = { address?: Address }
export type CommonRequired = {
  chainId: SupportedChainId
  address: Address
  expiry: bigint
}
export type CommonOverrides = {
  overrides?: {
    signer?: Address
    group?: bigint
    nonce?: bigint
  }
}
