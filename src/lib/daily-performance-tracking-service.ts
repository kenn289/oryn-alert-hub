import { supabase } from './supabase'

export interface DailyPerformanceSnapshot {
  id: string
  user_id: string
  date: string
  total_value: number
  total_invested: number
  total_gain_loss: number
  total_gain_loss_percent: number
  day_change: number
  day_change_percent: number
  portfolio_items: number
  top_performer?: {
    symbol: string
    name: string
    gain_loss: number
    gain_loss_percent: number
  }
  worst_performer?: {
    symbol: string
    name: string
    gain_loss: number
    gain_loss_percent: number
  }
  created_at: string
}

export interface PerformanceMetrics {
  totalReturn: number
  annualizedReturn: number
  volatility: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  averageWin: number
  averageLoss: number
  profitFactor: number
  sortinoRatio: number
  calmarRatio: number
}

export interface PerformanceChartData {
  date: string
  value: number
  gainLoss: number
  gainLossPercent: number
  dayChange: number
  dayChangePercent: number
}

export interface PortfolioAnalytics {
  totalValue: number
  totalInvested: number
  totalGainLoss: number
  totalGainLossPercent: number
  dayChange: number
  dayChangePercent: number
  performanceMetrics: PerformanceMetrics
  chartData: PerformanceChartData[]
  topPerformers: Array<{
    symbol: string
    name: string
    gainLoss: number
    gainLossPercent: number
    currentValue: number
  }>
  worstPerformers: Array<{
    symbol: string
    name: string
    gainLoss: number
    gainLossPercent: number
    currentValue: number
  }>
  sectorAllocation: Array<{
    sector: string
    value: number
    percentage: number
  }>
  assetAllocation: Array<{
    asset: string
    value: number
    percentage: number
  }>
}

