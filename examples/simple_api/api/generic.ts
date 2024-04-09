import type { VercelRequest, VercelResponse } from '@vercel/node'
import fuzzysort from 'fuzzysort'
import { zeroAddress } from 'viem'

import setupSDK from '../lib/sdk.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { key, func, args }: { key: string; func: string; args: any } = req.body
  console.log(process.env.KEYS?.split(','))
  if (!key || !process.env.KEYS?.split(',').includes(key))
    return res.status(401).json({ error: 'Unauthorized. Try updating the "key" value' })
  if (!func) return res.status(400).json({ error: 'Function not provided' })

  // Setup the SDK
  const sdk = setupSDK(args?.address || zeroAddress)

  // Get a list of all functions
  const modules = Object.keys(sdk).filter((k) => !k.startsWith('_')) // Filter out private functions
  const functions = modules.map(
    // Get all functions from each module
    (k) =>
      // @ts-ignore
      sdk[k]['read'] && {
        // @ts-ignore
        ...sdk[k]['read'],
        // @ts-ignore
        ...sdk[k]['write'],
        // @ts-ignore
        ...sdk[k]['build'],
      },
  )
  const allFunctions = Object.assign({}, ...functions) // Combine all functions into a single object

  // Try to execute it
  try {
    // Check if the function exists
    if (!allFunctions[func]) {
      // Check if there is a similar function
      const funcMatch = fuzzysort.go(func, Object.keys(allFunctions)).map((x) => x.target)[0]
      return res.status(400).json({ error: `Function not found. Did you mean "${funcMatch}"?` })
    }

    // Call the function
    const data = await allFunctions[func](args)
    // Return the data
    return res.status(200).json(data)
  } catch (error: any) {
    console.error(error)
    // Return the error message
    const message = error.message ? error.message.split(':')[0] : error
    return res.status(400).json({ error: message })
  }
}
