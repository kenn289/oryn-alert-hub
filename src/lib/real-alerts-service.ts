"use client"

import { Alert } from './alert-service'

interface MarketData {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  avgVolume: number
  high52w: number
  low52w: number
  marketCap: number
  pe: number
  previousClose: number
}

interface OptionsData {
  symbol: string
  callVolume: number
  putVolume: number
  callOpenInterest: number
  putOpenInterest: number
  unusualActivity: boolean
  activityType: 'bullish' | 'bearish' | 'neutral'
}

export class RealAlertsService {
  private static instance: RealAlertsService
  private alerts: Alert[] = []
  private lastUpdate: number = 0
  private updateInterval: number = 30000 // 30 seconds

  static getInstance(): RealAlertsService {
    if (!RealAlertsService.instance) {
      RealAlertsService.instance = new RealAlertsService()
    }
    return RealAlertsService.instance
  }

  // Scrape real market data from Yahoo Finance
  private async fetchMarketData(symbol: string): Promise<MarketData | null> {
    try {
      console.log(`📊 Fetching real market data for ${symbol}...`)
      
      // Use the existing API endpoint that fetches real data
      const response = await fetch(`/api/stock/multi/${symbol}`)
      if (!response.ok) {
        console.warn(`Failed to fetch data for ${symbol}`)
        return null
      }
      
      const data = await response.json()
      if (!data || !data.price) {
        console.warn(`No price data for ${symbol}`)
        return null
      }

      return {
        symbol: symbol,
        price: Number(data.price),
        change: Number(data.change || 0),
        changePercent: Number(data.changePercent || 0),
        volume: Number(data.volume || 0),
        avgVolume: Number(data.avgVolume || 0),
        high52w: Number(data.high52w || 0),
        low52w: Number(data.low52w || 0),
        marketCap: Number(data.marketCap || 0),
        pe: Number(data.pe || 0),
        previousClose: Number(data.previousClose || data.price)
      }
    } catch (error) {
      console.error(`Error fetching market data for ${symbol}:`, error)
      return null
    }
  }

  // Generate real price movement alerts
  private generatePriceMovementAlerts(marketData: MarketData): Alert[] {
    const alerts: Alert[] = []
    const { symbol, price, changePercent, volume, avgVolume } = marketData
    
    // Price movement alerts (2%+ change)
    if (Math.abs(changePercent) >= 2) {
      const severity = Math.abs(changePercent) > 5 ? 'high' : Math.abs(changePercent) > 3 ? 'medium' : 'low'
      const direction = changePercent > 0 ? 'up' : 'down'
      
      alerts.push({
        id: `price_${symbol}_${Date.now()}`,
        symbol: symbol,
        type: 'price_spike',
        condition: `${direction} ${Math.abs(changePercent).toFixed(2)}%`,
        value: price,
        isActive: true,
        createdAt: new Date().toISOString(),
        ticker: symbol,
        message: `${symbol} ${direction} ${Math.abs(changePercent).toFixed(2)}% to ${price.toFixed(2)}`,
        time: new Date().toLocaleTimeString(),
        severity: severity
      })
    }

    // Volume spike alerts (1.5x+ average volume)
    if (avgVolume > 0 && volume > avgVolume * 1.5) {
      const volumeIncrease = ((volume - avgVolume) / avgVolume) * 100
      const severity = volumeIncrease > 300 ? 'high' : volumeIncrease > 150 ? 'medium' : 'low'
      
      alerts.push({
        id: `volume_${symbol}_${Date.now()}`,
        symbol: symbol,
        type: 'volume_spike',
        condition: `Volume ${volumeIncrease.toFixed(0)}% above average`,
        value: volume,
        isActive: true,
        createdAt: new Date().toISOString(),
        ticker: symbol,
        message: `${symbol} volume spike ${Math.round(volumeIncrease)}% above average`,
        time: new Date().toLocaleTimeString(),
        severity: severity
      })
    }

    return alerts
  }

