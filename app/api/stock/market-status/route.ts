import { NextRequest, NextResponse } from 'next/server'

// Market configurations with accurate trading hours
const marketConfigs = {
  US: {
    currency: 'USD',
    exchanges: ['NYSE', 'NASDAQ'],
    timezone: 'America/New_York',
    tradingHours: {
      open: '09:30',
      close: '16:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    }
  },
  IN: {
    currency: 'INR',
    exchanges: ['NSE', 'BSE'],
    timezone: 'Asia/Kolkata',
    tradingHours: {
      open: '09:15',
      close: '15:30',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    }
  },
  GB: {
    currency: 'GBP',
    exchanges: ['LSE'],
    timezone: 'Europe/London',
    tradingHours: {
      open: '08:00',
      close: '16:30',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    }
  },
  JP: {
    currency: 'JPY',
    exchanges: ['TSE'],
    timezone: 'Asia/Tokyo',
    tradingHours: {
      open: '09:00',
      close: '15:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    }
  },
  AU: {
    currency: 'AUD',
    exchanges: ['ASX'],
    timezone: 'Australia/Sydney',
    tradingHours: {
      open: '10:00',
      close: '16:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    }
  },
  CA: {
    currency: 'CAD',
    exchanges: ['TSX'],
    timezone: 'America/Toronto',
    tradingHours: {
      open: '09:30',
      close: '16:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    }
  },
  DE: {
    currency: 'EUR',
    exchanges: ['FSE'],
    timezone: 'Europe/Berlin',
    tradingHours: {
      open: '09:00',
      close: '17:30',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    }
  },
  FR: {
    currency: 'EUR',
    exchanges: ['EPA'],
    timezone: 'Europe/Paris',
    tradingHours: {
      open: '09:00',
      close: '17:30',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    }
  }
}

async function getMarketStatus(market: string) {
  const config = marketConfigs[market as keyof typeof marketConfigs]
  if (!config) {
    throw new Error(`Unsupported market: ${market}`)
  }

  // Import timezone service
  const { timezoneService } = await import('../../../../src/lib/timezone-service')
  
  const marketTime = timezoneService.getMarketTime(market)
  const isOpen = timezoneService.isMarketOpen(market)
  const status = timezoneService.getMarketStatus(market)
  const nextOpen = timezoneService.getNextMarketOpen(market)

  return {
    country: market,
    currency: config.currency,
    exchange: config.exchanges[0],
    timezone: config.timezone,
    isOpen,
    nextOpen: nextOpen.toISOString(),
    nextClose: isOpen ? new Date(marketTime.getTime() + 7 * 60 * 60 * 1000).toISOString() : null,
    tradingHours: config.tradingHours,
    currentTime: marketTime.toISOString(),
    marketStatus: status
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const market = searchParams.get('market')
    
    if (market) {
      // Get specific market status
      try {
        const marketInfo = getMarketStatus(market)
        return NextResponse.json(marketInfo)
      } catch (error) {
        console.error(`Error getting market info for ${market}:`, error)
        // Return fallback market info
        return NextResponse.json({
          country: market,
          currency: 'USD',
          exchange: 'Unknown',
          timezone: 'UTC',
          isOpen: false,
          marketStatus: 'closed',
          currentTime: new Date().toISOString(),
          tradingHours: {
            open: '09:30',
            close: '16:00',
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
          }
        })
      }
    } else {
      // Get all markets status
      const markets = ['US', 'IN', 'GB', 'JP', 'AU', 'CA', 'DE', 'FR']
      const allMarkets = []
      
      // Use timezone service for all markets
      const { timezoneService } = await import('../../../../src/lib/timezone-service')
      const allMarketStatuses = timezoneService.getAllMarketStatuses()
      
      for (const [marketCode, status] of Object.entries(allMarketStatuses)) {
        allMarkets.push(status)
      }
      
      return NextResponse.json({
        markets: allMarkets,
        total: allMarkets.length,
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('Error fetching market status:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch market status' },
      { status: 500 }
    )
  }
}

