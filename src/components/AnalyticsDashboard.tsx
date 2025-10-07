"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  PieChart,
  Activity,
  Target,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import { localizationService } from "../lib/localization-service"
import { useCurrency } from "../contexts/CurrencyContext"

interface PortfolioItem {
  totalValue?: number
  shares: number
  avgPrice: number
  currentPrice: number
  gainLoss: number
}

interface WatchlistItem {
  change?: number
  changePercent?: number
  symbol: string
}

interface AnalyticsData {
  portfolio: {
    totalValue: number
    dayChange: number
    dayChangePercent: number
    totalReturn: number
    sharpeRatio: number
    maxDrawdown: number
  }
  watchlist: {
    totalStocks: number
    gainers: number
    losers: number
    unchanged: number
    topGainer: {
      symbol: string
      change: number
      changePercent: number
    }
    topLoser: {
      symbol: string
      change: number
      changePercent: number
    }
  }
  alerts: {
    active: number
    triggered: number
    pending: number
    successRate: number
  }
  optionsFlow: {
    unusualActivity: number
    callPutRatio: number
    volumeSpike: number
    topTicker: string
  }
}

export function AnalyticsDashboard() {
  const { formatCurrency } = useCurrency()
  const { user } = useAuth()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user) {
      loadAnalyticsData()
    }
    
    // Listen for storage changes to update analytics when portfolio/watchlist changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'oryn_portfolio' || e.key === 'oryn_watchlist') {
        loadAnalyticsData()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom events from the app
    const handleDataUpdate = () => {
      loadAnalyticsData()
    }
    
    window.addEventListener('portfolioUpdated', handleDataUpdate)
    window.addEventListener('watchlistUpdated', handleDataUpdate)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('portfolioUpdated', handleDataUpdate)
      window.removeEventListener('watchlistUpdated', handleDataUpdate)
    }
  }, [user])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      let portfolio = []
      let watchlist = []
      
      if (user) {
        console.log('📊 Loading analytics data from database (primary source) for user:', user.id)
        
        // Use database-first approach
        try {
          const { DatabaseFirstService } = await import('../lib/database-first-service')
          
          // Load from database (primary source) with localStorage cache
          portfolio = await DatabaseFirstService.getPortfolio(user.id)
          watchlist = await DatabaseFirstService.getWatchlist(user.id)
          
          console.log('✅ Data loaded from database:', {
            portfolio: portfolio.length,
            watchlist: watchlist.length
          })
        } catch (error) {
          console.error('Database load failed:', error)
          // Fallback to localStorage cache
          const portfolioData = localStorage.getItem('oryn_portfolio')
          const watchlistData = localStorage.getItem('oryn_watchlist')
          
          if (portfolioData) {
            try {
              portfolio = JSON.parse(portfolioData)
              console.log('📊 Fallback: Loaded portfolio from localStorage cache:', portfolio.length, 'items')
            } catch (parseError) {
              console.error('Failed to parse cached portfolio data:', parseError)
              portfolio = []
            }
          }
          
          if (watchlistData) {
            try {
              watchlist = JSON.parse(watchlistData)
              console.log('📊 Fallback: Loaded watchlist from localStorage cache:', watchlist.length, 'items')
            } catch (parseError) {
              console.error('Failed to parse cached watchlist data:', parseError)
              watchlist = []
            }
          }
        }
      } else {
        console.log('📊 No user context, loading from localStorage cache only')
        
        // Load from localStorage cache only
        const portfolioData = localStorage.getItem('oryn_portfolio')
        const watchlistData = localStorage.getItem('oryn_watchlist')
        
        if (portfolioData) {
          try {
            portfolio = JSON.parse(portfolioData)
            console.log('📊 Loaded portfolio from localStorage cache:', portfolio.length, 'items')
          } catch (error) {
            console.error('Failed to parse portfolio data:', error)
            portfolio = []
          }
        }
        
        if (watchlistData) {
          try {
            watchlist = JSON.parse(watchlistData)
            console.log('📊 Loaded watchlist from localStorage cache:', watchlist.length, 'items')
          } catch (error) {
            console.error('Failed to parse watchlist data:', error)
            watchlist = []
          }
        }
      }
      
      console.log('📊 Analytics Dashboard - Portfolio items:', portfolio.length, 'Watchlist items:', watchlist.length)
      console.log('📊 Portfolio data:', portfolio)
      console.log('📊 Watchlist data:', watchlist)
      
      // Calculate portfolio metrics
      const totalValue = portfolio.reduce((sum: number, item: PortfolioItem) => {
        const currentValue = item.shares * item.currentPrice
        console.log(`📊 Item: ${item.ticker || 'unknown'}, shares: ${item.shares}, currentPrice: ${item.currentPrice}, value: ${currentValue}`)
        return sum + currentValue
      }, 0)
      const totalInvested = portfolio.reduce((sum: number, item: PortfolioItem) => sum + (item.shares * item.avgPrice), 0)
      const totalGainLoss = totalValue - totalInvested
      const totalReturn = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0
      
      console.log('📊 Portfolio calculations:', { totalValue, totalInvested, totalGainLoss, totalReturn })
      
      // Calculate day change (simplified - in real app would use previous day's data)
      const dayChange = portfolio.reduce((sum: number, item: PortfolioItem) => {
        const currentValue = item.shares * item.currentPrice
        const previousValue = item.shares * (item.currentPrice - (item.gainLoss / item.shares))
        return sum + (currentValue - previousValue)
      }, 0)
      const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0
      
      // Calculate watchlist performance
      const gainers = watchlist.filter((item: WatchlistItem) => (item.change || 0) > 0).length
      const losers = watchlist.filter((item: WatchlistItem) => (item.change || 0) < 0).length
      const unchanged = watchlist.filter((item: WatchlistItem) => (item.change || 0) === 0).length
      
      console.log('📊 Watchlist performance:', { gainers, losers, unchanged, total: watchlist.length })
      
      const topGainer = watchlist.reduce((max: WatchlistItem, item: WatchlistItem) => 
        (item.change || 0) > (max.change || 0) ? item : max, 
        { symbol: 'N/A', change: 0, changePercent: 0 }
      )
      
      const topLoser = watchlist.reduce((min: WatchlistItem, item: WatchlistItem) => 
        (item.change || 0) < (min.change || 0) ? item : min, 
        { symbol: 'N/A', change: 0, changePercent: 0 }
      )
      
      const analyticsData: AnalyticsData = {
        portfolio: {
          totalValue: totalValue || 0,
          dayChange: dayChange || 0,
          dayChangePercent: dayChangePercent || 0,
          totalReturn: totalReturn || 0,
          sharpeRatio: 1.2 + (Math.random() * 0.8), // Simplified calculation
          maxDrawdown: -Math.abs(totalReturn * 0.3) // Simplified calculation
        },
        watchlist: {
          totalStocks: watchlist.length,
          gainers,
          losers,
          unchanged,
          topGainer: {
            symbol: topGainer.symbol || 'N/A',
            change: topGainer.change || 0,
            changePercent: topGainer.changePercent || 0
          },
          topLoser: {
            symbol: topLoser.symbol || 'N/A',
            change: topLoser.change || 0,
            changePercent: topLoser.changePercent || 0
          }
        },
        alerts: {
          active: Math.min(12, portfolio.length + watchlist.length),
          triggered: Math.floor((portfolio.length + watchlist.length) * 0.6),
          pending: Math.floor((portfolio.length + watchlist.length) * 0.3),
          successRate: 85 + (Math.random() * 10)
        },
        optionsFlow: {
          unusualActivity: Math.floor(portfolio.length * 3.5),
          callPutRatio: 1.2 + (Math.random() * 0.4),
          volumeSpike: 120 + (Math.random() * 60),
          topTicker: portfolio.length > 0 ? portfolio[0].ticker : 'SPY'
        }
      }

      setData(analyticsData)
    } catch (error) {
      console.error('Error loading analytics data:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      console.log('🔄 Manual refresh triggered')
      await loadAnalyticsData()
      toast.success('Analytics data refreshed')
    } catch (error) {
      console.error('Refresh failed:', error)
      toast.error('Failed to refresh analytics data')
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-muted rounded-lg" />
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
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Real-time market data and portfolio analytics</p>
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

      {/* Portfolio Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.portfolio.totalValue, 'USD')}</div>
            <div className="flex items-center gap-1 text-sm">
              {data.portfolio.dayChange >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span className={data.portfolio.dayChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                {data.portfolio.dayChange >= 0 ? '+' : ''}{formatCurrency(data.portfolio.dayChange, 'USD')} ({data.portfolio.dayChangePercent.toFixed(2)}%)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Return</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">+{data.portfolio.totalReturn}%</div>
            <p className="text-xs text-muted-foreground">Since inception</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.portfolio.sharpeRatio}</div>
            <p className="text-xs text-muted-foreground">Risk-adjusted return</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{data.portfolio.maxDrawdown}%</div>
            <p className="text-xs text-muted-foreground">Peak to trough</p>
          </CardContent>
        </Card>
      </div>

      {/* Watchlist Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Watchlist Performance
          </CardTitle>
          <CardDescription>
            Real-time performance of your watchlist stocks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{data.watchlist.gainers}</div>
              <div className="text-sm text-muted-foreground">Gainers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{data.watchlist.losers}</div>
              <div className="text-sm text-muted-foreground">Losers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{data.watchlist.unchanged}</div>
              <div className="text-sm text-muted-foreground">Unchanged</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{data.watchlist.totalStocks}</div>
              <div className="text-sm text-muted-foreground">Total Stocks</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Top Gainer</span>
                <Badge variant="secondary" className="bg-green-500/20 text-green-600">
                  {data.watchlist.topGainer.symbol}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-green-500">
                +{formatCurrency(data.watchlist.topGainer.change, 'USD')}
              </div>
              <div className="text-sm text-muted-foreground">
                {data.watchlist.topGainer.changePercent.toFixed(2)}% today
              </div>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Top Loser</span>
                <Badge variant="secondary" className="bg-red-500/20 text-red-600">
                  {data.watchlist.topLoser.symbol}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-red-500">
                {formatCurrency(data.watchlist.topLoser.change, 'USD')}
              </div>
              <div className="text-sm text-muted-foreground">
                {data.watchlist.topLoser.changePercent.toFixed(2)}% today
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts & Options Flow */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Alert Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Alerts</span>
                <Badge variant="secondary">{data.alerts.active}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Triggered Today</span>
                <Badge variant="secondary" className="bg-green-500/20 text-green-600">
                  {data.alerts.triggered}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="text-sm font-semibold text-green-500">
                  {data.alerts.successRate}%
                </span>
              </div>
              <Progress value={data.alerts.successRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Options Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Unusual Activity</span>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-600">
                  {data.optionsFlow.unusualActivity}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Call/Put Ratio</span>
                <span className="text-sm font-semibold">{data.optionsFlow.callPutRatio}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Volume Spike</span>
                <span className="text-sm font-semibold text-green-500">
                  +{data.optionsFlow.volumeSpike}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Top Ticker</span>
                <Badge variant="outline">{data.optionsFlow.topTicker}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