  // Generate real options flow alerts based on price movement patterns
  private generateOptionsFlowAlerts(marketData: MarketData): Alert[] {
    const alerts: Alert[] = []
    const { symbol, changePercent, volume, avgVolume } = marketData
    
    // Options flow signals based on price movement and volume
    if (Math.abs(changePercent) >= 1 && volume > avgVolume * 1.2) {
      const signalType = changePercent > 0 ? 'bullish' : 'bearish'
      const severity = Math.abs(changePercent) > 3 ? 'high' : 'medium'
      
      alerts.push({
        id: `options_${symbol}_${Date.now()}`,
        symbol: symbol,
        type: 'options_flow',
        condition: `${signalType} options signal`,
        value: Math.abs(changePercent),
        isActive: true,
        createdAt: new Date().toISOString(),
        ticker: symbol,
        message: `${symbol} ${signalType} options signal`,
        time: new Date().toLocaleTimeString(),
        severity: severity
      })
    }

    return alerts
  }

  // Generate technical breakout alerts
  private generateTechnicalAlerts(marketData: MarketData): Alert[] {
    const alerts: Alert[] = []
    const { symbol, price, high52w, low52w, changePercent } = marketData
    
    // 52-week high breakout
    if (high52w > 0 && price >= high52w * 0.98) {
      alerts.push({
        id: `breakout_${symbol}_${Date.now()}`,
        symbol: symbol,
        type: 'technical_breakout',
        condition: 'Approaching 52-week high',
        value: price,
        isActive: true,
        createdAt: new Date().toISOString(),
        ticker: symbol,
        message: `${symbol} approaching 52-week high at ${high52w.toFixed(2)}`,
        time: new Date().toLocaleTimeString(),
        severity: 'high'
      })
    }

    // 52-week low breakdown
    if (low52w > 0 && price <= low52w * 1.02) {
      alerts.push({
        id: `breakdown_${symbol}_${Date.now()}`,
        symbol: symbol,
        type: 'technical_breakout',
        condition: 'Near 52-week low',
        value: price,
        isActive: true,
        createdAt: new Date().toISOString(),
        ticker: symbol,
        message: `${symbol} near 52-week low at ${low52w.toFixed(2)}`,
        time: new Date().toLocaleTimeString(),
        severity: 'high'
      })
    }

    return alerts
  }

  // Main method to generate real alerts for watchlist
  async generateRealAlerts(tickers: string[]): Promise<Alert[]> {
    console.log(`🚨 Generating real alerts for ${tickers.length} stocks...`)
    
    const allAlerts: Alert[] = []
    
    for (const ticker of tickers) {
      try {
        const marketData = await this.fetchMarketData(ticker)
        if (!marketData) continue

        // Generate different types of alerts
        const priceAlerts = this.generatePriceMovementAlerts(marketData)
        const optionsAlerts = this.generateOptionsFlowAlerts(marketData)
        const technicalAlerts = this.generateTechnicalAlerts(marketData)

        allAlerts.push(...priceAlerts, ...optionsAlerts, ...technicalAlerts)
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Error generating alerts for ${ticker}:`, error)
      }
    }

    // Store alerts and update timestamp
    this.alerts = allAlerts
    this.lastUpdate = Date.now()
    
    console.log(`✅ Generated ${allAlerts.length} real alerts`)
    return allAlerts
  }

  // Get alerts by type
  getAlertsByType(type: string): Alert[] {
    return this.alerts.filter(alert => alert.type === type)
  }

  // Get all alerts
  getAllAlerts(): Alert[] {
    return this.alerts
  }

  // Get price movement alerts only
  getPriceMovementAlerts(): Alert[] {
    return this.alerts.filter(alert => 
      alert.type === 'price_spike' || 
      alert.type === 'volume_spike' || 
      alert.type === 'technical_breakout'
    )
  }

  // Get options flow alerts only
  getOptionsFlowAlerts(): Alert[] {
    return this.alerts.filter(alert => alert.type === 'options_flow')
  }

  // Check if data is fresh
  isDataFresh(): boolean {
    return Date.now() - this.lastUpdate < this.updateInterval
  }

  // Force refresh alerts
  async refreshAlerts(tickers: string[]): Promise<Alert[]> {
    return this.generateRealAlerts(tickers)
  }
}

export const realAlertsService = RealAlertsService.getInstance()
