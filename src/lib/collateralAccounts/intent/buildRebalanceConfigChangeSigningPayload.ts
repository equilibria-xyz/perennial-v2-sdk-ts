import { Address } from 'viem'

import {
  EIP712_Domain,
  RebalanceConfigChangeSigningPayload,
  RebalanceConfigChangeSigningTypes,
} from '../../../constants/eip712'
import { CommonOverrides, CommonRequired } from '../../../types/shared'
import { ActionRequred, buildActionMessage } from './_util'

export type BuildRebalanceConfigChangeSigningPayloadArgs = CommonRequired &
  ActionRequred &
  CommonOverrides & {
    group: bigint
    markets: Address[]
    configs: { target: bigint; threshold: bigint }[]
    rebalanceMaxFee: bigint
  }
export function buildRebalanceConfigChangeSigningPayload({
  chainId,
  address: account,
  group,
  markets,
  configs,
  rebalanceMaxFee,
  maxFee,
  overrides,
  expiry,
}: BuildRebalanceConfigChangeSigningPayloadArgs): {
  rebalanceConfigChange: RebalanceConfigChangeSigningPayload
} {
  const message = {
    group,
    markets,
    configs,
    maxFee: rebalanceMaxFee,
    action: buildActionMessage({ maxFee, overrides, expiry, account, chainId }),
  }

  const payload: RebalanceConfigChangeSigningPayload = {
    domain: EIP712_Domain(chainId, 'collateralAccount'),
    types: RebalanceConfigChangeSigningTypes,
    primaryType: 'RebalanceConfigChange',
    message,
  }

  return { rebalanceConfigChange: payload }
}
