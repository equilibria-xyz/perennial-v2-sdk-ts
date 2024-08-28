import { HermesClient } from '@pythnetwork/hermes-client'
import { Chain, PublicClient } from 'viem'
import { arbitrum, arbitrumSepolia } from 'viem/chains'

export const DefaultChain = arbitrum
export const SupportedChainIds = [arbitrum.id, arbitrumSepolia.id] as const
export const chainIdToChainMap = {
  [arbitrum.id]: arbitrum,
  [arbitrumSepolia.id]: arbitrumSepolia,
}

export type SupportedChainId = (typeof SupportedChainIds)[number]
export const BackupPythClient = new HermesClient('https://hermes.pyth.network', {
  timeout: 30000,
})
export const pythBenchmarksURL = 'https://benchmarks.pyth.network'

export const chains: { [chainId in SupportedChainId]: Chain } = {
  [arbitrum.id]: arbitrum,
  [arbitrumSepolia.id]: arbitrumSepolia,
}

export const ExplorerURLs: { [chainId in SupportedChainId]: string } = {
  [arbitrum.id]: arbitrum.blockExplorers.default.url,
  [arbitrumSepolia.id]: arbitrumSepolia.blockExplorers.default.url,
}

export const ExplorerNames: { [chainId in SupportedChainId]: string } = {
  [arbitrum.id]: arbitrum.blockExplorers.default.name,
  [arbitrumSepolia.id]: arbitrumSepolia.blockExplorers.default.name,
}

export const isSupportedChain = (chainId?: number) =>
  chainId !== undefined && SupportedChainIds.includes(chainId as SupportedChainId)
export const mainnetChains = [arbitrum]
export const isTestnet = (chainId?: number) => mainnetChains.every((c) => c.id !== chainId)

export function getRpcURLFromPublicClient(publicClient: PublicClient) {
  if (publicClient.transport.type === 'fallback') return publicClient.transport.transports[0].value.url
  return publicClient.transport.url
}
