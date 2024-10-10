import { Address } from 'viem'

import { AccountVerifierAddresses, OrderVerifierAddresses, SupportedChainId, VerifierAddresses } from '../..'

export type VerifierType = 'core' | 'collateralAccount' | 'orders'
export function VerifyingContractForType(chainId: SupportedChainId, verifierType: VerifierType): Address {
  return verifierType === 'core'
    ? VerifierAddresses[chainId]
    : verifierType === 'collateralAccount'
      ? AccountVerifierAddresses[chainId]
      : OrderVerifierAddresses[chainId]
}

export type PerennialEIP712DomainName = 'Perennial' | 'Perennial V2 Collateral Accounts' | 'Perennial V2 Trigger Orders'
export function DomainNameForType(verifierType: VerifierType): PerennialEIP712DomainName {
  return verifierType === 'core'
    ? 'Perennial'
    : verifierType === 'collateralAccount'
      ? 'Perennial V2 Collateral Accounts'
      : 'Perennial V2 Trigger Orders'
}

export type PerennialEIP712Domain = {
  name: PerennialEIP712DomainName
  version: '1.0.0'
  chainId: SupportedChainId
  verifyingContract: Address
}
export const EIP712_Domain = (chainId: SupportedChainId, verifierType: VerifierType): PerennialEIP712Domain => {
  const verifyingContract = VerifyingContractForType(chainId, verifierType)

  return { name: DomainNameForType(verifierType), version: '1.0.0', chainId, verifyingContract }
}
