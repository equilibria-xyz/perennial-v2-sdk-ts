import { Address, SignTypedDataParameters } from 'viem'

import { MarketFactoryAddresses, SupportedChainId, SupportedMarket, VerifierAddresses } from '../../constants'
import {
  CommonSigningTypes,
  EIP712_Domain,
  IntentSigningTypes,
  OperatorUpdateSigningTypes,
  SignerUpdateSigningTypes,
} from '../../types/eip712'
import { Intent } from '../../types/perennial'
import { addressForMarket } from '../../utils/addressUtils'

type CommonRequired = {
  address: Address
  expiry: bigint
}
type CommonOverrides = {
  signer?: Address
  group?: bigint
  nonce?: bigint
}

export type BuildIntentSigningPayloadArgs = CommonRequired & {
  chainId: SupportedChainId
  intent: Omit<Intent, 'common'>
  market: SupportedMarket | Address
  overrides?: CommonOverrides
}
export type IntentSigningPayload = Omit<SignTypedDataParameters<typeof IntentSigningTypes, 'Intent'>, 'account'>
export function buildIntentSigningPayload({
  chainId,
  intent,
  address: account,
  market,
  expiry,
  overrides,
}: BuildIntentSigningPayloadArgs): IntentSigningPayload {
  const nonce = overrides?.nonce ?? generateNonce()
  const marketAddress = addressForMarket(chainId, market)

  const message = {
    ...intent,
    common: {
      nonce,
      group: overrides?.group ?? nonce,
      account,
      signer: overrides?.signer ?? account,
      domain: marketAddress,
      expiry,
    },
  }
  const payload: IntentSigningPayload = {
    domain: EIP712_Domain(chainId),
    types: IntentSigningTypes,
    primaryType: 'Intent',
    message,
  }

  return payload
}

export type BuildSignerUpdateSigningPayloadArgs = CommonRequired & {
  chainId: SupportedChainId
  newSigner: Address
  approved: boolean
  overrides?: CommonOverrides
}
export type SignerUpdateSigningPayload = Omit<
  SignTypedDataParameters<typeof SignerUpdateSigningTypes, 'SignerUpdate'>,
  'account'
>
export function buildSignerUpdateSigningPayload({
  chainId,
  address: account,
  newSigner,
  approved,
  overrides,
  expiry,
}: BuildSignerUpdateSigningPayloadArgs): SignerUpdateSigningPayload {
  const nonce = overrides?.nonce ?? generateNonce()

  const message = {
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
  }

  const payload: SignerUpdateSigningPayload = {
    domain: EIP712_Domain(chainId),
    types: SignerUpdateSigningTypes,
    primaryType: 'SignerUpdate',
    message,
  }

  return payload
}
export type BuildOperatorUpdateSigningPayloadArgs = CommonRequired & {
  chainId: SupportedChainId
  newOperator: Address
  approved: boolean
  overrides?: CommonOverrides
}
export type OperatorUpdateSigningPayload = Omit<
  SignTypedDataParameters<typeof OperatorUpdateSigningTypes, 'OperatorUpdate'>,
  'account'
>
export function buildOperatorUpdateSigningPayload({
  chainId,
  address: account,
  newOperator,
  approved,
  overrides,
  expiry,
}: BuildOperatorUpdateSigningPayloadArgs): OperatorUpdateSigningPayload {
  const nonce = overrides?.nonce ?? generateNonce()

  const message = {
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
  }

  const payload: OperatorUpdateSigningPayload = {
    domain: EIP712_Domain(chainId),
    types: OperatorUpdateSigningTypes,
    primaryType: 'OperatorUpdate',
    message,
  }

  return payload
}

// TODO: AccessUpdate batch?
export type BuildCancelNonceSigningPayloadArgs = CommonRequired & {
  chainId: SupportedChainId
  nonce: bigint
  expiry: bigint
  overrides?: Omit<CommonOverrides, 'nonce'>
}
export type CancelNonceSigningPayload = Omit<SignTypedDataParameters<typeof CommonSigningTypes, 'Common'>, 'account'>
export function buildCancelNonceSigningPayload({
  chainId,
  nonce,
  expiry,
  address: account,
  overrides,
}: BuildCancelNonceSigningPayloadArgs): CancelNonceSigningPayload {
  const message = {
    nonce,
    expiry,
    domain: VerifierAddresses[chainId],
    account,
    signer: overrides?.signer ?? account,
    group: overrides?.group ?? nonce,
  }

  const payload: CancelNonceSigningPayload = {
    domain: EIP712_Domain(chainId),
    types: CommonSigningTypes,
    primaryType: 'Common',
    message,
  }

  return payload
}
// TODO: Cancel Group

function generateNonce() {
  return BigInt(Date.now())
}
