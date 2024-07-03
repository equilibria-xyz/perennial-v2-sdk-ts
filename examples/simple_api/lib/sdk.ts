import PerennialSDK from '@perennial/sdk'
import { createWalletClient, http, zeroAddress } from 'viem'
import { arbitrum } from 'viem/chains' // Required for BigInt serialization

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
    const sdk = new PerennialSDK.default({
      chainId: 42161,
      rpcUrl: process.env.RPC_URL_ARBITRUM!,
      graphUrl: process.env.GRAPH_URL_ARBITRUM_NEW!,
      pythUrl: process.env.PYTH_URL!,
      // @ts-ignore
      walletClient,
    })
    return sdk
  } else {
    // Initalize the SDK
    const sdk = new PerennialSDK.default({
      chainId: 42161,
      rpcUrl: process.env.RPC_URL_ARBITRUM!,
      graphUrl: process.env.GRAPH_URL_ARBITRUM_NEW!,
      pythUrl: process.env.PYTH_URL!,
    })
    return sdk
  }
}

export default setupSDK
