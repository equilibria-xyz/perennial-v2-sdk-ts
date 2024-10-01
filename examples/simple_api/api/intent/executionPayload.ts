import { Intent, SupportedChainId, addressToMarket, mergeMultiInvokerTxs } from '@perennial/sdk'
import { VercelRequest, VercelResponse } from '@vercel/node'
import { Hex, zeroAddress } from 'viem'

import setupSDK from '../../lib/sdk.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const {
    apiKey,
    intent,
    signature,
    chainId,
  }: { apiKey: string; intent: Intent; chainId: SupportedChainId; signature: Hex } = req.body

  if (!apiKey || !process.env.API_KEYS?.split(',').includes(apiKey))
    return res.status(401).json({ error: 'Unauthorized. Try updating the "apiKey" value' })

  const sdk = setupSDK(chainId || 42161, zeroAddress)
  const market = addressToMarket(chainId, intent.common.domain)
  const commitment = await sdk.oracles.read.oracleCommitmentsLatest({
    markets: [market],
  })
  const commitPriceAction = sdk.oracles.build.commitPrice({ ...commitment[0], revertOnFailure: false })
  const updateAction = sdk.markets.build.updateIntent({
    market: market,
    intent: intent,
    signature: signature,
  })
  const txData = mergeMultiInvokerTxs([commitPriceAction, updateAction])

  return res.status(200).json(txData)
}
