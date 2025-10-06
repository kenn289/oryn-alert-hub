import { supabase } from './supabase'

export interface DatabasePortfolioRow {
  id: string
  user_id: string
  ticker: string
  name: string
  shares: number
  avg_price: number
  current_price: number
  currency?: string
  exchange?: string
  market?: string
  added_at: string
  updated_at: string
}

export interface PortfolioItemUI {
  id: string
  ticker: string
  name: string
  shares: number
  avgPrice: number
  currentPrice: number
  totalValue: number
  gainLoss: number
  gainLossPercent: number
  addedAt: string
  market?: string
  currency?: string
  exchange?: string
}

export class DatabasePortfolioService {
  static toUI(item: any): PortfolioItemUI {
    const shares = Number(item.shares || 0)
    const avgPrice = Number(item.avg_price || 0)
    const currentPrice = Number(item.current_price || 0)
    const totalValue = shares * currentPrice
    const invested = shares * avgPrice
    const gainLoss = totalValue - invested
    const gainLossPercent = invested > 0 ? (gainLoss / invested) * 100 : 0

    return {
      id: item.id,
      ticker: item.ticker,
      name: item.name,
      shares,
      avgPrice,
      currentPrice,
      totalValue,
      gainLoss,
      gainLossPercent,
      addedAt: item.added_at,
      market: item.market || undefined,
      currency: (item.currency as string) || 'USD',
      exchange: item.exchange || undefined,
    }
  }

  static async getPortfolio(userId: string): Promise<PortfolioItemUI[]> {
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: false })

      if (error || !data) {
        console.error('Error fetching portfolio from database:', error)
        return []
      }

      return data.map((row: any) => this.toUI(row))
    } catch (error) {
      console.error('Error fetching portfolio:', error)
      return []
    }
  }

  static async upsertPortfolioItem(params: {
    userId: string
    ticker: string
    name: string
    shares: number
    avgPrice: number
    currentPrice?: number
    market?: string
    currency?: string
    exchange?: string
  }): Promise<{ success: boolean; message: string }> {
    try {
      const {
        userId,
        ticker,
        name,
        shares,
        avgPrice,
        currentPrice = 0,
        market,
        currency = 'USD',
        exchange,
      } = params

      if (!userId || !ticker || !name) {
        return { success: false, message: 'Missing required fields' }
      }

      const cleanTicker = ticker.trim().toUpperCase()
      if (!cleanTicker) {
        return { success: false, message: 'Invalid ticker' }
      }

      const { error } = await supabase
        .from('portfolios')
        .upsert(
          [{
            user_id: userId,
            ticker: cleanTicker,
            name: name.trim() || cleanTicker,
            shares,
            avg_price: avgPrice,
            current_price: currentPrice,
            market: market?.toUpperCase(),
            currency,
            exchange,
            updated_at: new Date().toISOString(),
          }],
          { onConflict: 'user_id,ticker' }
        )

      if (error) {
        console.error('Error upserting portfolio item:', error)
        return { success: false, message: 'Failed to save portfolio item' }
      }

      return { success: true, message: `Saved ${cleanTicker} in portfolio` }
    } catch (error) {
      console.error('Error upserting portfolio item:', error)
      return { success: false, message: 'Failed to save portfolio item' }
    }
  }

  static async removeFromPortfolio(userId: string, ticker: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('portfolios')
        .delete()
        .eq('user_id', userId)
        .eq('ticker', ticker.toUpperCase())

      if (error) {
        console.error('Error removing portfolio item:', error)
        return { success: false, message: 'Failed to remove portfolio item' }
      }

      return { success: true, message: `Removed ${ticker.toUpperCase()} from portfolio` }
    } catch (error) {
      console.error('Error removing portfolio item:', error)
      return { success: false, message: 'Failed to remove portfolio item' }
    }
  }

  static async updateCurrentPrices(
    userId: string,
    updates: Array<{
      ticker: string
      currentPrice: number
    }>
  ): Promise<void> {
    try {
      for (const update of updates) {
        await supabase
          .from('portfolios')
          .update({
            current_price: update.currentPrice,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('ticker', update.ticker)
      }
    } catch (error) {
      console.error('Error updating portfolio prices:', error)
    }
  }

  static async syncLocalToDatabase(userId: string): Promise<void> {
    try {
      const local = JSON.parse(localStorage.getItem('oryn_portfolio') || '[]')
      if (!Array.isArray(local) || local.length === 0) return

      const tasks = local.map((item: any) =>
        this.upsertPortfolioItem({
          userId,
          ticker: String(item.ticker || '').toUpperCase(),
          name: String(item.name || item.ticker || '').trim(),
          shares: Number(item.shares || 0),
          avgPrice: Number(item.avgPrice || 0),
          currentPrice: Number(item.currentPrice || 0),
          market: item.market,
          currency: item.currency || 'USD',
          exchange: item.exchange,
        })
      )

      await Promise.all(tasks)
    } catch (error) {
      console.error('Error syncing local portfolio to database:', error)
    }
  }

  static async syncDatabaseToLocal(userId: string): Promise<void> {
    try {
      const items = await this.getPortfolio(userId)
      localStorage.setItem('oryn_portfolio', JSON.stringify(items))
      localStorage.setItem('oryn_portfolio_last_modified', Date.now().toString())
    } catch (error) {
      console.error('Error syncing database portfolio to local:', error)
    }
  }
}
