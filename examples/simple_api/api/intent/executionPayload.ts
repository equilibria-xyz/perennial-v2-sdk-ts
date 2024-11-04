import { Intent, SupportedChainId, addressToMarket, intentUtils, mergeMultiInvokerTxs } from '@perennial/sdk'
import { VercelRequest, VercelResponse } from '@vercel/node'
import { Hex, PublicClient, zeroAddress } from 'viem'

import setupSDK from '../../lib/sdk.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const {
    apiKey,
    intent,
    signature,
    chainId,
    checkFillable,
  }: { apiKey: string; intent: Intent; chainId: SupportedChainId; signature: Hex; checkFillable: boolean } = req.body

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

  if (checkFillable) {
    const { fillable, error } = await intentUtils.checkIntentFillable({
      txData,
      market,
      chainId,
      publicClient: sdk.publicClient as PublicClient,
    })
    if (!fillable) return res.status(400).json({ error: `Intent is not fillable: ${error}` })
  }

  return res.status(200).json({
    data: txData.data,
    value: String(txData.value),
    to: txData.to,
  })
}
