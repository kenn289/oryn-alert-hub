// Real-time Alert Service
// Generates alerts based on actual market data and user watchlist

export interface Alert {
  id: string
  type: 'price_spike' | 'volume_spike' | 'earnings' | 'news_alert' | 'technical_breakout' | 'options_flow'
  ticker: string
  message: string
  time: string
  severity: 'low' | 'medium' | 'high'
  data?: Record<string, unknown>
}

export interface AlertConfig {
  priceChangeThreshold: number // % change to trigger price alert
  volumeSpikeThreshold: number // % increase in volume to trigger volume alert
  optionsFlowThreshold: number // Unusual options activity threshold
}

export class AlertService {
  private static alerts: Alert[] = []
  private static config: AlertConfig = {
    priceChangeThreshold: 3.0, // 3% price change
    volumeSpikeThreshold: 150, // 150% volume increase
    optionsFlowThreshold: 200 // 200% options volume increase
  }

  // Generate alerts based on real market data
  static async generateAlerts(watchlist: string[]): Promise<Alert[]> {
    if (!watchlist || watchlist.length === 0) {
      return []
    }

    const newAlerts: Alert[] = []

    try {
      // Check each ticker in watchlist for alerts
      for (const ticker of watchlist) {
        try {
          // Fetch REAL-TIME data for the ticker
          const stockData = await this.fetchStockData(ticker)

          // Generate price alerts from REAL data
          const priceAlert = this.checkPriceAlert(ticker, stockData)
          if (priceAlert) newAlerts.push(priceAlert)

          // Generate volume alerts from REAL data
          const volumeAlert = this.checkVolumeAlert(ticker, stockData)
          if (volumeAlert) newAlerts.push(volumeAlert)

          // Generate options flow alerts
          const optionsAlert = await this.checkOptionsFlowAlert(ticker)
          if (optionsAlert) newAlerts.push(optionsAlert)

        } catch (error) {
          console.error(`Failed to generate REAL-TIME alerts for ${ticker}:`, error)
          // Skip this ticker if API fails - don't show error alerts
        }
      }

      // Add new alerts to the list
      this.alerts = [...newAlerts, ...this.alerts].slice(0, 20) // Keep last 20 alerts

      return this.alerts

    } catch (error) {
      console.error('Error generating alerts:', error)
      // Return empty array instead of error alerts
      return []
    }
  }

