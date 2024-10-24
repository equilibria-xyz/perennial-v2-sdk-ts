import { config as dotenvConfig } from 'dotenv'
import path from 'path'
import { getAddress } from 'viem'
import { arbitrum, arbitrumSepolia } from 'viem/chains'

import Perennial, { ChainMarkets, Day, PositionSide, SupportedMarket } from '../'

dotenvConfig({ path: path.resolve(__dirname, '../.env.local') })
;(BigInt.prototype as any).toJSON = function () {
  return this.toString()
}

async function run() {
  const markets = [SupportedMarket.eth /* , SupportedMarket.xau, SupportedMarket.btc, SupportedMarket.sol */]
  const address = getAddress('0x1deFb9E9aE40d46C358dc0a185408dc178483851')
  const sdk = new Perennial({
    chainId: arbitrumSepolia.id,
    rpcUrl: process.env.RPC_URL_ARBITRUM_SEPOLIA!,
    graphUrl: process.env.GRAPH_URL_ARBITRUM_NEW!,
    pythUrl: process.env.PYTH_URL!,
    cryptexUrl: process.env.CRYPTEX_URL!,
    operatingFor: address,
    supportedMarkets: markets,
  })

  console.log(
    await sdk.markets.read.settlementFees(),
    await sdk.markets.read.settlementFees({ markets: [SupportedMarket.meem] }),
  )
}

run()
