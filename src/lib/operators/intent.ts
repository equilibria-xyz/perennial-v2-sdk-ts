import { Address } from 'viem'

import { ControllerAddresses, MarketFactoryAddresses, SupportedChainId } from '../../constants'
import {
  DeployAccountSigningPayload,
  DeployAccountSigningTypes,
  EIP712_Domain,
  OperatorUpdateSigningPayload,
  OperatorUpdateSigningTypes,
  RelayedOperatorUpdateSigningPayload,
  RelayedOperatorUpdateSigningTypes,
  RelayedSignerUpdateSigningPayload,
  RelayedSignerUpdateSigningTypes,
  SignerUpdateSigningPayload,
  SignerUpdateSigningTypes,
} from '../../constants/eip712'
import { CommonOverrides, CommonRequired } from '../../types/shared'
import { generateNonce } from '../../utils/intentUtils'

export type BuildRelayedSignerUpdateSigningPayloadArgs = CommonRequired & {
  chainId: SupportedChainId
  newSigner: Address
  approved: boolean
  maxFee: bigint
  overrides?: CommonOverrides
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
  const nonce = overrides?.nonce ?? generateNonce()

  const message = {
    signerUpdate: {
      access: {
        accessor: newSigner,
        approved,
      },
      common: {
        nonce,
        group: overrides?.group ?? nonce,
        account,
        signer: overrides?.signer ?? account,
        domain: MarketFactoryAddresses[chainId],
        expiry,
      },
    },
    action: {
      maxFee,
      common: {
        nonce,
        group: overrides?.group ?? nonce,
        account,
        signer: overrides?.signer ?? account,
        domain: ControllerAddresses[chainId],
        expiry,
      },
    },
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

export type BuildRelayedOperatorUpdateSigningPayloadArgs = CommonRequired & {
  chainId: SupportedChainId
  newOperator: Address
  approved: boolean
  maxFee: bigint
  overrides?: CommonOverrides
}
export function buildRelayedOperatorUpdateSigningPayload({
  chainId,
  address: account,
  newOperator,
  approved,
  maxFee,
  overrides,
  expiry,
}: BuildRelayedOperatorUpdateSigningPayloadArgs): {
  operatorUpdate: OperatorUpdateSigningPayload
  relayedOperatorUpdate: RelayedOperatorUpdateSigningPayload
} {
  const nonce = overrides?.nonce ?? generateNonce()

  const message = {
    operatorUpdate: {
      access: {
        accessor: newOperator,
        approved,
      },
      common: {
        nonce,
        group: overrides?.group ?? nonce,
        account,
        signer: overrides?.signer ?? account,
        domain: MarketFactoryAddresses[chainId],
        expiry,
      },
    },
    action: {
      maxFee,
      common: {
        nonce,
        group: overrides?.group ?? nonce,
        account,
        signer: overrides?.signer ?? account,
        domain: ControllerAddresses[chainId],
        expiry,
      },
    },
  }

  const outerPayload: RelayedOperatorUpdateSigningPayload = {
    domain: EIP712_Domain(chainId, 'collateralAccount'),
    types: RelayedOperatorUpdateSigningTypes,
    primaryType: 'RelayedOperatorUpdate',
    message,
  }
  const innerPayload: OperatorUpdateSigningPayload = {
    domain: EIP712_Domain(chainId, 'core'),
    types: OperatorUpdateSigningTypes,
    primaryType: 'OperatorUpdate',
    message: message.operatorUpdate,
  }

  return { relayedOperatorUpdate: outerPayload, operatorUpdate: innerPayload }
}

export type BuildDeployAccountSigningPayloadArgs = CommonRequired & {
  chainId: SupportedChainId
  maxFee: bigint
  overrides?: CommonOverrides
}
export function buildDeployAccountSigningPayload({
  chainId,
  address: account,
  maxFee,
  overrides,
  expiry,
}: BuildDeployAccountSigningPayloadArgs): {
  deployAccount: DeployAccountSigningPayload
} {
  const nonce = overrides?.nonce ?? generateNonce()

  const message = {
    action: {
      maxFee,
      common: {
        nonce,
        group: overrides?.group ?? nonce,
        account,
        signer: overrides?.signer ?? account,
        domain: ControllerAddresses[chainId],
        expiry,
      },
    },
  }

  const payload: DeployAccountSigningPayload = {
    domain: EIP712_Domain(chainId, 'collateralAccount'),
    types: DeployAccountSigningTypes,
    primaryType: 'DeployAccount',
    message,
  }

  return { deployAccount: payload }
}
