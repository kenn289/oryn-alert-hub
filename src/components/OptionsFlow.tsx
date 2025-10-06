"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  TrendingDown,
  Activity,
  Target,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
  Zap,
  BarChart3
} from "lucide-react"
import { toast } from "sonner"
import { WatchlistService } from "@/lib/watchlist"

interface OptionsFlowData {
  unusualActivity: {
    ticker: string
    volume: number
    avgVolume: number
    volumeRatio: number
    price: number
    change: number
    changePercent: number
    time: string
    type: 'call' | 'put' | 'mixed'
  }[]
  callPutRatio: {
    ticker: string
    callVolume: number
    putVolume: number
    ratio: number
    sentiment: 'bullish' | 'bearish' | 'neutral'
  }[]
  largeTrades: {
    ticker: string
    strike: number
    expiry: string
    type: 'call' | 'put'
    size: number
    premium: number
    time: string
    direction: 'buy' | 'sell'
  }[]
  volumeSpikes: {
    ticker: string
    currentVolume: number
    avgVolume: number
    spikePercent: number
    time: string
  }[]
}

// Helper function to get realistic expiry dates (next Friday + offset)
function getNextFriday(offsetDays: number = 0): string {
  const today = new Date()
  const currentDay = today.getDay()
  const daysUntilFriday = (5 - currentDay + 7) % 7 // Friday is day 5
  const nextFriday = new Date(today)
  nextFriday.setDate(today.getDate() + daysUntilFriday + offsetDays)
  return nextFriday.toISOString().split('T')[0]
}

