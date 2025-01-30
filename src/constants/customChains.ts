import { defineChain } from 'viem'
import { base, baseSepolia } from 'viem/chains'

export const perennialSepolia = defineChain({
  id: 60850,
  name: 'Perennial Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-perennial-testnet-op-base-tia-dphnnr04wr.t.conduit.xyz'],
      webSocket: ['wss://rpc-perennial-testnet-op-base-tia-dphnnr04wr.t.conduit.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer-perennial-testnet-op-base-tia-dphnnr04wr.t.conduit.xyz/' },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 1,
    },
  },
  sourceId: baseSepolia.id,
})

export const perennial = defineChain({
  id: 1424,
  name: 'Perennial',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.perennial.foundation'],
      webSocket: ['wss://rpc.perennial.foundation'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.perennial.foundation' },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 1,
    },
  },
  sourceId: base.id,
})
