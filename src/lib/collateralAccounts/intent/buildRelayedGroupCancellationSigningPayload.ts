import { VerifierAddresses } from '../../../constants'
import {
  EIP712_Domain,
  GroupCancellationSigningPayload,
  GroupCancellationSigningTypes,
  RelayedGroupCancellationSigningPayload,
  RelayedGroupCancellationSigningTypes,
} from '../../../constants/eip712'
import { CommonOverrides, CommonRequired } from '../../../types/shared'
import { ActionRequred, buildActionMessage } from './_util'

export type BuildRelayedGroupCancellationSigningPayloadArgs = CommonRequired &
  ActionRequred &
  CommonOverrides & {
    groupToCancel: bigint
  }
export function buildRelayedGroupCancellationSigningPayload({
  chainId,
  address: account,
  groupToCancel,
  maxFee,
  overrides,
  expiry,
}: BuildRelayedGroupCancellationSigningPayloadArgs): {
  groupCancellation: GroupCancellationSigningPayload
  relayedGroupCancellation: RelayedGroupCancellationSigningPayload
} {
  const action = buildActionMessage({ maxFee, overrides, expiry, account, chainId })

  const message = {
    groupCancellation: {
      group: groupToCancel,
      common: {
        ...action.common,
        domain: VerifierAddresses[chainId],
      },
    },
    action,
  }

  const outerPayload: RelayedGroupCancellationSigningPayload = {
    domain: EIP712_Domain(chainId, 'collateralAccount'),
    types: RelayedGroupCancellationSigningTypes,
    primaryType: 'RelayedGroupCancellation',
    message,
  }
  const innerPayload: GroupCancellationSigningPayload = {
    domain: EIP712_Domain(chainId, 'core'),
    types: GroupCancellationSigningTypes,
    primaryType: 'GroupCancellation',
    message: message.groupCancellation,
  }

  return { relayedGroupCancellation: outerPayload, groupCancellation: innerPayload }
}
