import PerennialSDK, { SupportedChainId } from '@perennial/sdk'
import { Chain } from 'viem'
import { arbitrum, arbitrumSepolia } from 'viem/chains' // Required for BigInt serialization

;(BigInt.prototype as any).toJSON = function () {
  return this.toString()
}

const ChainIdToArgs: Record<
  SupportedChainId,
  { chain: Chain; rpcUrl: string; graphUrl: string; pythUrl: string; cryptexUrl: string }
> = {
  [arbitrum.id]: {
    chain: arbitrum,
    rpcUrl: process.env.RPC_URL_ARBITRUM!,
    graphUrl: process.env.GRAPH_URL_ARBITRUM!,
    pythUrl: process.env.PYTH_URL!,
    cryptexUrl: process.env.CRYPTEX_URL!,
  },
  [arbitrumSepolia.id]: {
    chain: arbitrumSepolia,
    rpcUrl: process.env.RPC_URL_ARBITRUM_SEPOLIA!,
    graphUrl: process.env.GRAPH_URL_ARBITRUM_SEPOLIA!,
    pythUrl: process.env.PYTH_URL!,
    cryptexUrl: process.env.CRYPTEX_URL_TESTNET!,
  },
}

const setupSDK = (chainId: SupportedChainId, wallet: `0x${string}`) => {
  const args = ChainIdToArgs[chainId]
  const sdk = new PerennialSDK.default({
    chainId: chainId,
    rpcUrl: args.rpcUrl,
    graphUrl: args.graphUrl,
    pythUrl: args.pythUrl,
    cryptexUrl: args.cryptexUrl,
    operatingFor: wallet,
  })
  return sdk
}

export default setupSDK
