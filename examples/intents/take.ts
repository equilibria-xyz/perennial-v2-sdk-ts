import { addHours } from 'date-fns'
import { config as dotenvConfig } from 'dotenv'
import path from 'path'
import { Hex, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

import Perennial, { Big6Math, SupportedMarket, perennialSepolia, timeToSeconds } from '../../'

dotenvConfig({ path: path.resolve(__dirname, '../../.env.local') })
;(BigInt.prototype as any).toJSON = function () {
  return this.toString()
}

async function run() {
  const walletClient = createWalletClient({
    account: privateKeyToAccount(process.env.PRIVATE_KEY! as Hex),
    chain: perennialSepolia,
    transport: http(process.env.RPC_URL_PERENNIAL_SEPOLIA!),
  })
  const address = walletClient.account.address

  const sdk = new Perennial({
    chainId: perennialSepolia.id,
    rpcUrl: process.env.RPC_URL_PERENNIAL_SEPOLIA!,
    graphUrl: process.env.GRAPH_URL_PERENNIAL_SEPOLIA!,
    pythUrl: process.env.PYTH_URL!,
    cryptexUrl: process.env.CRYPTEX_URL!,
    operatingFor: address,
    walletClient,
  })

  const controller = sdk.contracts.getControllerContract()

  const { innerSignature, outerSignature, relayedTake } = await sdk.collateralAccounts.sign.relayedTake({
    market: SupportedMarket.eth,
    amount: Big6Math.fromFloatString('2'), // Positive for Long, Negative for Short
    referrer: address,
    maxFee: Big6Math.fromFloatString('10'),
    expiry: timeToSeconds(addHours(new Date(), 1), true),
  })
  const { request } = await controller.simulate.relayTake([relayedTake.message, outerSignature, innerSignature], {
    account: walletClient.account,
  })
  const txHash = await walletClient.writeContract(request)

  console.log('Transaction sent:', txHash)
}

run()
