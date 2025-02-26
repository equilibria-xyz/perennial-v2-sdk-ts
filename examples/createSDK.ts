import { config as dotenvConfig } from 'dotenv'
import path from 'path'
import { getAddress } from 'viem'

import Perennial, { SupportedMarket, perennial } from '../'

dotenvConfig({ path: path.resolve(__dirname, '../.env.local') })
;(BigInt.prototype as any).toJSON = function () {
  return this.toString()
}

async function run() {
  const markets = [SupportedMarket.eth, SupportedMarket.xau, SupportedMarket.btc, SupportedMarket.sol]
  const address = getAddress('0x1deFb9E9aE40d46C358dc0a185408dc178483851')
  const sdk = new Perennial({
    chainId: perennial.id,
    rpcUrl: process.env.RPC_URL_PERENNIAL!,
    graphUrl: process.env.GRAPH_URL_PERENNIAL!,
    pythUrl: process.env.PYTH_URL!,
    cryptexUrl: process.env.CRYPTEX_URL!,
    storkConfig: {
      url: process.env.STORK_URL!,
      apiKey: process.env.STORK_API_KEY!,
    },
    operatingFor: address,
    supportedMarkets: markets,
  })

  console.log(await sdk.markets.read.marketSnapshots())
}

run()
