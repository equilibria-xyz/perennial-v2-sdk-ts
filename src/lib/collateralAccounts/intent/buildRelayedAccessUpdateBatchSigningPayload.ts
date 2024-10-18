import { Address } from 'viem'

import { MarketFactoryAddresses } from '../../../constants'
import {
  AccessUpdateBatchSigningPayload,
  AccessUpdateBatchSigningTypes,
  EIP712_Domain,
  RelayedAccessUpdateBatchSigningPayload,
  RelayedAccessUpdateBatchSigningTypes,
} from '../../../constants/eip712'
import { CommonOverrides, CommonRequired } from '../../../types/shared'
import { ActionRequred, buildActionMessage } from './_util'

export type BuildRelayedAccessUpdateBatchSigningPayloadArgs = CommonRequired &
  ActionRequred &
  CommonOverrides & {
    signers: {
      signer: Address
      approved: boolean
    }[]
    operators: {
      operator: Address
      approved: boolean
    }[]
  }

export function buildRelayedAccessUpdateBatchSigningPayload({
  chainId,
  address: account,
  signers,
  operators,
  maxFee,
  overrides,
  expiry,
}: BuildRelayedAccessUpdateBatchSigningPayloadArgs): {
  relayedAccessUpdateBatch: RelayedAccessUpdateBatchSigningPayload
  accessUpdateBatch: AccessUpdateBatchSigningPayload
} {
  const action = buildActionMessage({ maxFee, overrides, expiry, account, chainId })

  const message = {
    accessUpdateBatch: {
      signers: signers.map(({ signer, approved }) => ({
        accessor: signer,
        approved,
      })),
      operators: operators.map(({ operator, approved }) => ({
        accessor: operator,
        approved,
      })),
      common: {
        ...action.common,
        domain: MarketFactoryAddresses[chainId],
      },
    },
    action,
  }

  const outerPayload: RelayedAccessUpdateBatchSigningPayload = {
    domain: EIP712_Domain(chainId, 'collateralAccount'),
    types: RelayedAccessUpdateBatchSigningTypes,
    primaryType: 'RelayedAccessUpdateBatch',
    message,
  }
  const innerPayload: AccessUpdateBatchSigningPayload = {
    domain: EIP712_Domain(chainId, 'core'),
    types: AccessUpdateBatchSigningTypes,
    primaryType: 'AccessUpdateBatch',
    message: message.accessUpdateBatch,
  }

  return { relayedAccessUpdateBatch: outerPayload, accessUpdateBatch: innerPayload }
}
