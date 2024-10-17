import { Address, PublicClient } from 'viem'

import { SupportedChainId } from '../../../constants'
import { getControllerContract } from '../../contracts'

export type ReadCollateralAccountAddressArgs = {
  chainId: SupportedChainId
  publicClient: PublicClient
  address: Address
}
export function readCollateralAccountAddress({
  chainId,
  publicClient,
  address: owner,
}: ReadCollateralAccountAddressArgs) {
  const controller = getControllerContract(chainId, publicClient)
  return controller.read.getAccountAddress([owner])
}