export function OptionsFlow() {
  const [data, setData] = useState<OptionsFlowData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('unusual')
  const [apiError, setApiError] = useState<string | null>(null)
  const [isRateLimited, setIsRateLimited] = useState(false)

  useEffect(() => {
    loadOptionsFlowData()
  }, [])

  const loadOptionsFlowData = async () => {
    setLoading(true)
    setApiError(null)
    setIsRateLimited(false)
    
    try {
      // Prefer watchlist tickers for relevance
      const watchlist = WatchlistService.getWatchlist()
      const tickersParam = watchlist && watchlist.length > 0
        ? `?tickers=${encodeURIComponent(watchlist.map(w => w.ticker).join(','))}`
        : ''
      // Try to fetch real options flow data from API
      const response = await fetch(`/api/options-flow${tickersParam}`)
      
      if (!response.ok) {
        if (response.status === 429) {
          setIsRateLimited(true)
          setApiError('API rate limit exceeded. Please try again later.')
          throw new Error('API rate limit exceeded. Please try again later.')
        }
        setApiError(`API error: ${response.status}`)
        throw new Error(`API error: ${response.status}`)
      }
      
      const responseText = await response.text()
      let optionsData: OptionsFlowData
      
      try {
        optionsData = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse options flow JSON:', parseError)
        setApiError('Invalid data received from server')
        throw new Error('Invalid data received from server')
      }
      
      if (!optionsData || Object.keys(optionsData).length === 0) {
        setApiError('No options flow data available')
        throw new Error('No options flow data available')
      }

      setData(optionsData)
      setApiError(null)
      setIsRateLimited(false)
    } catch (error) {
      console.error('Error loading options flow data:', error)
      
      // Show specific error messages based on the error type
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          toast.error('API rate limit exceeded. Data will be available when limits reset.')
        } else if (error.message.includes('API error')) {
          toast.error('API service temporarily unavailable. Please try again later.')
        } else {
          toast.error(`Failed to load options flow data: ${error.message}`)
        }
      } else {
        toast.error('Failed to load options flow data')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadOptionsFlowData()
    setRefreshing(false)
    toast.success('Options flow data refreshed')
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return 'text-green-500'
      case 'bearish':
        return 'text-red-500'
      default:
        return 'text-blue-500'
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />
      case 'bearish':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-blue-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'call':
        return 'bg-green-500/20 text-green-600'
      case 'put':
        return 'bg-red-500/20 text-red-600'
      default:
        return 'bg-blue-500/20 text-blue-600'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Options Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Options Flow Analysis
          </h2>
          <p className="text-muted-foreground">Real-time options activity and institutional flow</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle className="h-3 w-3" />
              Live options data
            </div>
            <div className="text-xs text-muted-foreground">
              • Based on real stock movements • Institutional flow
            </div>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* API Status Display */}
      {(apiError || isRateLimited) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <h3 className="font-medium text-yellow-800">
                {isRateLimited ? 'API Rate Limited' : 'API Error'}
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                {apiError}
                {isRateLimited && (
                  <span className="block mt-1">
                    Data will be available when API limits reset.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="unusual">Unusual Activity</TabsTrigger>
          <TabsTrigger value="ratios">Call/Put Ratios</TabsTrigger>
          <TabsTrigger value="trades">Large Trades</TabsTrigger>
          <TabsTrigger value="volume">Volume Spikes</TabsTrigger>
        </TabsList>

        <TabsContent value="unusual" className="space-y-4">
          {data && data.unusualActivity && data.unusualActivity.map((activity, index) => (
            <Card key={index} className="hover-lift">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-lg font-bold">
                      {activity.ticker}
                    </Badge>
                    <Badge variant="outline" className={getTypeColor(activity.type)}>
                      {activity.type.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{activity.time}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">${activity.price.toFixed(2)}</div>
                    <div className={`text-sm ${activity.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {activity.change >= 0 ? '+' : ''}${activity.change.toFixed(2)} ({activity.changePercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Volume</div>
                    <div className="text-lg font-semibold">{activity.volume.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Avg Volume</div>
                    <div className="text-lg font-semibold">{activity.avgVolume.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Volume Ratio</div>
                    <div className="text-lg font-semibold text-blue-500">{activity.volumeRatio}x</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="ratios" className="space-y-4">
          {data && data.callPutRatio && data.callPutRatio.map((ratio, index) => (
            <Card key={index} className="hover-lift">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-lg font-bold">
                      {ratio.ticker}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {getSentimentIcon(ratio.sentiment)}
                      <span className={`text-sm font-medium ${getSentimentColor(ratio.sentiment)}`}>
                        {ratio.sentiment.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{ratio.ratio.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Call/Put Ratio</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Call Volume</div>
                    <div className="text-lg font-semibold text-green-500">
                      {ratio.callVolume.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Put Volume</div>
                    <div className="text-lg font-semibold text-red-500">
                      {ratio.putVolume.toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="trades" className="space-y-4">
          {data && data.largeTrades && data.largeTrades.map((trade, index) => (
            <Card key={index} className="hover-lift">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-lg font-bold">
                      {trade.ticker}
                    </Badge>
                    <Badge variant="outline" className={getTypeColor(trade.type)}>
                      {trade.type.toUpperCase()} ${trade.strike}
                    </Badge>
                    <Badge variant="outline" className={
                      trade.direction === 'buy' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'
                    }>
                      {trade.direction.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{trade.time}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">${(trade.premium / 1000).toFixed(0)}K</div>
                    <div className="text-sm text-muted-foreground">Premium</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Size</div>
                    <div className="text-lg font-semibold">{trade.size.toLocaleString()} contracts</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Strike</div>
                    <div className="text-lg font-semibold">${trade.strike}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Expiry</div>
                    <div className="text-lg font-semibold">{trade.expiry}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="volume" className="space-y-4">
          {data && data.volumeSpikes && data.volumeSpikes.map((spike, index) => (
            <Card key={index} className="hover-lift">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-lg font-bold">
                      {spike.ticker}
                    </Badge>
                    <Badge variant="outline" className="bg-orange-500/20 text-orange-600">
                      +{spike.spikePercent}% SPIKE
                    </Badge>
                    <span className="text-sm text-muted-foreground">{spike.time}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-500">+{spike.spikePercent}%</div>
                    <div className="text-sm text-muted-foreground">Volume Spike</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Current Volume</div>
                    <div className="text-lg font-semibold">{spike.currentVolume.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Average Volume</div>
                    <div className="text-lg font-semibold">{spike.avgVolume.toLocaleString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