export class DailyPerformanceTrackingService {
  private static instance: DailyPerformanceTrackingService
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): DailyPerformanceTrackingService {
    if (!DailyPerformanceTrackingService.instance) {
      DailyPerformanceTrackingService.instance = new DailyPerformanceTrackingService()
    }
    return DailyPerformanceTrackingService.instance
  }

  /**
   * Create daily performance snapshot
   */
  async createDailySnapshot(userId: string, portfolioData: any[]): Promise<DailyPerformanceSnapshot> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Calculate current portfolio metrics
      const totalValue = portfolioData.reduce((sum, item) => {
        const shares = Number(item.shares) || 0
        const currentPrice = Number(item.currentPrice) || 0
        return sum + (shares * currentPrice)
      }, 0)

      const totalInvested = portfolioData.reduce((sum, item) => {
        const shares = Number(item.shares) || 0
        const avgPrice = Number(item.avgPrice) || 0
        return sum + (shares * avgPrice)
      }, 0)

      const totalGainLoss = totalValue - totalInvested
      const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0

      // Calculate day change (simplified - would need previous day's data)
      const dayChange = portfolioData.reduce((sum, item) => {
        const shares = Number(item.shares) || 0
        const currentPrice = Number(item.currentPrice) || 0
        const change = Number(item.change) || 0
        return sum + (shares * change)
      }, 0)

      const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0

      // Find top and worst performers
      const performers = portfolioData.map(item => {
        const shares = Number(item.shares) || 0
        const currentPrice = Number(item.currentPrice) || 0
        const avgPrice = Number(item.avgPrice) || 0
        const currentValue = shares * currentPrice
        const gainLoss = currentValue - (shares * avgPrice)
        const gainLossPercent = (shares * avgPrice) > 0 ? (gainLoss / (shares * avgPrice)) * 100 : 0

        return {
          symbol: item.ticker,
          name: item.name,
          gainLoss,
          gainLossPercent,
          currentValue
        }
      }).sort((a, b) => b.gainLoss - a.gainLoss)

      const topPerformer = performers[0]
      const worstPerformer = performers[performers.length - 1]

      const snapshot: DailyPerformanceSnapshot = {
        id: `${userId}_${today}`,
        user_id: userId,
        date: today,
        total_value: totalValue,
        total_invested: totalInvested,
        total_gain_loss: totalGainLoss,
        total_gain_loss_percent: totalGainLossPercent,
        day_change: dayChange,
        day_change_percent: dayChangePercent,
        portfolio_items: portfolioData.length,
        top_performer: topPerformer?.gainLoss > 0 ? topPerformer : undefined,
        worst_performer: worstPerformer?.gainLoss < 0 ? worstPerformer : undefined,
        created_at: new Date().toISOString()
      }

      // Store in database
      await this.storeDailySnapshot(snapshot)

      return snapshot
    } catch (error) {
      console.error('Error creating daily snapshot:', error)
      throw error
    }
  }

  /**
   * Get comprehensive portfolio analytics
   */
  async getPortfolioAnalytics(userId: string, days: number = 30): Promise<PortfolioAnalytics> {
    const cacheKey = `analytics_${userId}_${days}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }

    try {
      // Get daily snapshots
      const snapshots = await this.getDailySnapshots(userId, days)
      
      if (snapshots.length === 0) {
        return this.getEmptyAnalytics()
      }

      // Get current portfolio data
      const { data: portfolioData, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        console.error('Error fetching portfolio data:', error)
        return this.getEmptyAnalytics()
      }

      const currentSnapshot = snapshots[0] // Most recent
      const performanceMetrics = this.calculatePerformanceMetrics(snapshots)
      const chartData = this.generateChartData(snapshots)
      const topPerformers = this.getTopPerformers(portfolioData || [])
      const worstPerformers = this.getWorstPerformers(portfolioData || [])
      const sectorAllocation = this.calculateSectorAllocation(portfolioData || [])
      const assetAllocation = this.calculateAssetAllocation(portfolioData || [])

      const analytics: PortfolioAnalytics = {
        totalValue: currentSnapshot.total_value,
        totalInvested: currentSnapshot.total_invested,
        totalGainLoss: currentSnapshot.total_gain_loss,
        totalGainLossPercent: currentSnapshot.total_gain_loss_percent,
        dayChange: currentSnapshot.day_change,
        dayChangePercent: currentSnapshot.day_change_percent,
        performanceMetrics,
        chartData,
        topPerformers,
        worstPerformers,
        sectorAllocation,
        assetAllocation
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: analytics,
        timestamp: Date.now()
      })

      return analytics
    } catch (error) {
      console.error('Error getting portfolio analytics:', error)
      return this.getEmptyAnalytics()
    }
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(snapshots: DailyPerformanceSnapshot[]): PerformanceMetrics {
    if (snapshots.length < 2) {
      return {
        totalReturn: 0,
        annualizedReturn: 0,
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        winRate: 0,
        averageWin: 0,
        averageLoss: 0,
        profitFactor: 0,
        sortinoRatio: 0,
        calmarRatio: 0
      }
    }

    const values = snapshots.map(s => s.total_value).reverse()
    const returns = []
    
    for (let i = 1; i < values.length; i++) {
      const dailyReturn = (values[i] - values[i - 1]) / values[i - 1]
      returns.push(dailyReturn)
    }

    const totalReturn = (values[values.length - 1] - values[0]) / values[0]
    const annualizedReturn = Math.pow(1 + totalReturn, 365 / values.length) - 1
    
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const volatility = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length)
    
    const sharpeRatio = volatility > 0 ? (meanReturn - 0.02) / volatility : 0 // Assuming 2% risk-free rate
    
    // Calculate max drawdown
    let maxDrawdown = 0
    let peak = values[0]
    for (const value of values) {
      if (value > peak) peak = value
      const drawdown = (peak - value) / peak
      if (drawdown > maxDrawdown) maxDrawdown = drawdown
    }

    // Calculate win rate
    const positiveReturns = returns.filter(r => r > 0).length
    const winRate = returns.length > 0 ? positiveReturns / returns.length : 0

    // Calculate average win and loss
    const wins = returns.filter(r => r > 0)
    const losses = returns.filter(r => r < 0)
    const averageWin = wins.length > 0 ? wins.reduce((sum, w) => sum + w, 0) / wins.length : 0
    const averageLoss = losses.length > 0 ? losses.reduce((sum, l) => sum + l, 0) / losses.length : 0

    // Calculate profit factor
    const totalWins = wins.reduce((sum, w) => sum + w, 0)
    const totalLosses = Math.abs(losses.reduce((sum, l) => sum + l, 0))
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0

    // Calculate Sortino ratio (downside deviation)
    const downsideReturns = returns.filter(r => r < 0)
    const downsideDeviation = downsideReturns.length > 0 
      ? Math.sqrt(downsideReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downsideReturns.length)
      : 0
    const sortinoRatio = downsideDeviation > 0 ? (meanReturn - 0.02) / downsideDeviation : 0

    // Calculate Calmar ratio
    const calmarRatio = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0

    return {
      totalReturn,
      annualizedReturn,
      volatility,
      sharpeRatio,
      maxDrawdown,
      winRate,
      averageWin,
      averageLoss,
      profitFactor,
      sortinoRatio,
      calmarRatio
    }
  }

  /**
   * Generate chart data
   */
  private generateChartData(snapshots: DailyPerformanceSnapshot[]): PerformanceChartData[] {
    return snapshots.map(snapshot => ({
      date: snapshot.date,
      value: snapshot.total_value,
      gainLoss: snapshot.total_gain_loss,
      gainLossPercent: snapshot.total_gain_loss_percent,
      dayChange: snapshot.day_change,
      dayChangePercent: snapshot.day_change_percent
    })).reverse() // Most recent first
  }

  /**
   * Get top performers
   */
  private getTopPerformers(portfolioData: any[]): Array<{
    symbol: string
    name: string
    gainLoss: number
    gainLossPercent: number
    currentValue: number
  }> {
    return portfolioData
      .map(item => {
        const shares = Number(item.shares) || 0
        const currentPrice = Number(item.current_price) || 0
        const avgPrice = Number(item.avg_price) || 0
        const currentValue = shares * currentPrice
        const gainLoss = currentValue - (shares * avgPrice)
        const gainLossPercent = (shares * avgPrice) > 0 ? (gainLoss / (shares * avgPrice)) * 100 : 0

        return {
          symbol: item.ticker,
          name: item.name,
          gainLoss,
          gainLossPercent,
          currentValue
        }
      })
      .sort((a, b) => b.gainLoss - a.gainLoss)
      .slice(0, 5)
  }

  /**
   * Get worst performers
   */
  private getWorstPerformers(portfolioData: any[]): Array<{
    symbol: string
    name: string
    gainLoss: number
    gainLossPercent: number
    currentValue: number
  }> {
    return portfolioData
      .map(item => {
        const shares = Number(item.shares) || 0
        const currentPrice = Number(item.current_price) || 0
        const avgPrice = Number(item.avg_price) || 0
        const currentValue = shares * currentPrice
        const gainLoss = currentValue - (shares * avgPrice)
        const gainLossPercent = (shares * avgPrice) > 0 ? (gainLoss / (shares * avgPrice)) * 100 : 0

        return {
          symbol: item.ticker,
          name: item.name,
          gainLoss,
          gainLossPercent,
          currentValue
        }
      })
      .sort((a, b) => a.gainLoss - b.gainLoss)
      .slice(0, 5)
  }

  /**
   * Calculate sector allocation
   */
  private calculateSectorAllocation(portfolioData: any[]): Array<{
    sector: string
    value: number
    percentage: number
  }> {
    const totalValue = portfolioData.reduce((sum, item) => {
      const shares = Number(item.shares) || 0
      const currentPrice = Number(item.current_price) || 0
      return sum + (shares * currentPrice)
    }, 0)

    const sectorMap = new Map<string, number>()
    
    portfolioData.forEach(item => {
      const shares = Number(item.shares) || 0
      const currentPrice = Number(item.current_price) || 0
      const value = shares * currentPrice
      const sector = item.sector || 'Unknown'
      
      sectorMap.set(sector, (sectorMap.get(sector) || 0) + value)
    })

    return Array.from(sectorMap.entries())
      .map(([sector, value]) => ({
        sector,
        value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value)
  }

  /**
   * Calculate asset allocation
   */
  private calculateAssetAllocation(portfolioData: any[]): Array<{
    asset: string
    value: number
    percentage: number
  }> {
    const totalValue = portfolioData.reduce((sum, item) => {
      const shares = Number(item.shares) || 0
      const currentPrice = Number(item.current_price) || 0
      return sum + (shares * currentPrice)
    }, 0)

    const assetMap = new Map<string, number>()
    
    portfolioData.forEach(item => {
      const shares = Number(item.shares) || 0
      const currentPrice = Number(item.current_price) || 0
      const value = shares * currentPrice
      const asset = item.ticker
      
      assetMap.set(asset, (assetMap.get(asset) || 0) + value)
    })

    return Array.from(assetMap.entries())
      .map(([asset, value]) => ({
        asset,
        value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value)
  }

  /**
   * Get daily snapshots
   */
  private async getDailySnapshots(userId: string, days: number): Promise<DailyPerformanceSnapshot[]> {
    try {
      const { data, error } = await supabase
        .from('daily_performance_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(days)

      if (error) {
        console.error('Error fetching daily snapshots:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching daily snapshots:', error)
      return []
    }
  }

  /**
   * Store daily snapshot
   */
  private async storeDailySnapshot(snapshot: DailyPerformanceSnapshot): Promise<void> {
    try {
      const { error } = await supabase
        .from('daily_performance_snapshots')
        .upsert(snapshot, { onConflict: 'id' })

      if (error) {
        console.error('Error storing daily snapshot:', error)
      } else {
        console.log(`✅ Stored daily snapshot for ${snapshot.date}`)
      }
    } catch (error) {
      console.error('Error storing daily snapshot:', error)
    }
  }

  /**
   * Get empty analytics
   */
  private getEmptyAnalytics(): PortfolioAnalytics {
    return {
      totalValue: 0,
      totalInvested: 0,
      totalGainLoss: 0,
      totalGainLossPercent: 0,
      dayChange: 0,
      dayChangePercent: 0,
      performanceMetrics: {
        totalReturn: 0,
        annualizedReturn: 0,
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        winRate: 0,
        averageWin: 0,
        averageLoss: 0,
        profitFactor: 0,
        sortinoRatio: 0,
        calmarRatio: 0
      },
      chartData: [],
      topPerformers: [],
      worstPerformers: [],
      sectorAllocation: [],
      assetAllocation: []
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
    console.log('🧹 Daily performance tracking cache cleared')
  }
}

export const dailyPerformanceTrackingService = DailyPerformanceTrackingService.getInstance()
