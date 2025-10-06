"use client"

import { toast } from 'sonner'

export interface Alert {
  id: string
  symbol: string
  type: 
    | 'price_above'
    | 'price_below'
    | 'volume_spike'
    | 'earnings'
    | 'news'
    | 'options_flow'
    | 'price_spike'
    | 'news_alert'
    | 'technical_breakout'
  condition: string
  value: number
  isActive: boolean
  createdAt: string
  triggeredAt?: string
  // UI convenience fields (optional)
  ticker?: string
  message?: string
  time?: string
  severity?: 'low' | 'medium' | 'high'
}

export class AlertService {
  private static instance: AlertService
  private alerts: Alert[] = []
  private checkInterval: NodeJS.Timeout | null = null

  static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService()
    }
    return AlertService.instance
  }

  constructor() {
    this.loadAlerts()
    this.startMonitoring()
  }

  private loadAlerts() {
    try {
      // Check if we're in browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('oryn_alerts')
        if (stored) {
          this.alerts = JSON.parse(stored)
        }
      }
    } catch (error) {
      console.error('Failed to load alerts:', error)
      this.alerts = []
    }
  }

  private saveAlerts() {
    try {
      // Check if we're in browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('oryn_alerts', JSON.stringify(this.alerts))
      }
    } catch (error) {
      console.error('Failed to save alerts:', error)
    }
  }

  createAlert(alert: Omit<Alert, 'id' | 'createdAt' | 'isActive'>): Alert {
    const newAlert: Alert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      isActive: true
    }

    this.alerts.push(newAlert)
    this.saveAlerts()
    toast.success(`Alert created for ${alert.symbol}`)
    return newAlert
  }

  getAlerts(): Alert[] {
    return this.alerts
  }

  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => alert.isActive)
  }

  updateAlert(id: string, updates: Partial<Alert>): boolean {
    const index = this.alerts.findIndex(alert => alert.id === id)
    if (index !== -1) {
      this.alerts[index] = { ...this.alerts[index], ...updates }
      this.saveAlerts()
      return true
    }
    return false
  }

  deleteAlert(id: string): boolean {
    const index = this.alerts.findIndex(alert => alert.id === id)
    if (index !== -1) {
      this.alerts.splice(index, 1)
      this.saveAlerts()
      toast.success('Alert deleted')
      return true
    }
    return false
  }

  toggleAlert(id: string): boolean {
    const alert = this.alerts.find(alert => alert.id === id)
    if (alert) {
      alert.isActive = !alert.isActive
      this.saveAlerts()
      toast.success(`Alert ${alert.isActive ? 'enabled' : 'disabled'}`)
      return true
    }
    return false
  }

  private startMonitoring() {
    // Check alerts every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkAlerts()
    }, 30000)
  }

  private async checkAlerts() {
    const activeAlerts = this.getActiveAlerts()
    if (activeAlerts.length === 0) return

    try {
      // Check each active alert
      for (const alert of activeAlerts) {
        await this.checkAlert(alert)
      }
    } catch (error) {
      console.error('Error checking alerts:', error)
    }
  }

  private async checkAlert(alert: Alert) {
    try {
      // Fetch current stock data
      const response = await fetch(`/api/stock/multi/${alert.symbol}`)
      if (!response.ok) return

      const stockData = await response.json()
      if (!stockData || !stockData.price) return

      const currentPrice = stockData.price
      let shouldTrigger = false

      // Check alert conditions
      switch (alert.type) {
        case 'price_above':
          shouldTrigger = currentPrice >= alert.value
          break
        case 'price_below':
          shouldTrigger = currentPrice <= alert.value
          break
        case 'volume_spike':
          // This would require volume data from the API
          shouldTrigger = false // Placeholder
          break
        case 'earnings':
          // This would require earnings calendar data
          shouldTrigger = false // Placeholder
          break
        case 'news':
          // This would require news data
          shouldTrigger = false // Placeholder
          break
      }

      if (shouldTrigger && !alert.triggeredAt) {
        this.triggerAlert(alert, currentPrice)
      }
    } catch (error) {
      console.error(`Error checking alert for ${alert.symbol}:`, error)
    }
  }

  private triggerAlert(alert: Alert, currentPrice: number, timezone?: string) {
    alert.triggeredAt = new Date().toISOString()
    alert.isActive = false
    this.saveAlerts()

    // Show notification
    const message = `${alert.symbol} ${alert.condition}: $${currentPrice.toFixed(2)}`
    toast.success(message, {
      duration: 10000,
      description: `Alert triggered at ${new Date().toLocaleTimeString('en-US', { 
        timeZone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone 
      })}`
    })

    // You could also send to a notification service here
    console.log(`Alert triggered: ${alert.symbol} - ${message}`)
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  // Get alert statistics
  getStats() {
    const total = this.alerts.length
    const active = this.alerts.filter(a => a.isActive).length
    const triggered = this.alerts.filter(a => a.triggeredAt).length
    const pending = active

    return {
      total,
      active,
      triggered,
      pending
    }
  }

  // Generate alerts based on watchlist (static method)
  static async generateAlerts(tickers: string[]): Promise<Alert[]> {
    try {
      // Lightweight heuristic alerts based on latest prices
      const alerts: Alert[] = []

      for (const ticker of tickers) {
        try {
          const res = await fetch(`/api/stock/multi/${ticker}`)
          if (!res.ok) continue
          const data = await res.json()
          if (!data || !data.price) continue

          const price = Number(data.price)
          const prevClose = Number(data.previousClose || price)
          const changePercent = prevClose ? ((price - prevClose) / prevClose) * 100 : 0
          const absChange = Math.abs(changePercent)
          const severity: 'low' | 'medium' | 'high' = absChange > 5 ? 'high' : absChange > 2 ? 'medium' : 'low'
          const nowStr = new Date().toLocaleTimeString()

          // Always emit at least one alert type for visibility
          const baseId = `alert_${ticker}_${Date.now()}`
          if (Math.abs(changePercent) >= 2) {
            alerts.push({
              id: `${baseId}_price_spike`,
              symbol: ticker,
              type: 'price_spike',
              condition: changePercent > 0 ? 'spiked above daily avg' : 'dropped below daily avg',
              value: price,
              isActive: true,
              createdAt: new Date().toISOString(),
              ticker,
              message: `${ticker} ${changePercent > 0 ? 'up' : 'down'} ${absChange.toFixed(2)}% to ${price.toFixed(2)}`,
              time: nowStr,
              severity
            })
          }

          // Options flow-like signal synthesized from changePercent magnitude
          if (Math.abs(changePercent) >= 1) {
            alerts.push({
              id: `${baseId}_options_flow`,
              symbol: ticker,
              type: 'options_flow',
              condition: changePercent > 0 ? 'bullish flow detected' : 'bearish flow detected',
              value: price,
              isActive: true,
              createdAt: new Date().toISOString(),
              ticker,
              message: `${ticker} ${changePercent > 0 ? 'bullish' : 'bearish'} options signal`,
              time: nowStr,
              severity
            })
          }

          // Add a generic volume spike placeholder (actual volume-based check requires richer data)
          if (data.volume && data.avgVolume && data.volume > data.avgVolume * 1.5) {
            alerts.push({
              id: `${baseId}_volume_spike`,
              symbol: ticker,
              type: 'volume_spike',
              condition: 'volume above 1.5x average',
              value: data.volume,
              isActive: true,
              createdAt: new Date().toISOString(),
              ticker,
              message: `${ticker} volume spike ${Math.round((data.volume / data.avgVolume) * 100)}% of avg`,
              time: nowStr,
              severity
            })
          }
        } catch (e) {
          // ignore individual ticker failures
        }
      }

      return alerts
    } catch (error) {
      console.error('Error generating alerts:', error)
      return []
    }
  }
}

export const alertService = AlertService.getInstance()