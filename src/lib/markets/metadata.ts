import { AssetMetadata } from '../..'
import { SupportedMarket } from '../../constants'
import { PythPriceFeedUrl } from '../../constants'

export const getMarketHoursData = async (
  market: SupportedMarket,
): Promise<{
  is_open: boolean
  next_open: number
  next_close: number
} | null> => {
  const { pythFeedId } = AssetMetadata[market]
  const res = await fetch(`${PythPriceFeedUrl}${pythFeedId})`)
  const marketData = await res.json()
  if (!marketData || !marketData.market_hours) return null
  return marketData.market_hours
}
