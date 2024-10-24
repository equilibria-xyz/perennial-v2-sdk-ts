import { EIP712_Domain, WithdrawalSigningPayload, WithdrawalSigningTypes } from '../../../constants/eip712'
import { CommonOverrides, CommonRequired } from '../../../types/shared'
import { ActionRequred, buildActionMessage } from './_util'

export type BuildWithdrawalSigningPayloadArgs = CommonRequired &
  ActionRequred &
  CommonOverrides & {
    amount: bigint
    unwrap: boolean
  }
export function buildWithdrawalSigningPayload({
  chainId,
  address: account,
  amount,
  unwrap,
  maxFee,
  overrides,
  expiry,
}: BuildWithdrawalSigningPayloadArgs): {
  withdrawal: WithdrawalSigningPayload
} {
  const message = {
    amount,
    unwrap,
    action: buildActionMessage({ maxFee, overrides, expiry, account, chainId }),
  }

  const payload: WithdrawalSigningPayload = {
    domain: EIP712_Domain(chainId, 'collateralAccount'),
    types: WithdrawalSigningTypes,
    primaryType: 'Withdrawal',
    message,
  }

  return { withdrawal: payload }
}
