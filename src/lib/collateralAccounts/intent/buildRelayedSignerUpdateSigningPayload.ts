import { Address } from 'viem'

import { MarketFactoryAddresses } from '../../../constants'
import {
  EIP712_Domain,
  RelayedSignerUpdateSigningPayload,
  RelayedSignerUpdateSigningTypes,
  SignerUpdateSigningPayload,
  SignerUpdateSigningTypes,
} from '../../../constants/eip712'
import { CommonOverrides, CommonRequired } from '../../../types/shared'
import { ActionRequred, buildActionMessage } from './_util'

export type BuildRelayedSignerUpdateSigningPayloadArgs = CommonRequired &
  ActionRequred &
  CommonOverrides & {
    newSigner: Address
    approved: boolean
  }
export function buildRelayedSignerUpdateSigningPayload({
  chainId,
  address: account,
  newSigner,
  approved,
  maxFee,
  overrides,
  expiry,
}: BuildRelayedSignerUpdateSigningPayloadArgs): {
  signerUpdate: SignerUpdateSigningPayload
  relayedSignerUpdate: RelayedSignerUpdateSigningPayload
} {
  const action = buildActionMessage({ maxFee, overrides, expiry, account, chainId })

  const message = {
    signerUpdate: {
      access: {
        accessor: newSigner,
        approved,
      },
      common: {
        ...action.common,
        domain: MarketFactoryAddresses[chainId],
      },
    },
    action,
  }

  const outerPayload: RelayedSignerUpdateSigningPayload = {
    domain: EIP712_Domain(chainId, 'collateralAccount'),
    types: RelayedSignerUpdateSigningTypes,
    primaryType: 'RelayedSignerUpdate',
    message,
  }
  const innerPayload: SignerUpdateSigningPayload = {
    domain: EIP712_Domain(chainId, 'core'),
    types: SignerUpdateSigningTypes,
    primaryType: 'SignerUpdate',
    message: message.signerUpdate,
  }

  return { relayedSignerUpdate: outerPayload, signerUpdate: innerPayload }
}
