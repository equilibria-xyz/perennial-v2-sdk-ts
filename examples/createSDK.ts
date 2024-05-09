import { config as dotenvConfig } from 'dotenv'
import path from 'path'
import { getAddress } from 'viem'

import Perennial from '../'

dotenvConfig({ path: path.resolve(__dirname, '../.env.local') })

async function run() {
  const sdk = new Perennial({
    chainId: 42161,
    rpcUrl: process.env.RPC_URL_ARBITRUM!,
    graphUrl: process.env.GRAPH_URL_ARBITRUM!,
    pythUrl: process.env.PYTH_URL!,
  })
  // const marketOracles = await sdk.markets.read.marketOracles()
  // console.log(marketOracles)

  // const volumeData = await sdk.markets.read.market24hrData({
  //   market: getAddress('0x90A664846960AaFA2c164605Aebb8e9Ac338f9a0'),
  // })
  // console.log(volumeData)

  // const volumeData2 = await sdk.markets.read.markets24hrData({
  //   markets: [
  //     getAddress('0x90A664846960AaFA2c164605Aebb8e9Ac338f9a0'),
  //     getAddress('0xcC83e3cDA48547e3c250a88C8D5E97089Fd28F60'),
  //   ],
  // })
  // console.log(volumeData2)

  const tradeHistory = await sdk.markets.read.tradeHistory({
    address: getAddress('0x325cd6b3cd80edb102ac78848f5b127eb6db13f3'),
    first: 100,
    offset: 0,
  })

  console.log(tradeHistory)
}

run()
