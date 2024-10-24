import { addDays } from 'date-fns'
import { config as dotenvConfig } from 'dotenv'
import path from 'path'
import { Hex, createWalletClient, getAddress, http, zeroAddress } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arbitrumSepolia } from 'viem/chains'

import Perennial, { Big6Math, ChainMarkets, SupportedMarket, timeToSeconds } from '../../'

dotenvConfig({ path: path.resolve(__dirname, '../../.env.local') })
;(BigInt.prototype as any).toJSON = function () {
  return this.toString()
}

const IntentURLBase = process.env.INTENT_URL_BASE

async function run() {
  const markets = [SupportedMarket.eth]
  const walletClient = createWalletClient({
    account: privateKeyToAccount(process.env.PRIVATE_KEY! as Hex),
    chain: arbitrumSepolia,
    transport: http(process.env.RPC_URL_ARBITRUM_SEPOLIA!),
  })

  const address = walletClient.account.address
  const originator = zeroAddress // Order originator receives a cut of the subtractive fee
  const solver = zeroAddress // Order Solver API receives a cut of the subtractive fee

  const amount = Big6Math.fromFloatString('-0.001111')

  const sdk = new Perennial({
    chainId: arbitrumSepolia.id,
    rpcUrl: process.env.RPC_URL_ARBITRUM_SEPOLIA!,
    graphUrl: process.env.GRAPH_URL_ARBITRUM!,
    pythUrl: process.env.PYTH_URL!,
    cryptexUrl: process.env.CRYPTEX_URL!,
    supportedMarkets: markets,
    walletClient,
  })

  const marketID = `${sdk.currentChainId}:${ChainMarkets[sdk.currentChainId].eth}`
  const quoteRes = await fetch(`${IntentURLBase}/quotes/market?marketID=${marketID}&amount=${amount}`)
  if (!quoteRes.ok) throw new Error(`Failed to get quote: ${quoteRes.statusText}: ${await quoteRes.text()}`)
  const quote = await quoteRes.json()
  console.log('Received quote', quote)

  // Buffer amount based on market price to immediately execute
  const price = BigInt(quote.price) + (amount < 0n ? -1n : 1n) * Big6Math.fromFloatString('10')
  const {
    intent: { message: intent },
    signature,
  } = await sdk.markets.sign.intent({
    intent: {
      amount: BigInt(amount),
      price,
      fee: Big6Math.fromFloatString('0.1'),
      originator,
      solver,
      collateralization: 0n,
    },
    market: SupportedMarket.eth,
    address,
    expiry: timeToSeconds(addDays(new Date(), 30).getTime(), true),
  })

  console.log('Intent signed', intent)
  console.log('Intent signature', signature)
  const body = JSON.stringify([
    {
      chainID: String(arbitrumSepolia.id),
      marketID,
      intent,
      signature,
      executedAt: 0,
      expiry: Number(intent.common.expiry),
      status: '',
    },
  ])
  const res = await fetch(`${IntentURLBase}/orders/limit`, {
    method: 'POST',
    body,
  })
  if (!res.ok) throw new Error(`Failed to place limit order: ${res.statusText}: ${await res.text()}`)

  const response = await res.json()
  console.log('Limit Order placed', response)
}

run()
