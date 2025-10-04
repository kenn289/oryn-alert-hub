"use client"

import { toast } from 'sonner'

export interface Alert {
  id: string
  symbol: string
  type: 'price_above' | 'price_below' | 'volume_spike' | 'earnings' | 'news'
  condition: string
  value: number
  isActive: boolean
  createdAt: string
  triggeredAt?: string
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
      const stored = localStorage.getItem('oryn_alerts')
      if (stored) {
        this.alerts = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load alerts:', error)
      this.alerts = []
    }
  }

  private saveAlerts() {
    try {
      localStorage.setItem('oryn_alerts', JSON.stringify(this.alerts))
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
      // This is a placeholder implementation
      // In a real app, this would analyze market data and generate alerts
      const alerts: Alert[] = []
      
      for (const ticker of tickers) {
        // Generate sample alerts for demonstration
        if (Math.random() > 0.7) { // 30% chance of generating an alert
          alerts.push({
            id: `alert_${Date.now()}_${ticker}`,
            symbol: ticker,
            type: Math.random() > 0.5 ? 'price_above' : 'price_below',
            condition: Math.random() > 0.5 ? 'rose above' : 'fell below',
            value: Math.random() * 200 + 50,
            isActive: true,
            createdAt: new Date().toISOString(),
            triggeredAt: undefined
          })
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