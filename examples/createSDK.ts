import { config as dotenvConfig } from 'dotenv'

dotenvConfig({ path: './.env.local' })
import Perennial from '../'

async function run() {
  const sdk = new Perennial({
    chainId: 42161,
    rpcUrl: `https://arb-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_PROD_KEYS}`,
    graphUrl: process.env.GRAPH_URL_ARBITRUM_2!,
    pythUrl: process.env.P2P_HERMES_URL!,
  })
  const marketOracles = await sdk.markets.read.fetchMarketOraclesV2()
  console.log(marketOracles)
}

run()
