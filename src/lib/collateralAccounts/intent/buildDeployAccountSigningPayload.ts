import { DeployAccountSigningPayload, DeployAccountSigningTypes, EIP712_Domain } from '../../../constants/eip712'
import { CommonOverrides, CommonRequired } from '../../../types/shared'
import { ActionRequred, buildActionMessage } from './_util'

export type BuildDeployAccountSigningPayloadArgs = CommonRequired & ActionRequred & CommonOverrides
export function buildDeployAccountSigningPayload({
  chainId,
  address: account,
  maxFee,
  overrides,
  expiry,
}: BuildDeployAccountSigningPayloadArgs): {
  deployAccount: DeployAccountSigningPayload
} {
  const message = {
    action: buildActionMessage({ maxFee, overrides, expiry, account, chainId }),
  }

  const payload: DeployAccountSigningPayload = {
    domain: EIP712_Domain(chainId, 'collateralAccount'),
    types: DeployAccountSigningTypes,
    primaryType: 'DeployAccount',
    message,
  }

  return { deployAccount: payload }
}
