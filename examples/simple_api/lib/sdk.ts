import PerennialSDK, { SupportedChainId, perennial, perennialSepolia } from '@perennial/sdk'
import { Chain } from 'viem'
import { arbitrum, arbitrumSepolia } from 'viem/chains' // Required for BigInt serialization

;(BigInt.prototype as any).toJSON = function () {
  return this.toString()
}

const ChainIdToArgs: Record<
  SupportedChainId,
  {
    chain: Chain
    rpcUrl: string
    graphUrl: string
    pythUrl: string
    cryptexUrl: string
    storkUrl: string
    storkApiKey: string
  }
> = {
  [arbitrum.id]: {
    chain: arbitrum,
    rpcUrl: process.env.RPC_URL_ARBITRUM!,
    graphUrl: process.env.GRAPH_URL_ARBITRUM!,
    pythUrl: process.env.PYTH_URL!,
    cryptexUrl: process.env.CRYPTEX_URL!,
    storkUrl: process.env.STORK_URL!,
    storkApiKey: process.env.STORK_API_KEY!,
  },
  [arbitrumSepolia.id]: {
    chain: arbitrumSepolia,
    rpcUrl: process.env.RPC_URL_ARBITRUM_SEPOLIA!,
    graphUrl: process.env.GRAPH_URL_ARBITRUM_SEPOLIA!,
    pythUrl: process.env.PYTH_URL!,
    cryptexUrl: process.env.CRYPTEX_URL_TESTNET!,
    storkUrl: process.env.STORK_URL!,
    storkApiKey: process.env.STORK_API_KEY!,
  },
  [perennial.id]: {
    chain: perennial,
    rpcUrl: process.env.RPC_URL_PERENNIAL!,
    graphUrl: process.env.GRAPH_URL_PERENNIAL!,
    pythUrl: process.env.PYTH_URL!,
    cryptexUrl: process.env.CRYPTEX_URL!,
    storkUrl: process.env.STORK_URL!,
    storkApiKey: process.env.STORK_API_KEY!,
  },
  [perennialSepolia.id]: {
    chain: perennialSepolia,
    rpcUrl: process.env.RPC_URL_PERENNIAL_SEPOLIA!,
    graphUrl: process.env.GRAPH_URL_PERENNIAL_SEPOLIA!,
    pythUrl: process.env.PYTH_URL!,
    cryptexUrl: process.env.CRYPTEX_URL_TESTNET!,
    storkUrl: process.env.STORK_URL!,
    storkApiKey: process.env.STORK_API_KEY!,
  },
}

const setupSDK = (chainId: SupportedChainId, wallet?: `0x${string}`) => {
  const args = ChainIdToArgs[chainId]
  const sdk = new PerennialSDK.default(
    wallet
      ? {
          chainId: chainId,
          rpcUrl: args.rpcUrl,
          graphUrl: args.graphUrl,
          pythUrl: args.pythUrl,
          cryptexUrl: args.cryptexUrl,
          operatingFor: wallet,
          storkConfig: {
            url: args.storkUrl,
            apiKey: args.storkApiKey,
          },
        }
      : {
          chainId: chainId,
          rpcUrl: args.rpcUrl,
          graphUrl: args.graphUrl,
          pythUrl: args.pythUrl,
          cryptexUrl: args.cryptexUrl,
          storkConfig: {
            url: args.storkUrl,
            apiKey: args.storkApiKey,
          },
        },
  )
  return sdk
}

export default setupSDK
