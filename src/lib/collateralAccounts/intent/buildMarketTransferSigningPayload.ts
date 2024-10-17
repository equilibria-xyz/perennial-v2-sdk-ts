import { Address } from 'viem'

import { EIP712_Domain, MarketTransferSigningPayload, MarketTransferSigningTypes } from '../../../constants/eip712'
import { CommonOverrides, CommonRequired } from '../../../types/shared'
import { ActionRequred, buildActionMessage } from './_util'

export type BuildMarketTransferSigningPayloadArgs = CommonRequired &
  ActionRequred &
  CommonOverrides & {
    market: Address
    amount: bigint
  }
export function buildMarketTransferSigningPayload({
  chainId,
  address: account,
  maxFee,
  market,
  amount,
  overrides,
  expiry,
}: BuildMarketTransferSigningPayloadArgs): {
  marketTransfer: MarketTransferSigningPayload
} {
  const message = {
    market,
    amount,
    action: buildActionMessage({ maxFee, overrides, expiry, account, chainId }),
  }

  const payload: MarketTransferSigningPayload = {
    domain: EIP712_Domain(chainId, 'collateralAccount'),
    types: MarketTransferSigningTypes,
    primaryType: 'MarketTransfer',
    message,
  }

  return { marketTransfer: payload }
}
