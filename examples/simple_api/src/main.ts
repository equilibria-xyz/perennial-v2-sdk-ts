import fuzzysort from 'fuzzysort'
import { Context, Hono } from 'hono'
import { zeroAddress } from 'viem'

import setupSDK from './lib/sdk'

const app = new Hono()

const handleRoute = async (c: Context) => {
  const { apiKey, func, args }: { apiKey: string; func: string; args: any } = await c.req.json()
  if (!apiKey || !process.env.API_KEYS?.split(',').includes(apiKey))
    return c.json({ error: 'Unauthorized. Try updating the "apiKey" value' }, 401)
  if (!func) return c.json({ error: 'Function not provided' }, 400)

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
      return c.json({ error: `Function not found. Did you mean "${funcMatch}"?` }, 400)
    }

    // Call the function
    const data = await allFunctions[func](args)
    // Return the data
    return c.json(data, 200)
  } catch (error: any) {
    console.error(error)
    // Return the error message
    const message = error.message ? error.message.split(':')[0] : error
    return c.json({ error: message }, 200)
  }
}

app.post('/api/generic', (c) => handleRoute(c))

app.on('GET', '*', (c) => c.json({ error: `try POST to \'/api/generic\'` }, 404))

export default app
