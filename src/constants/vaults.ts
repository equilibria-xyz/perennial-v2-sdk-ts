import { Address, getAddress } from 'viem'
import { arbitrum, arbitrumSepolia, base } from 'viem/chains'

import { notEmpty } from '../utils/arrayUtils'
import { SupportedChainId } from './network'

export enum PerennialVaultType {
  alpha = 'alpha',
  bravo = 'bravo',
}

export const SupportedVaults: {
  [chainId in SupportedChainId]: { [vault in PerennialVaultType]?: boolean }
} = {
  [arbitrum.id]: { alpha: true, bravo: true },
  [arbitrumSepolia.id]: { alpha: false, bravo: false },
  [base.id]: { alpha: false, bravo: false },
}

export const VaultMetadata: {
  [chainId in SupportedChainId]: { [key in PerennialVaultType]?: { name: string } }
} = {
  [arbitrum.id]: {
    [PerennialVaultType.alpha]: { name: 'ETH Vault' },
    [PerennialVaultType.bravo]: { name: 'BTC Vault' },
  },
  [arbitrumSepolia.id]: {
    [PerennialVaultType.alpha]: { name: 'ETH Vault' },
    [PerennialVaultType.bravo]: { name: 'BTC Vault' },
  },
  [base.id]: {},
}

export const ChainVaults: {
  [chainId in SupportedChainId]: {
    [vault in PerennialVaultType]?: Address
  }
} = {
  [arbitrum.id]: {
    alpha: getAddress('0xF8b6010FD6ba8F3E52c943A1473B1b1459a73094'),
    bravo: getAddress('0x699e37DfCEe5c6E4c5D0bC1C2FFbC2afEC55f6FB'),
  },
  [arbitrumSepolia.id]: {
    alpha: getAddress('0xB3820Ef7fF9cbd3f9FF9176C19464b3178fB2bC3'),
  },

  [base.id]: {},
}

export const chainVaultsWithAddress = (chainId: SupportedChainId) => {
  return Object.entries(ChainVaults[chainId])
    .map(([vault, vaultAddress]) => (!!vaultAddress ? { vault: vault as PerennialVaultType, vaultAddress } : null))
    .filter(notEmpty)
}
