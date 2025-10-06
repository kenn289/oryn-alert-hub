import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface PortfolioItem {
  id: string
  ticker: string
  name: string
  shares: number
  avgPrice: number
  currentPrice: number
  totalValue: number
  gainLoss: number
  gainLossPercent: number
  market: string
  currency: string
  exchange?: string
  addedAt: string
}

export interface PortfolioSummary {
  totalValue: number
  totalGainLoss: number
  totalGainLossPercent: number
  totalInvested: number
  dayChange: number
  dayChangePercent: number
}

export class PortfolioService {
  private static STORAGE_KEY = 'oryn_portfolio'

  // Get user's portfolio from database
  static async getPortfolio(userId: string): Promise<PortfolioItem[]> {
    try {
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: false })

      if (error) {
        console.error('Error fetching portfolio:', error)
        throw new Error('Failed to fetch portfolio')
      }

      return (data || []).map(item => ({
        id: item.id,
        ticker: item.ticker,
        name: item.name,
        shares: item.shares,
        avgPrice: item.avg_price,
        currentPrice: item.current_price,
        totalValue: item.total_value,
        gainLoss: item.gain_loss,
        gainLossPercent: item.gain_loss_percent,
        market: item.market,
        currency: item.currency,
        exchange: item.exchange,
        addedAt: item.added_at
      }))
    } catch (error) {
      console.error('PortfolioService.getPortfolio error:', error)
      // Fallback to localStorage if database fails
      return this.getPortfolioFromLocalStorage()
    }
  }

  // Add new portfolio item to database
  static async addPortfolioItem(
    userId: string,
    ticker: string,
    name: string,
    shares: number,
    avgPrice: number,
    currentPrice: number,
    market: string = 'US',
    currency: string = 'USD',
    exchange?: string
  ): Promise<{ success: boolean; message: string; item?: PortfolioItem }> {
    try {
      const totalValue = shares * currentPrice
      const gainLoss = totalValue - (shares * avgPrice)
      const gainLossPercent = avgPrice > 0 ? (gainLoss / (shares * avgPrice)) * 100 : 0

      const { data, error } = await supabase
        .from('portfolio_items')
        .insert({
          user_id: userId,
          ticker: ticker.toUpperCase(),
          name: name || ticker.toUpperCase(),
          shares,
          avg_price: avgPrice,
          current_price: currentPrice,
          total_value: totalValue,
          gain_loss: gainLoss,
          gain_loss_percent: gainLossPercent,
          market,
          currency,
          exchange: exchange || (market === 'IN' ? 'NSE' : market === 'US' ? 'NASDAQ' : 'Unknown')
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding portfolio item:', error)
        return { success: false, message: 'Failed to save portfolio item' }
      }

      const newItem: PortfolioItem = {
        id: data.id,
        ticker: data.ticker,
        name: data.name,
        shares: data.shares,
        avgPrice: data.avg_price,
        currentPrice: data.current_price,
        totalValue: data.total_value,
        gainLoss: data.gain_loss,
        gainLossPercent: data.gain_loss_percent,
        market: data.market,
        currency: data.currency,
        exchange: data.exchange,
        addedAt: data.added_at
      }

      return { 
        success: true, 
        message: `${ticker} added to portfolio!`,
        item: newItem
      }
    } catch (error) {
      console.error('PortfolioService.addPortfolioItem error:', error)
      return { success: false, message: 'Failed to save portfolio item' }
    }
  }

  // Update portfolio item in database
  static async updatePortfolioItem(
    itemId: string,
    shares: number,
    avgPrice: number,
    currentPrice: number
  ): Promise<{ success: boolean; message: string; item?: PortfolioItem }> {
    try {
      const totalValue = shares * currentPrice
      const gainLoss = totalValue - (shares * avgPrice)
      const gainLossPercent = avgPrice > 0 ? (gainLoss / (shares * avgPrice)) * 100 : 0

      const { data, error } = await supabase
        .from('portfolio_items')
        .update({
          shares,
          avg_price: avgPrice,
          current_price: currentPrice,
          total_value: totalValue,
          gain_loss: gainLoss,
          gain_loss_percent: gainLossPercent
        })
        .eq('id', itemId)
        .select()
        .single()

      if (error) {
        console.error('Error updating portfolio item:', error)
        return { success: false, message: 'Failed to update portfolio item' }
      }

      const updatedItem: PortfolioItem = {
        id: data.id,
        ticker: data.ticker,
        name: data.name,
        shares: data.shares,
        avgPrice: data.avg_price,
        currentPrice: data.current_price,
        totalValue: data.total_value,
        gainLoss: data.gain_loss,
        gainLossPercent: data.gain_loss_percent,
        market: data.market,
        currency: data.currency,
        exchange: data.exchange,
        addedAt: data.added_at
      }

      return { 
        success: true, 
        message: 'Portfolio item updated!',
        item: updatedItem
      }
    } catch (error) {
      console.error('PortfolioService.updatePortfolioItem error:', error)
      return { success: false, message: 'Failed to update portfolio item' }
    }
  }

  // Delete portfolio item from database
  static async deletePortfolioItem(itemId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error deleting portfolio item:', error)
        return { success: false, message: 'Failed to delete portfolio item' }
      }

      return { success: true, message: 'Portfolio item deleted!' }
    } catch (error) {
      console.error('PortfolioService.deletePortfolioItem error:', error)
      return { success: false, message: 'Failed to delete portfolio item' }
    }
  }

  // Calculate portfolio summary
  static calculateSummary(portfolio: PortfolioItem[]): PortfolioSummary {
    const totalValue = portfolio.reduce((sum, item) => sum + item.totalValue, 0)
    const totalInvested = portfolio.reduce((sum, item) => sum + (item.shares * item.avgPrice), 0)
    const totalGainLoss = totalValue - totalInvested
    const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0

    return {
      totalValue,
      totalGainLoss,
      totalGainLossPercent,
      totalInvested,
      dayChange: 0, // This would need real-time data
      dayChangePercent: 0 // This would need real-time data
    }
  }

  // Fallback methods for localStorage (for backward compatibility)
  private static getPortfolioFromLocalStorage(): PortfolioItem[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error('Error loading portfolio from localStorage:', error)
      return []
    }
  }

  static saveToLocalStorage(portfolio: PortfolioItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(portfolio))
    } catch (error) {
      console.error('Error saving portfolio to localStorage:', error)
    }
  }

  // Migrate data from localStorage to database
  static async migrateFromLocalStorage(userId: string): Promise<void> {
    try {
      const localPortfolio = this.getPortfolioFromLocalStorage()
      if (localPortfolio.length === 0) return

      // Get existing database portfolio
      const dbPortfolio = await this.getPortfolio(userId)
      const existingTickers = new Set(dbPortfolio.map(item => `${item.ticker}-${item.market}`))

      // Add items that don't exist in database
      for (const item of localPortfolio) {
        const key = `${item.ticker}-${item.market}`
        if (!existingTickers.has(key)) {
          await this.addPortfolioItem(
            userId,
            item.ticker,
            item.name,
            item.shares,
            item.avgPrice,
            item.currentPrice,
            item.market,
            item.currency,
            item.exchange
          )
        }
      }

      // Clear localStorage after successful migration
      localStorage.removeItem(this.STORAGE_KEY)
      console.log('Portfolio data migrated from localStorage to database')
    } catch (error) {
      console.error('Error migrating portfolio data:', error)
    }
  }
}
