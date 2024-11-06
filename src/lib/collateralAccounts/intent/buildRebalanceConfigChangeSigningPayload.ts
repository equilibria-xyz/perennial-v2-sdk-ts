import { Address } from 'viem'

import {
  EIP712_Domain,
  RebalanceConfigChangeSigningPayload,
  RebalanceConfigChangeSigningTypes,
} from '../../../constants/eip712'
import { SupportedMarket } from '../../../constants/markets'
import { CommonOverrides, CommonRequired } from '../../../types/shared'
import { addressForMarket } from '../../../utils/addressUtils'
import { ActionRequred, buildActionMessage } from './_util'

export type BuildRebalanceConfigChangeSigningPayloadArgs = CommonRequired &
  ActionRequred &
  CommonOverrides & {
    group: bigint
    markets: (Address | SupportedMarket)[]
    configs: { target: bigint; threshold: bigint }[]
    rebalanceMaxFee: bigint
  }
export function buildRebalanceConfigChangeSigningPayload({
  chainId,
  address: account,
  group,
  markets: markets_,
  configs,
  rebalanceMaxFee,
  maxFee,
  overrides,
  expiry,
}: BuildRebalanceConfigChangeSigningPayloadArgs): {
  rebalanceConfigChange: RebalanceConfigChangeSigningPayload
} {
  const markets = markets_.map((market) => addressForMarket(chainId, market))
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
