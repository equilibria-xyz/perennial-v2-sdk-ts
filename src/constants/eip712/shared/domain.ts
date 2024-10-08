import { AccountVerifierAddresses, OrderVerifierAddresses, SupportedChainId, VerifierAddresses } from '../..'

export type VerifierType = 'core' | 'collateralAccount' | 'orders'
export function VerifyingContractForType(chainId: SupportedChainId, verifierType: VerifierType) {
  return verifierType === 'core'
    ? VerifierAddresses[chainId]
    : verifierType === 'collateralAccount'
      ? AccountVerifierAddresses[chainId]
      : OrderVerifierAddresses[chainId]
}
export function DomainNameForType(verifierType: VerifierType) {
  return verifierType === 'core'
    ? 'Perennial'
    : verifierType === 'collateralAccount'
      ? 'Perennial V2 Collateral Accounts'
      : 'Perennial V2 Trigger Orders'
}

export const EIP712_Domain = (chainId: SupportedChainId, verifierType: VerifierType) => {
  const verifyingContract = VerifyingContractForType(chainId, verifierType)

  return { name: DomainNameForType(verifierType), version: '1.0.0', chainId, verifyingContract }
}
