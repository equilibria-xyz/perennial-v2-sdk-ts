import { PythPriceFeedUrl } from '../../constants'

export type MarketHours = {
  is_open: boolean
  next_open: number
  next_close: number
}

export const getPythMarketHours = async (pythFeedId: string): Promise<MarketHours | null> => {
  const res = await fetch(`${PythPriceFeedUrl}${pythFeedId})`)
  const marketData = await res.json()
  if (!marketData || !marketData.market_hours) return null
  return marketData.market_hours
}
