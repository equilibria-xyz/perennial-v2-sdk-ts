import { createWalletClient, http, zeroAddress } from 'viem'
import { arbitrum } from 'viem/chains'

import Perennial from '../../../../' // Required for BigInt serialization

;(BigInt.prototype as any).toJSON = function () {
  return this.toString()
}

const setupSDK = (wallet?: `0x${string}`) => {
  if (wallet) {
    const walletClient = createWalletClient({
      account: (wallet as `0x${string}`) || zeroAddress,
      chain: arbitrum,
      transport: http(process.env.RPC_URL_ARBITRUM),
    })
    // Initalize the SDK
    return new Perennial({
      chainId: arbitrum.id,
      rpcUrl: process.env.RPC_URL_ARBITRUM!,
      graphUrl: process.env.GRAPH_URL_ARBITRUM!,
      pythUrl: process.env.PYTH_URL!,
      // @ts-ignore
      walletClient,
    })
  } else {
    // Initalize the SDK
    return new Perennial({
      chainId: arbitrum.id,
      rpcUrl: process.env.RPC_URL_ARBITRUM!,
      graphUrl: process.env.GRAPH_URL_ARBITRUM!,
      pythUrl: process.env.PYTH_URL!,
    })
  }
}

export default setupSDK
