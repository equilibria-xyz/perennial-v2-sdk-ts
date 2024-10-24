import { VerifierAddresses } from '../../../constants'
import {
  CommonSigningPayload,
  CommonSigningTypes,
  EIP712_Domain,
  RelayedNonceCancellationSigningPayload,
  RelayedNonceCancellationSigningTypes,
} from '../../../constants/eip712'
import { CommonOverrides, CommonRequired } from '../../../types/shared'
import { ActionRequred, buildActionMessage } from './_util'

export type BuildRelayedNonceCancellationSigningPayloadArgs = CommonRequired &
  ActionRequred &
  CommonOverrides & {
    nonceToCancel: bigint
  }
export function buildRelayedNonceCancellationSigningPayload({
  chainId,
  address: account,
  nonceToCancel,
  maxFee,
  overrides,
  expiry,
}: BuildRelayedNonceCancellationSigningPayloadArgs): {
  nonceCancellation: CommonSigningPayload
  relayedNonceCancellation: RelayedNonceCancellationSigningPayload
} {
  const action = buildActionMessage({ maxFee, overrides, expiry, account, chainId })

  const message = {
    nonceCancellation: {
      ...action.common,
      nonce: nonceToCancel,
      domain: VerifierAddresses[chainId],
    },
    action,
  }

  const outerPayload: RelayedNonceCancellationSigningPayload = {
    domain: EIP712_Domain(chainId, 'collateralAccount'),
    types: RelayedNonceCancellationSigningTypes,
    primaryType: 'RelayedNonceCancellation',
    message,
  }
  const innerPayload: CommonSigningPayload = {
    domain: EIP712_Domain(chainId, 'core'),
    types: CommonSigningTypes,
    primaryType: 'Common',
    message: message.nonceCancellation,
  }

  return { relayedNonceCancellation: outerPayload, nonceCancellation: innerPayload }
}
