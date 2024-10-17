import { addHours } from 'date-fns'
import { config as dotenvConfig } from 'dotenv'
import path from 'path'
import { Hex, createWalletClient, getAddress, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arbitrumSepolia } from 'viem/chains'

import Perennial, { Big6Math, timeToSeconds } from '../../'

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

  const { innerSignature, outerSignature, relayedSignerUpdate } = await sdk.collateralAccounts.sign.relayedSignerUpdate(
    {
      newSigner: getAddress('0x5134268619513181eD3Fd49Aa7FdCE764c445e2B'),
      approved: true,
      maxFee: Big6Math.fromFloatString('10'),
      expiry: timeToSeconds(addHours(new Date(), 1), true),
    },
  )
  const { request } = await controller.simulate.relaySignerUpdate(
    [relayedSignerUpdate.message, outerSignature, innerSignature],
    { account: walletClient.account },
  )
  const txHash = await walletClient.writeContract(request)

  console.log('Transaction sent:', txHash)
}

run()
