import { BaseError, ContractFunctionRevertedError, decodeErrorResult } from 'viem'

import { AllErrorsAbi } from '../abi/AllErrors.abi'
import { SupportedChainId } from '../constants/network'
import { ChainVaults, PerennialVaultType } from '../constants/vaults'

export function getVaultAddressForType(vaultType: PerennialVaultType, chainId: SupportedChainId) {
  switch (vaultType) {
    case 'alpha':
      return ChainVaults[chainId]?.alpha

    case 'bravo':
      return ChainVaults[chainId]?.bravo
  }
}

export const bufferGasLimit = (estimatedGas: bigint) => (estimatedGas * 3n) / 2n

export function parseViemContractCustomError(err: unknown) {
  if (err instanceof BaseError) {
    const revertError = err.walk((err) => err instanceof ContractFunctionRevertedError)
    if (revertError instanceof ContractFunctionRevertedError) {
      const errorName = revertError.data?.errorName
      if (errorName) return errorName

      if (revertError.signature) {
        const decodedData = decodeErrorResult({ abi: AllErrorsAbi, data: revertError.signature })
        return decodedData.errorName
      }
    }
  }
}
