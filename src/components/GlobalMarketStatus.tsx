"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Clock, Globe, TrendingUp, TrendingDown, AlertCircle } from "lucide-react"
import { globalStockService, MarketInfo } from "../lib/global-stock-service"
import { useCurrency } from "../contexts/CurrencyContext"
import { useAuth } from "../contexts/AuthContext"
import { MarketInsightsDashboard } from "./MarketInsightsDashboard"
import { FreeUserMarketModal } from "./FreeUserMarketModal"
import { subscriptionService } from "../lib/subscription-service"

interface GlobalMarketStatusProps {
  selectedMarket?: string
  onMarketChange?: (market: string) => void
}

export function GlobalMarketStatus({ selectedMarket = 'US', onMarketChange }: GlobalMarketStatusProps) {
  const { selectedTimezone } = useCurrency()
  const { user } = useAuth()
  const [marketInfo, setMarketInfo] = useState<MarketInfo | null>(null)
  const [allMarkets, setAllMarkets] = useState<MarketInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [userTimezone, setUserTimezone] = useState('')
  const [isIndianUser, setIsIndianUser] = useState(false)
  const [currentMarket, setCurrentMarket] = useState(selectedMarket)
  const [selectedMarketForInsights, setSelectedMarketForInsights] = useState<string | null>(null)
  const [showFreeUserModal, setShowFreeUserModal] = useState(false)
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'master'>('free')

  useEffect(() => {
    detectUserLocation()
    loadMarketInfo()
    loadUserTier()
    const interval = setInterval(loadMarketInfo, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [currentMarket, user])

  // Force refresh on mount to ensure data is loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      loadMarketInfo()
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    setCurrentMarket(selectedMarket)
  }, [selectedMarket])

  const detectUserLocation = () => {
    // Use selected timezone from currency context, fallback to browser timezone
    const timezone = selectedTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    setUserTimezone(timezone)
    
    // Detect if user is in India
    const isIndia = timezone === 'Asia/Kolkata' || timezone === 'Asia/Calcutta' || timezone === 'IST'
    setIsIndianUser(isIndia)
    
    // Prefer IN market locally for Indian users, but do NOT auto-open selector
    if (isIndia && selectedMarket === 'US') {
      setCurrentMarket('IN')
      // Intentionally do not call onMarketChange here to avoid opening any dialog automatically
    }
  }

  const loadUserTier = async () => {
    if (!user) {
      setUserTier('free')
      return
    }

    try {
      const subscription = await subscriptionService.getSubscriptionStatus(user.id, user.email || '')
      if (subscription?.plan === 'master') {
        setUserTier('master')
      } else if (subscription?.plan === 'pro') {
        setUserTier('pro')
      } else {
        setUserTier('free')
      }
    } catch (error) {
      console.warn('Failed to load user tier:', error)
      setUserTier('free')
    }
  }

  const handleMarketClick = (market: string) => {
    // Convert market code to the correct market name for AI insights
    const marketName = getMarketNameForInsights(market)
    setSelectedMarketForInsights(marketName)
    
    if (userTier === 'free') {
      setShowFreeUserModal(true)
    }
    // For pro/master users, the MarketInsightsDashboard will show automatically
  }

  const handleCloseInsights = () => {
    setSelectedMarketForInsights(null)
  }

  const handleCloseFreeModal = () => {
    setShowFreeUserModal(false)
    setSelectedMarketForInsights(null)
  }

  const handleUpgrade = () => {
    // Navigate to pricing page or show upgrade modal
    window.location.href = '/pricing'
  }

  const loadMarketInfo = async () => {
    try {
      const info = globalStockService.getMarketInfo(currentMarket)
      setMarketInfo(info)

      // Load all markets for overview
      const markets = ['US', 'IN', 'UK', 'JP', 'AU', 'CA', 'DE', 'FR']
      const allMarketInfo = markets.map(market => globalStockService.getMarketInfo(market))
      setAllMarkets(allMarketInfo)
    } catch (error) {
      console.error('Error loading market info:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMarketIcon = (market: string) => {
    const icons: { [key: string]: string } = {
      'US': '🇺🇸',
      'IN': '🇮🇳',
      'UK': '🇬🇧',
      'JP': '🇯🇵',
      'AU': '🇦🇺',
      'CA': '🇨🇦',
      'DE': '🇩🇪',
      'FR': '🇫🇷'
    }
    return icons[market] || '🌍'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-500'
      case 'closed':
        return 'bg-red-500'
      case 'pre-market':
        return 'bg-yellow-500'
      case 'after-hours':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'closed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      case 'pre-market':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'after-hours':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Open'
      case 'closed':
        return 'Closed'
      case 'pre-market':
        return 'Pre-Market'
      case 'after-hours':
        return 'After Hours'
      default:
        return 'Unknown'
    }
  }

  const formatTime = (timeString: string, marketTimezone?: string) => {
    if (!timeString) return 'N/A'
    const date = new Date(timeString)
    
    // Use selected timezone from currency context
    const userTimezone = selectedTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    
    // Show time in user's selected timezone
    const userTime = date.toLocaleTimeString('en-US', { 
      hour12: true,
      timeZone: userTimezone
    })
    
    // Also show market time if different
    if (marketTimezone && marketTimezone !== userTimezone) {
      const marketTime = date.toLocaleTimeString('en-US', { 
        hour12: true,
        timeZone: marketTimezone
      })
      return `${userTime} (${marketTime} ${marketTimezone})`
    }
    
    return userTime
  }

  const getExchangeName = (market: string) => {
    const exchanges: { [key: string]: string } = {
      'US': 'NYSE & NASDAQ',
      'IN': 'NSE & BSE',
      'UK': 'LSE',
      'JP': 'TSE',
      'AU': 'ASX',
      'CA': 'TSX',
      'DE': 'FSE',
      'FR': 'EPA'
    }
    return exchanges[market] || market
  }

  const getMarketDisplayName = (market: string) => {
    const displayNames: { [key: string]: string } = {
      'US': 'NASDAQ',
      'IN': 'NSE',
      'UK': 'LSE',
      'JP': 'TSE',
      'AU': 'ASX',
      'CA': 'TSX',
      'DE': 'FSE',
      'FR': 'EPA'
    }
    return displayNames[market] || market
  }

  const getMarketNameForInsights = (market: string) => {
    // Map country codes to the market names expected by AI insights service
    const marketNames: { [key: string]: string } = {
      'US': 'US',        // US market uses 'US' key in AI service
      'IN': 'IN',        // Indian market uses 'IN' key
      'GB': 'GB',        // UK market uses 'GB' key  
      'JP': 'JP',        // Japanese market uses 'JP' key
      'AU': 'AU',        // Australian market uses 'AU' key
      'CA': 'CA',        // Canadian market uses 'CA' key
      'DE': 'DE',        // German market uses 'DE' key
      'FR': 'FR'         // French market uses 'FR' key
    }
    return marketNames[market] || market
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Market Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Selected Market Status */}
      {marketInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {getMarketIcon(currentMarket)} {currentMarket} Market Status
            </CardTitle>
            <CardDescription>
              {getExchangeName(currentMarket)} • {marketInfo.currency} • {marketInfo.timezone}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold mb-1">
                  {new Date().toLocaleTimeString('en-US', { 
                    hour12: true,
                    timeZone: selectedTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone
                  })}
                </div>
                <div className="text-sm text-muted-foreground mb-1">
                  {selectedTimezone ? `${selectedTimezone} (Your Time)` : 'Your Time'}
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  {new Date().toLocaleTimeString('en-US', { 
                    hour12: true,
                    timeZone: marketInfo.timezone
                  })} {marketInfo.timezone}
                </div>
                <div className="text-xs text-muted-foreground">Market Time</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(marketInfo.marketStatus)}`}></div>
                  <span className="text-lg font-semibold">
                    {getStatusText(marketInfo.marketStatus)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">Market Status</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold mb-2">
                  {marketInfo.tradingHours.open} - {marketInfo.tradingHours.close}
                </div>
                <div className="text-sm text-muted-foreground">
                  {getExchangeName(currentMarket)} Trading Hours
                </div>
              </div>
            </div>

            {marketInfo.marketStatus === 'closed' && marketInfo.nextOpen && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Next market open: {formatTime(marketInfo.nextOpen, marketInfo.timezone)}</span>
                </div>
              </div>
            )}

            {marketInfo.marketStatus === 'open' && marketInfo.nextClose && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                  <TrendingUp className="h-4 w-4" />
                  <span>Market closes at: {formatTime(marketInfo.nextClose, marketInfo.timezone)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Markets Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Global Markets Overview
          </CardTitle>
          <CardDescription>
            Real-time status of all supported markets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {allMarkets.map((market) => (
              <div
                key={market.country}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  currentMarket === market.country 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-muted'
                }`}
                onClick={() => handleMarketClick(market.country)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getMarketIcon(market.country)}</span>
                    <span className="font-medium">{market.country}</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(market.marketStatus)}`}></div>
                </div>
                
                <div className="text-sm text-muted-foreground mb-1">
                  {getExchangeName(market.country)} • {market.currency}
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {new Date().toLocaleTimeString('en-US', { 
                    hour12: false,
                    timeZone: selectedTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone
                  })}
                </div>
                
                <div className="mt-2">
                  <Badge 
                    variant={market.marketStatus === 'open' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {getStatusText(market.marketStatus)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stock selection handled by parent via onMarketChange */}

      {/* Market Insights Dashboard for Pro/Master users */}
      {selectedMarketForInsights && userTier !== 'free' && (
        <MarketInsightsDashboard
          market={selectedMarketForInsights}
          onClose={handleCloseInsights}
        />
      )}

      {/* Free User Modal */}
      {showFreeUserModal && selectedMarketForInsights && (
        <FreeUserMarketModal
          market={selectedMarketForInsights}
          isOpen={showFreeUserModal}
          onClose={handleCloseFreeModal}
          onUpgrade={handleUpgrade}
        />
      )}
    </div>
  )
}