  // Fetch REAL-TIME stock data from Yahoo Finance via API
  private static async fetchStockData(ticker: string): Promise<Record<string, unknown>> {
    try {
      console.log(`📊 Fetching real-time data for ${ticker} to generate alerts...`)
      
      const response = await fetch(`/api/stock/multi/${ticker}`)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data || !data.price) {
        throw new Error('No price data available')
      }
      
      console.log(`✅ Got real-time data for ${ticker}: $${data.price} (${data.changePercent.toFixed(2)}%)`)
      return data
    } catch (error) {
      console.error(`❌ Failed to fetch real-time data for ${ticker}:`, error)
      throw error
    }
  }

  // Fallback data for development/testing
  private static getFallbackData(ticker: string): Record<string, unknown> {
    const fallbackData: Record<string, Record<string, unknown>> = {
      'GOOGL': {
        price: 152.50,
        changePercent: 2.01,
        volume: 2500000,
        avgVolume: 2000000
      },
      'AAPL': {
        price: 182.50,
        changePercent: 1.67,
        volume: 5000000,
        avgVolume: 4000000
      },
      'TSLA': {
        price: 245.30,
        changePercent: -1.2,
        volume: 8000000,
        avgVolume: 6000000
      },
      'MSFT': {
        price: 420.15,
        changePercent: 0.8,
        volume: 3000000,
        avgVolume: 2500000
      },
      'AMZN': {
        price: 185.75,
        changePercent: 1.5,
        volume: 4000000,
        avgVolume: 3500000
      }
    }
    
    return fallbackData[ticker] || {
      price: 100.00,
      changePercent: 0.5,
      volume: 1000000,
      avgVolume: 1000000
    }
  }

  // Sample alerts for demonstration
  private static getSampleAlerts(): Alert[] {
    return [
      {
        id: 'sample_price_1',
        type: 'price_spike',
        ticker: 'GOOGL',
        message: 'GOOGL price surged 2.01% to $152.50',
        time: this.getTimeAgo(new Date(Date.now() - 2 * 60 * 1000)), // 2 minutes ago
        severity: 'medium',
        data: { changePercent: 2.01, currentPrice: 152.50 }
      },
      {
        id: 'sample_volume_1',
        type: 'volume_spike',
        ticker: 'AAPL',
        message: 'AAPL unusual volume detected (125% of average)',
        time: this.getTimeAgo(new Date(Date.now() - 5 * 60 * 1000)), // 5 minutes ago
        severity: 'high',
        data: { volume: 5000000, avgVolume: 4000000, volumeRatio: 125 }
      },
      {
        id: 'sample_options_1',
        type: 'options_flow',
        ticker: 'TSLA',
        message: 'TSLA unusual options activity detected',
        time: this.getTimeAgo(new Date(Date.now() - 8 * 60 * 1000)), // 8 minutes ago
        severity: 'high',
        data: { callVolume: 15000, putVolume: 8000, ratio: 1.875 }
      }
    ]
  }

  // Check for price movement alerts
  private static checkPriceAlert(ticker: string, stockData: Record<string, unknown>): Alert | null {
    if (!stockData.changePercent) return null

    const changePercent = Math.abs(stockData.changePercent as number)
    if (changePercent < this.config.priceChangeThreshold) return null

    const direction = (stockData.changePercent as number) > 0 ? 'surged' : 'dropped'
    const severity = changePercent > 5 ? 'high' : changePercent > 3 ? 'medium' : 'low'

    return {
      id: `price_${ticker}_${Date.now()}`,
      type: 'price_spike',
      ticker,
      message: `${ticker} price ${direction} ${changePercent.toFixed(1)}%`,
      time: this.getTimeAgo(new Date()),
      severity,
      data: {
        changePercent: stockData.changePercent as number,
        currentPrice: stockData.price as number
      }
    }
  }

  // Check for volume spike alerts
  private static checkVolumeAlert(ticker: string, stockData: Record<string, unknown>): Alert | null {
    if (!stockData.volume || !stockData.avgVolume) return null

    const volumeRatio = ((stockData.volume as number) / (stockData.avgVolume as number)) * 100
    if (volumeRatio < this.config.volumeSpikeThreshold) return null

    const severity = volumeRatio > 300 ? 'high' : volumeRatio > 200 ? 'medium' : 'low'

    return {
      id: `volume_${ticker}_${Date.now()}`,
      type: 'volume_spike',
      ticker,
      message: `${ticker} unusual volume detected (${volumeRatio.toFixed(0)}% of average)`,
      time: this.getTimeAgo(new Date()),
      severity,
      data: {
        volume: stockData.volume as number,
        avgVolume: stockData.avgVolume as number,
        volumeRatio
      }
    }
  }

  // Check for options flow alerts
  private static async checkOptionsFlowAlert(ticker: string): Promise<Alert | null> {
    try {
      // TODO: Integrate with real options data API
      // For now, skip options flow alerts until real API is available
      return null
    } catch (error) {
      console.warn(`Failed to check options flow for ${ticker}:`, error)
      return null
    }
  }

  // Get time ago string
  private static getTimeAgo(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  // Get current alerts
  static getAlerts(): Alert[] {
    return this.alerts
  }

  // Clear old alerts (older than 24 hours)
  static clearOldAlerts(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    this.alerts = this.alerts.filter(alert => {
      // Parse time string to get actual date
      const alertTime = this.parseTimeString(alert.time)
      return alertTime > oneDayAgo
    })
  }

  // Parse time string to Date object
  private static parseTimeString(timeStr: string): Date {
    const now = new Date()
    
    if (timeStr === 'Just now') return now
    
    const minsMatch = timeStr.match(/(\d+) minute/)
    if (minsMatch) {
      return new Date(now.getTime() - parseInt(minsMatch[1]) * 60 * 1000)
    }
    
    const hoursMatch = timeStr.match(/(\d+) hour/)
    if (hoursMatch) {
      return new Date(now.getTime() - parseInt(hoursMatch[1]) * 60 * 60 * 1000)
    }
    
    return now
  }

  // Update alert configuration
  static updateConfig(newConfig: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  // Get alert statistics
  static getAlertStats(): {
    total: number
    byType: Record<string, number>
    bySeverity: Record<string, number>
  } {
    const byType: Record<string, number> = {}
    const bySeverity: Record<string, number> = {}

    this.alerts.forEach(alert => {
      byType[alert.type] = (byType[alert.type] || 0) + 1
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1
    })

    return {
      total: this.alerts.length,
      byType,
      bySeverity
    }
  }
}
