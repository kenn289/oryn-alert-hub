'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw, Globe, Clock, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react'

interface MarketOverview {
  market: string
  name: string
  flag: string
  currency: string
  status: 'open' | 'closed' | 'pre-market' | 'after-hours'
  isOpen: boolean
  currentTime: string
  nextOpen?: string
  nextClose?: string
  tradingHours: {
    open: string
    close: string
    days: string[]
  }
  lastUpdated: string
  error?: string
}

interface GlobalMarketOverview {
  markets: MarketOverview[]
  totalMarkets: number
  openMarkets: number
  closedMarkets: number
  lastUpdated: string
  errors: string[]
}

interface ImprovedGlobalMarketStatusProps {
  selectedMarket?: string
  onMarketChange?: (market: string) => void
  showDetailedView?: boolean
}

export function ImprovedGlobalMarketStatus({ 
  selectedMarket = 'US', 
  onMarketChange,
  showDetailedView = false 
}: ImprovedGlobalMarketStatusProps) {
  const [overview, setOverview] = useState<GlobalMarketOverview | null>(null)
  const [selectedMarketData, setSelectedMarketData] = useState<MarketOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const loadGlobalOverview = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/market/global-overview')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      setOverview(data)
      setLastRefresh(new Date())
      
      // Set selected market data if available
      if (selectedMarket && data.markets) {
        const marketData = data.markets.find((m: MarketOverview) => 
          m.market === selectedMarket.toUpperCase()
        )
        if (marketData) {
          setSelectedMarketData(marketData)
        }
      }
    } catch (error) {
      console.error('Error loading global market overview:', error)
      setError('Failed to load market data. Using fallback information.')
      
      // Set fallback data
      setOverview({
        markets: [],
        totalMarkets: 0,
        openMarkets: 0,
        closedMarkets: 0,
        lastUpdated: new Date().toISOString(),
        errors: ['Unable to fetch real-time market data']
      })
    } finally {
      setLoading(false)
    }
  }

  const loadSpecificMarket = async (market: string) => {
    try {
      const response = await fetch(`/api/market/global-overview?market=${market}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedMarketData(data)
      }
    } catch (error) {
      console.error(`Error loading market ${market}:`, error)
    }
  }

  const refreshData = async () => {
    await loadGlobalOverview()
  }

  const clearCache = async () => {
    try {
      await fetch('/api/market/global-overview?action=clear-cache', { method: 'GET' })
      await loadGlobalOverview()
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  useEffect(() => {
    loadGlobalOverview()
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(loadGlobalOverview, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedMarket) {
      loadSpecificMarket(selectedMarket)
    }
  }, [selectedMarket])

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <TrendingUp className="h-4 w-4" />
      case 'closed':
        return <TrendingDown className="h-4 w-4" />
      case 'pre-market':
        return <Clock className="h-4 w-4" />
      case 'after-hours':
        return <Clock className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString()
  }

  const formatDate = (timeString: string) => {
    return new Date(timeString).toLocaleDateString()
  }

  if (loading && !overview) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading global market data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Global Market Overview
              </CardTitle>
              <CardDescription>
                Real-time market status across global exchanges
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={refreshData} disabled={loading} size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={clearCache} variant="outline" size="sm">
                Clear Cache
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {overview && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{overview.totalMarkets}</div>
                <p className="text-sm text-muted-foreground">Total Markets</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{overview.openMarkets}</div>
                <p className="text-sm text-muted-foreground">Open Markets</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{overview.closedMarkets}</div>
                <p className="text-sm text-muted-foreground">Closed Markets</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{overview.errors.length}</div>
                <p className="text-sm text-muted-foreground">Errors</p>
              </div>
            </div>
          )}

          {lastRefresh && (
            <p className="text-sm text-muted-foreground text-center">
              Last updated: {formatTime(overview?.lastUpdated || '')} ({formatDate(overview?.lastUpdated || '')})
            </p>
          )}
        </CardContent>
      </Card>

      {/* Market Status Tabs */}
      {overview && (
        <Tabs defaultValue="all-markets" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all-markets">All Markets</TabsTrigger>
            <TabsTrigger value="open-markets">Open Markets</TabsTrigger>
            <TabsTrigger value="selected-market">Selected Market</TabsTrigger>
          </TabsList>

          <TabsContent value="all-markets" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {overview.markets.map((market) => (
                <Card key={market.market} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{market.flag}</span>
                      <div>
                        <p className="font-medium">{market.name}</p>
                        <p className="text-sm text-muted-foreground">{market.market}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(market.status)}
                      <Badge className={getStatusBadgeColor(market.status)}>
                        {market.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Currency: {market.currency}</p>
                    <p>Time: {formatTime(market.currentTime)}</p>
                    <p>Trading: {market.tradingHours.open} - {market.tradingHours.close}</p>
                    {market.error && (
                      <p className="text-red-500 text-xs">{market.error}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="open-markets" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {overview.markets
                .filter(market => market.isOpen)
                .map((market) => (
                  <Card key={market.market} className="p-4 border-green-200 bg-green-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{market.flag}</span>
                        <div>
                          <p className="font-medium">{market.name}</p>
                          <p className="text-sm text-muted-foreground">{market.market}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <Badge className="bg-green-100 text-green-800">
                          Open
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Currency: {market.currency}</p>
                      <p>Time: {formatTime(market.currentTime)}</p>
                      <p>Trading: {market.tradingHours.open} - {market.tradingHours.close}</p>
                    </div>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="selected-market" className="space-y-4">
            {selectedMarketData ? (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedMarketData.flag}</span>
                    <div>
                      <h3 className="text-xl font-bold">{selectedMarketData.name}</h3>
                      <p className="text-muted-foreground">{selectedMarketData.market} Market</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedMarketData.status)}
                    <Badge className={getStatusBadgeColor(selectedMarketData.status)}>
                      {selectedMarketData.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Currency</p>
                    <p className="font-medium">{selectedMarketData.currency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Time</p>
                    <p className="font-medium">{formatTime(selectedMarketData.currentTime)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Trading Hours</p>
                    <p className="font-medium">
                      {selectedMarketData.tradingHours.open} - {selectedMarketData.tradingHours.close}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{selectedMarketData.status}</p>
                  </div>
                </div>

                {selectedMarketData.nextOpen && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Next Open: {formatTime(selectedMarketData.nextOpen)}
                    </p>
                  </div>
                )}

                {selectedMarketData.nextClose && (
                  <div className="mt-2 p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-800">
                      Next Close: {formatTime(selectedMarketData.nextClose)}
                    </p>
                  </div>
                )}

                {selectedMarketData.error && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-800">{selectedMarketData.error}</p>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-6">
                <div className="text-center text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No market data available</p>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
