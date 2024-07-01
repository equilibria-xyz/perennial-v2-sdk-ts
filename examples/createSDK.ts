import { config as dotenvConfig } from 'dotenv'
import path from 'path'
import { getAddress } from 'viem'

import Perennial, { ChainMarkets, Day, SupportedAsset } from '../'

dotenvConfig({ path: path.resolve(__dirname, '../.env.local') })
;(BigInt.prototype as any).toJSON = function () {
  return this.toString()
}

async function run() {
  const sdk = new Perennial({
    chainId: 421614,
    rpcUrl: process.env.RPC_URL_ARBITRUM_SEPOLIA!,
    graphUrl: process.env.GRAPH_URL_ARBITRUM_SEPOLIA_NEW!,
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

  const address = getAddress('0x1deFb9E9aE40d46C358dc0a185408dc178483851')
  const snapshots = await sdk.markets.read.marketSnapshots({
    address,
    markets: [SupportedAsset.eth],
  })

  const activePositionPnlData = await sdk.markets.read.activePositionsPnl({
    address,
    marketSnapshots: snapshots,
    markets: [SupportedAsset.eth],
  })

  console.log(activePositionPnlData)
}

run()
