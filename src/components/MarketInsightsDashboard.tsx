"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { RefreshCw, TrendingUp, TrendingDown, Clock, Target, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { aiMarketInsightsService, MarketInsights, MarketInsight } from "../lib/ai-market-insights-service"
import { useCurrency } from "../contexts/CurrencyContext"
import { useAuth } from "../contexts/AuthContext"

interface MarketInsightsDashboardProps {
  market: string
  onClose: () => void
}

export function MarketInsightsDashboard({ market, onClose }: MarketInsightsDashboardProps) {
  const { formatCurrency, selectedTimezone } = useCurrency()
  const { user } = useAuth()
  const [insights, setInsights] = useState<MarketInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("dayTrading")

  // Determine original currency based on stock symbol
  const getOriginalCurrency = (symbol: string): string => {
    if (symbol.endsWith('.NS') || symbol.endsWith('.BO')) {
      return 'INR' // Indian stocks
    } else if (symbol.endsWith('.L')) {
      return 'GBP' // UK stocks
    } else if (symbol.endsWith('.T')) {
      return 'JPY' // Japanese stocks
    } else if (symbol.endsWith('.AX')) {
      return 'AUD' // Australian stocks
    } else if (symbol.endsWith('.TO')) {
      return 'CAD' // Canadian stocks
    } else if (symbol.endsWith('.DE')) {
      return 'EUR' // German stocks
    } else if (symbol.endsWith('.PA') || symbol.endsWith('.AS')) {
      return 'EUR' // French/Dutch stocks
    } else {
      return 'USD' // Default to USD for US stocks
    }
  }

  useEffect(() => {
    loadInsights()
  }, [market])

  const loadInsights = async () => {
    try {
      setLoading(true)
      console.log(`🔍 Loading insights for market: ${market}`)
      const data = await aiMarketInsightsService.getMarketInsights(market)
      console.log(`📊 Insights loaded:`, data)
      setInsights(data)
    } catch (error) {
      console.error('Error loading market insights:', error)
      // Don't show error toast - the service now handles API failures gracefully
      console.warn('Market insights service handled API failures gracefully')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      aiMarketInsightsService.clearCache()
      const data = await aiMarketInsightsService.getMarketInsights(market)
      setInsights(data)
      toast.success('Market insights refreshed')
    } catch (error) {
      console.error('Error refreshing insights:', error)
      toast.error('Failed to refresh insights')
    } finally {
      setRefreshing(false)
    }
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 85) {
      return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">High</Badge>
    } else if (confidence >= 70) {
      return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Medium</Badge>
    } else {
      return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Low</Badge>
    }
  }

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Low Risk</Badge>
      case 'medium':
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Medium Risk</Badge>
      case 'high':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">High Risk</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-600 border-gray-500/30">Unknown</Badge>
    }
  }

  const formatTime = (timeString: string) => {
    // Handle invalid or empty time strings
    if (!timeString || timeString === 'Invalid Date' || timeString === 'null' || timeString === 'undefined') {
      console.warn('Invalid time string provided:', timeString)
      return 'Time TBD'
    }
    
    const date = new Date(timeString)
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date created from time string:', timeString)
      return 'Time TBD'
    }
    
    const userTimezone = selectedTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    
    // Get market timezone based on market
    const getMarketTimezone = (market: string) => {
      const timezones: { [key: string]: string } = {
        'NASDAQ': 'America/New_York',
        'NYSE': 'America/New_York', 
        'NSE': 'Asia/Kolkata',
        'LSE': 'Europe/London',
        'TSE': 'Asia/Tokyo',
        'ASX': 'Australia/Sydney',
        'TSX': 'America/Toronto',
        'FSE': 'Europe/Berlin',
        'EPA': 'Europe/Paris'
      }
      return timezones[market] || 'UTC'
    }
    
    const marketTimezone = getMarketTimezone(market)
    
    try {
      // Format in user's timezone
      const userTime = date.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        month: 'short',
        day: 'numeric',
        timeZone: userTimezone
      })
      
      // Format in market timezone
      const marketTime = date.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        month: 'short',
        day: 'numeric',
        timeZone: marketTimezone
      })
      
      // If timezones are different, show both
      if (userTimezone !== marketTimezone) {
        return `${userTime} (${marketTime} ${marketTimezone.split('/')[1]})`
      }
      
      return userTime
    } catch (error) {
      console.error('Error formatting time:', error)
      return 'Time TBD'
    }
  }

  const renderInsightCard = (insight: MarketInsight, index: number) => (
    <Card key={`${insight.symbol}-${index}`} className="hover-lift">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-sm font-bold">
              {index + 1}
            </div>
            <div>
              <CardTitle className="text-lg">{insight.symbol}</CardTitle>
              <CardDescription className="text-sm">{insight.name}</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {getConfidenceBadge(insight.confidence)}
            {getRiskBadge(insight.riskLevel)}
            <Badge className="bg-green-500/20 text-green-600 border-green-500/30">REAL DATA</Badge>
            <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">ML MODEL</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Confidence Score */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Confidence Score</span>
          <div className="flex items-center gap-2">
            <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${insight.confidence}%` }}
              />
            </div>
            <span className="text-sm font-bold">{insight.confidence}%</span>
          </div>
        </div>

        {/* Timing Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="font-medium">Buy Time</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {formatTime(insight.buyTime)}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="font-medium">Sell Time</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {formatTime(insight.sellTime)}
            </div>
          </div>
        </div>

        {/* Price Information */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Current Price</div>
            <div className="font-bold">{formatCurrency(insight.currentPrice, getOriginalCurrency(insight.symbol))}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Target Price</div>
            <div className="font-bold text-green-600">{formatCurrency(insight.targetPrice, getOriginalCurrency(insight.symbol))}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Stop Loss</div>
            <div className="font-bold text-red-600">{formatCurrency(insight.stopLoss, getOriginalCurrency(insight.symbol))}</div>
          </div>
        </div>

        {/* Predicted Return */}
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Predicted Return</span>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-lg font-bold text-green-600">
                +{insight.predictedReturn.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* AI Reasoning */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4 text-blue-500" />
            <span>AI Reasoning</span>
          </div>
          <div className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
            {insight.reasoning}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl mx-4">
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading AI market insights for {market}...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl mx-4">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p>Failed to load market insights for {market}</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if no real data is available
  const hasNoData = insights.dayTrading.length === 0 && insights.longTerm.length === 0 && insights.swingTrading.length === 0
  
  if (hasNoData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl mx-4">
          <CardHeader>
            <CardTitle className="text-2xl">{market} Market Insights</CardTitle>
            <CardDescription>
              Real-time market data unavailable
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Real Market Data Unavailable</h3>
            <p className="text-muted-foreground mb-6">
              We cannot provide AI insights without real market data. 
              This ensures all recommendations are based on actual market conditions.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Stock data APIs are currently unavailable</p>
              <p>• All insights are based on live market data only</p>
              <p>• No mock or static data is ever used</p>
              <p>• Try refreshing to reconnect to data feeds</p>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={onClose}>Close</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                🤖 {market} Market Insights (ML Model)
                <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">LEARNING</Badge>
              </CardTitle>
              <CardDescription>
                Machine Learning model predictions based on historical data analysis • Model is continuously learning and improving • Last updated: {new Date(insights.lastUpdated).toLocaleString()}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dayTrading" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Day Trading
              </TabsTrigger>
              <TabsTrigger value="longTerm" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Long Term
              </TabsTrigger>
              <TabsTrigger value="swingTrading" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Swing Trading
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dayTrading" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">📈 Day Trading Recommendations</h3>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-600">
                  {insights.dayTrading.length} Opportunities
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                High-frequency trading opportunities for same-day buy/sell positions
              </p>
              <div className="grid gap-4">
                {insights.dayTrading.map((insight, index) => renderInsightCard(insight, index))}
              </div>
            </TabsContent>

            <TabsContent value="longTerm" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">💼 Long-Term Investment Recommendations</h3>
                <Badge variant="secondary" className="bg-green-500/20 text-green-600">
                  {insights.longTerm.length} Opportunities
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Strategic investment opportunities for multi-week holding periods
              </p>
              <div className="grid gap-4">
                {insights.longTerm.map((insight, index) => renderInsightCard(insight, index))}
              </div>
            </TabsContent>

            <TabsContent value="swingTrading" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">🎯 Swing Trading Recommendations</h3>
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-600">
                  {insights.swingTrading.length} Opportunities
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Medium-term trading opportunities for 2-5 day holding periods
              </p>
              <div className="grid gap-4">
                {insights.swingTrading.map((insight, index) => renderInsightCard(insight, index))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
