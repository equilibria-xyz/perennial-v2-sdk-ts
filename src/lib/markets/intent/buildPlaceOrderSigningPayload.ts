import { Address } from 'viem'

import { ManagerAddresses, SupportedMarket } from '../../../constants'
import { EIP712_Domain, PlaceOrderSigningPayload, PlaceOrderSigningTypes } from '../../../constants/eip712'
import { CommonOverrides, CommonRequired } from '../../../types/shared'
import { addressForMarket } from '../../../utils/addressUtils'
import { generateNonce } from '../../../utils/intentUtils'

export type BuildPlaceOrderSigningPayloadArgs = CommonRequired &
  CommonOverrides & {
    market: Address | SupportedMarket
    maxRelayFee: bigint
    side: 4 | 5 | 6 // 4 = Maker, 5 = Long, 6 = Short
    comparison: -1 | 1 // -1 = LTE, 1 = GTE
    price: bigint
    delta: bigint
    maxExecutionFee: bigint
    referrer?: Address
    interfaceFee?: {
      amount: bigint
      receiver: Address
      fixedFee: boolean
      unwrap: boolean
    }
    orderId?: bigint
  }

export function buildPlaceOrderSigningPayload({
  chainId,
  expiry,
  address: account,
  market: market_,
  side,
  comparison,
  price,
  delta,
  maxExecutionFee,
  maxRelayFee,
  referrer,
  interfaceFee,
  orderId,
  overrides,
}: BuildPlaceOrderSigningPayloadArgs): { placeOrder: PlaceOrderSigningPayload } {
  const nonce = overrides?.nonce ?? generateNonce()
  const market = addressForMarket(chainId, market_)

  const message = {
    order: {
      side,
      comparison,
      price,
      delta,
      maxFee: maxExecutionFee,
      isSpent: false,
      referrer: referrer ?? account,
      interfaceFee: interfaceFee ?? {
        amount: 0n,
        receiver: account,
        fixedFee: false,
        unwrap: false,
      },
    },
    action: {
      market,
      orderId: orderId ?? generateNonce(),
      maxFee: maxRelayFee,
      common: {
        nonce,
        group: overrides?.group ?? nonce,
        account,
        signer: overrides?.signer ?? account,
        domain: ManagerAddresses[chainId],
        expiry,
      },
    },
  }

  const payload: PlaceOrderSigningPayload = {
    domain: EIP712_Domain(chainId, 'orders'),
    types: PlaceOrderSigningTypes,
    primaryType: 'PlaceOrderAction',
    message,
  }

  return { placeOrder: payload }
}
