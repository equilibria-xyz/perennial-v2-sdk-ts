import { config as dotenvConfig } from 'dotenv'
import path from 'path'

import Perennial from '../'

dotenvConfig({ path: path.resolve(__dirname, '../.env.local') })

async function run() {
  const sdk = new Perennial({
    chainId: 42161,
    rpcUrl: process.env.RPC_URL_ARBITRUM!,
    graphUrl: process.env.GRAPH_URL_ARBITRUM!,
    pythUrl: process.env.PYTH_URL!,
  })
  const marketOracles = await sdk.markets.read.marketOracles()
  console.log(marketOracles)
}

run()
