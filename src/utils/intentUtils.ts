import { Address } from 'viem'

import { CommonOverrides } from '../types/shared'

export function generateNonce() {
  return BigInt(Date.now())
}

/**
 * Adds a signer override to the overrides object if the signer is not already set.
 * @param walletClientSigner - The address of the wallet client signer.
 * @param overrides - The {@link CommonOverrides} object.
 * @returns The updated overrides object.
 */
export function addSignerOverrideFromWalletClientSigner({
  walletClientSigner,
  overrides,
}: {
  walletClientSigner?: Address
} & CommonOverrides) {
  return Boolean(overrides?.signer) ? overrides : { ...overrides, signer: walletClientSigner }
}
