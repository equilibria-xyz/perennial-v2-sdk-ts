import { addHours } from 'date-fns'
import { config as dotenvConfig } from 'dotenv'
import path from 'path'
import { Hex, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arbitrumSepolia } from 'viem/chains'

import Perennial, { Big6Math, SupportedMarket, timeToSeconds } from '../../'

dotenvConfig({ path: path.resolve(__dirname, '../../.env.local') })
;(BigInt.prototype as any).toJSON = function () {
  return this.toString()
}

async function run() {
  const walletClient = createWalletClient({
    account: privateKeyToAccount(process.env.PRIVATE_KEY! as Hex),
    chain: arbitrumSepolia,
    transport: http(process.env.RPC_URL_ARBITRUM_SEPOLIA!),
  })
  const address = walletClient.account.address

  const sdk = new Perennial({
    chainId: arbitrumSepolia.id,
    rpcUrl: process.env.RPC_URL_ARBITRUM_SEPOLIA!,
    graphUrl: process.env.GRAPH_URL_ARBITRUM!,
    pythUrl: process.env.PYTH_URL!,
    cryptexUrl: process.env.CRYPTEX_URL!,
    operatingFor: address,
    walletClient,
  })

  const controller = sdk.contracts.getControllerContract()
  const { signature, marketTransfer } = await sdk.collateralAccounts.sign.marketTransfer({
    market: SupportedMarket.eth,
    amount: Big6Math.fromFloatString('-0.001'),
    maxFee: Big6Math.fromFloatString('1'),
    expiry: timeToSeconds(addHours(new Date(), 1), true),
  })

  // The account sending the transaction can be different from the one that the collateral account is deployed for
  const { request } = await controller.simulate.marketTransferWithSignature([marketTransfer.message, signature], {
    account: walletClient.account,
  })
  const txHash = await walletClient.writeContract(request)
  console.log('Transaction sent:', txHash)
}

run()
