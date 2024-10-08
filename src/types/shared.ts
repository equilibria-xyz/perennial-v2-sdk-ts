import { Address } from 'viem'

export type OptionalAddress = { address?: Address }
export type CommonRequired = {
  address: Address
  expiry: bigint
}
export type CommonOverrides = {
  signer?: Address
  group?: bigint
  nonce?: bigint
}
