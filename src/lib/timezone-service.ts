import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'
)

export interface MarketTimezone {
  market: string
  timezone: string
  tradingHours: {
    open: string
    close: string
    days: string[]
  }
  currency: string
  exchanges: string[]
}

export interface DayChangeEvent {
  id: string
  market: string
  date: string
  previousDate: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  processedAt?: string
  errorMessage?: string
  createdAt: string
}

export class TimezoneService {
  private readonly markets: Record<string, MarketTimezone> = {
    US: {
      market: 'US',
      timezone: 'America/New_York',
      tradingHours: {
        open: '09:30',
        close: '16:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      currency: 'USD',
      exchanges: ['NYSE', 'NASDAQ']
    },
    IN: {
      market: 'IN',
      timezone: 'Asia/Kolkata',
      tradingHours: {
        open: '09:15',
        close: '15:30',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      currency: 'INR',
      exchanges: ['NSE', 'BSE']
    },
    GB: {
      market: 'GB',
      timezone: 'Europe/London',
      tradingHours: {
        open: '08:00',
        close: '16:30',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      currency: 'GBP',
      exchanges: ['LSE']
    },
    JP: {
      market: 'JP',
      timezone: 'Asia/Tokyo',
      tradingHours: {
        open: '09:00',
        close: '15:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      currency: 'JPY',
      exchanges: ['TSE']
    },
    AU: {
      market: 'AU',
      timezone: 'Australia/Sydney',
      tradingHours: {
        open: '10:00',
        close: '16:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      currency: 'AUD',
      exchanges: ['ASX']
    },
    CA: {
      market: 'CA',
      timezone: 'America/Toronto',
      tradingHours: {
        open: '09:30',
        close: '16:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      currency: 'CAD',
      exchanges: ['TSX']
    },
    DE: {
      market: 'DE',
      timezone: 'Europe/Berlin',
      tradingHours: {
        open: '09:00',
        close: '17:30',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      currency: 'EUR',
      exchanges: ['FSE']
    },
    FR: {
      market: 'FR',
      timezone: 'Europe/Paris',
      tradingHours: {
        open: '09:00',
        close: '17:30',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      currency: 'EUR',
      exchanges: ['EPA']
    }
  }

  /**
   * Get current time in a specific market timezone
   */
  getMarketTime(market: string): Date {
    const config = this.markets[market]
    if (!config) {
      throw new Error(`Unsupported market: ${market}`)
    }

    return new Date(new Date().toLocaleString("en-US", { timeZone: config.timezone }))
  }

  /**
   * Check if a market is currently open
   */
  isMarketOpen(market: string): boolean {
    const config = this.markets[market]
    if (!config) return false

    const marketTime = this.getMarketTime(market)
    const dayOfWeek = marketTime.getDay()
    
    // Check if it's a trading day
    const tradingDays = [1, 2, 3, 4, 5] // Monday to Friday
    if (!tradingDays.includes(dayOfWeek)) {
      return false
    }

    // Check if it's within trading hours
    const [openHour, openMin] = config.tradingHours.open.split(':').map(Number)
    const [closeHour, closeMin] = config.tradingHours.close.split(':').map(Number)
    
    const openTime = openHour * 60 + openMin
    const closeTime = closeHour * 60 + closeMin
    const currentTime = marketTime.getHours() * 60 + marketTime.getMinutes()

    return currentTime >= openTime && currentTime < closeTime
  }

  /**
   * Get market status for a specific market
   */
  getMarketStatus(market: string): 'open' | 'closed' | 'pre-market' | 'after-hours' {
    const config = this.markets[market]
    if (!config) return 'closed'

    const marketTime = this.getMarketTime(market)
    const dayOfWeek = marketTime.getDay()
    
    // Check if it's a trading day
    const tradingDays = [1, 2, 3, 4, 5] // Monday to Friday
    if (!tradingDays.includes(dayOfWeek)) {
      return 'closed'
    }

    const [openHour, openMin] = config.tradingHours.open.split(':').map(Number)
    const [closeHour, closeMin] = config.tradingHours.close.split(':').map(Number)
    
    const openTime = openHour * 60 + openMin
    const closeTime = closeHour * 60 + closeMin
    const currentTime = marketTime.getHours() * 60 + marketTime.getMinutes()

    if (currentTime >= openTime && currentTime < closeTime) {
      return 'open'
    } else if (currentTime < openTime) {
      return 'pre-market'
    } else {
      return 'after-hours'
    }
  }

  /**
   * Get next market open time
   */
  getNextMarketOpen(market: string): Date {
    const config = this.markets[market]
    if (!config) {
      throw new Error(`Unsupported market: ${market}`)
    }

    const marketTime = this.getMarketTime(market)
    const dayOfWeek = marketTime.getDay()
    
    // Find next trading day
    let nextTradingDay = new Date(marketTime)
    if (dayOfWeek === 6) { // Saturday
      nextTradingDay.setDate(marketTime.getDate() + 2) // Monday
    } else if (dayOfWeek === 0) { // Sunday
      nextTradingDay.setDate(marketTime.getDate() + 1) // Monday
    } else if (dayOfWeek === 5) { // Friday
      nextTradingDay.setDate(marketTime.getDate() + 3) // Monday
    } else {
      // Weekday - check if market is closed for the day
      const [openHour, openMin] = config.tradingHours.open.split(':').map(Number)
      const openTime = openHour * 60 + openMin
      const currentTime = marketTime.getHours() * 60 + marketTime.getMinutes()
      
      if (currentTime >= openTime) {
        // Market already open today, next open is tomorrow
        nextTradingDay.setDate(marketTime.getDate() + 1)
      }
    }
    
    // Set to market open time
    const [openHour, openMin] = config.tradingHours.open.split(':').map(Number)
    nextTradingDay.setHours(openHour, openMin, 0, 0)
    
    return nextTradingDay
  }

  /**
   * Check if it's a new trading day for any market
   */
  async checkForDayChange(): Promise<DayChangeEvent[]> {
    const dayChangeEvents: DayChangeEvent[] = []
    const now = new Date()

    for (const [market, config] of Object.entries(this.markets)) {
      try {
        const marketTime = this.getMarketTime(market)
        const marketDate = marketTime.toISOString().split('T')[0]
        
        // Check if we've already processed this day change
        const { data: existingEvent } = await supabase
          .from('day_change_events')
          .select('*')
          .eq('market', market)
          .eq('date', marketDate)
          .single()

        if (existingEvent) {
          continue // Already processed
        }

        // Check if market just opened (within last hour)
        const marketStatus = this.getMarketStatus(market)
        if (marketStatus === 'open') {
          const [openHour, openMin] = config.tradingHours.open.split(':').map(Number)
          const openTime = new Date(marketTime)
          openTime.setHours(openHour, openMin, 0, 0)
          
          const timeSinceOpen = marketTime.getTime() - openTime.getTime()
          const oneHour = 60 * 60 * 1000

          if (timeSinceOpen <= oneHour) {
            // Create day change event
            const { data: event, error } = await supabase
              .from('day_change_events')
              .insert({
                market,
                date: marketDate,
                previous_date: new Date(marketTime.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending'
              })
              .select()
              .single()

            if (error) {
              console.error(`Error creating day change event for ${market}:`, error)
              continue
            }

            dayChangeEvents.push({
              id: event.id,
              market: event.market,
              date: event.date,
              previousDate: event.previous_date,
              status: event.status,
              createdAt: event.created_at
            })
          }
        }
      } catch (error) {
        console.error(`Error checking day change for ${market}:`, error)
      }
    }

    return dayChangeEvents
  }

  /**
   * Process day change for a specific market
   */
  async processDayChange(market: string, date: string): Promise<boolean> {
    try {
      console.log(`🔄 Processing day change for ${market} on ${date}`)

      // Update day change event status
      const { error: updateError } = await supabase
        .from('day_change_events')
        .update({ 
          status: 'processing',
          processed_at: new Date().toISOString()
        })
        .eq('market', market)
        .eq('date', date)

      if (updateError) {
        console.error(`Error updating day change event:`, updateError)
        return false
      }

      // Refresh ML predictions for this market
      await this.refreshMLPredictions(market, date)

      // Update market data cache
      await this.updateMarketDataCache(market, date)

      // Process any pending alerts
      await this.processPendingAlerts(market, date)

      // Mark as completed
      const { error: completeError } = await supabase
        .from('day_change_events')
        .update({ 
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('market', market)
        .eq('date', date)

      if (completeError) {
        console.error(`Error completing day change event:`, completeError)
        return false
      }

      console.log(`✅ Day change processed successfully for ${market}`)
      return true

    } catch (error) {
      console.error(`Error processing day change for ${market}:`, error)
      
      // Mark as failed
      await supabase
        .from('day_change_events')
        .update({ 
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          processed_at: new Date().toISOString()
        })
        .eq('market', market)
        .eq('date', date)

      return false
    }
  }

  /**
   * Refresh ML predictions for a market
   */
  private async refreshMLPredictions(market: string, date: string): Promise<void> {
    try {
      // This would call your ML prediction service
      // For now, we'll just log it
      console.log(`🤖 Refreshing ML predictions for ${market} on ${date}`)
      
      // TODO: Implement actual ML prediction refresh
      // await mlPredictionService.refreshPredictions(market, date)
    } catch (error) {
      console.error(`Error refreshing ML predictions for ${market}:`, error)
    }
  }

  /**
   * Update market data cache
   */
  private async updateMarketDataCache(market: string, date: string): Promise<void> {
    try {
      console.log(`📊 Updating market data cache for ${market} on ${date}`)
      
      // TODO: Implement market data cache update
      // await marketDataService.updateCache(market, date)
    } catch (error) {
      console.error(`Error updating market data cache for ${market}:`, error)
    }
  }

  /**
   * Process pending alerts
   */
  private async processPendingAlerts(market: string, date: string): Promise<void> {
    try {
      console.log(`🔔 Processing pending alerts for ${market} on ${date}`)
      
      // TODO: Implement alert processing
      // await alertService.processPendingAlerts(market, date)
    } catch (error) {
      console.error(`Error processing alerts for ${market}:`, error)
    }
  }

  /**
   * Get all market statuses
   */
  getAllMarketStatuses(): Record<string, any> {
    const statuses: Record<string, any> = {}

    for (const [market, config] of Object.entries(this.markets)) {
      try {
        const marketTime = this.getMarketTime(market)
        const status = this.getMarketStatus(market)
        const isOpen = this.isMarketOpen(market)
        const nextOpen = this.getNextMarketOpen(market)

        statuses[market] = {
          market,
          timezone: config.timezone,
          currency: config.currency,
          exchanges: config.exchanges,
          currentTime: marketTime.toISOString(),
          status,
          isOpen,
          nextOpen: nextOpen.toISOString(),
          tradingHours: config.tradingHours
        }
      } catch (error) {
        console.error(`Error getting status for ${market}:`, error)
        statuses[market] = {
          market,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    return statuses
  }

  /**
   * Get day change events for a date range
   */
  async getDayChangeEvents(startDate: string, endDate: string): Promise<DayChangeEvent[]> {
    try {
      const { data, error } = await supabase
        .from('day_change_events')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data.map(event => ({
        id: event.id,
        market: event.market,
        date: event.date,
        previousDate: event.previous_date,
        status: event.status,
        processedAt: event.processed_at,
        errorMessage: event.error_message,
        createdAt: event.created_at
      }))
    } catch (error) {
      console.error('Error getting day change events:', error)
      return []
    }
  }
}

export const timezoneService = new TimezoneService()
