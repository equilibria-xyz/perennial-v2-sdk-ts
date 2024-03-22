import { config as dotenvConfig } from 'dotenv'
import Perennial from '../'
import path from 'path'
dotenvConfig({ path: path.resolve(__dirname, '../.env.local') })

async function run() {
  const sdk = new Perennial({
    chainId: 42161,
    rpcUrl: `https://arb-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_PROD_KEYS}`,
    graphUrl: process.env.GRAPH_URL_ARBITRUM_2!,
    pythUrl: process.env.P2P_HERMES_URL!,
  })
  const marketOracles = await sdk.markets.read.marketOracles()
  console.log(marketOracles)
}

run()
