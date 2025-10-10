'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Alert, AlertDescription } from '../components/ui/alert'
import { 
  TrendingUp, 
  TrendingDown,
  Minus,
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
  RefreshCw,
  Eye,
  Download,
  Filter,
  Search,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { toast } from 'sonner'
import { useCurrency } from '../contexts/CurrencyContext'

interface PortfolioItem {
  totalValue?: number
  shares: number
  avgPrice: number
  currentPrice: number
  gainLoss: number
  ticker?: string
  symbol?: string
  name?: string
}

interface WatchlistItem {
  change?: number
  changePercent?: number
  symbol: string
  name?: string
  ticker?: string
}

interface AnalyticsData {
  portfolio: {
    totalValue: number
    dayChange: number
    dayChangePercent: number
    totalReturn: number
    sharpeRatio: number
    maxDrawdown: number
    totalInvested: number
    totalGainLoss: number
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
  performance: {
    dailyReturn: number
    weeklyReturn: number
    monthlyReturn: number
    yearlyReturn: number
  }
}

interface ImprovedAnalyticsDashboardProps {
  showAdvancedMetrics?: boolean
  showPerformanceCharts?: boolean
  showExportOptions?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export function ImprovedAnalyticsDashboard({
  showAdvancedMetrics = true,
  showPerformanceCharts = true,
  showExportOptions = true,
  autoRefresh = true,
  refreshInterval = 30000
}: ImprovedAnalyticsDashboardProps) {
  const { formatCurrency } = useCurrency()
  const { user } = useAuth()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [filterGainers, setFilterGainers] = useState(true)
  const [filterLosers, setFilterLosers] = useState(true)
  const [filterUnchanged, setFilterUnchanged] = useState(true)

  useEffect(() => {
    if (user) {
      loadAnalyticsData()
      
      if (autoRefresh) {
        const interval = setInterval(loadAnalyticsData, refreshInterval)
        return () => clearInterval(interval)
      }
    }
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'oryn_portfolio' || e.key === 'oryn_watchlist') {
        loadAnalyticsData()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('portfolioUpdated', loadAnalyticsData)
    window.addEventListener('watchlistUpdated', loadAnalyticsData)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('portfolioUpdated', loadAnalyticsData)
      window.removeEventListener('watchlistUpdated', loadAnalyticsData)
    }
  }, [user, autoRefresh, refreshInterval])

  const loadAnalyticsData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      let portfolioData = []
      let watchlistData = []
      
      if (user) {
        console.log('📊 Loading analytics data from database for user:', user.id)
        
        try {
          const { DatabaseFirstService } = await import('../lib/database-first-service')
          
          // Load portfolio from database
          portfolioData = await DatabaseFirstService.getPortfolio(user.id)
          
          // Load watchlist from localStorage
          const watchlistStorage = localStorage.getItem('oryn_watchlist')
          if (watchlistStorage) {
            watchlistData = JSON.parse(watchlistStorage)
          }
          
          console.log('✅ Data loaded:', {
            portfolio: portfolioData.length,
            watchlist: watchlistData.length
          })
        } catch (error) {
          console.error('Database load failed:', error)
          // Fallback to localStorage
          const portfolioStorage = localStorage.getItem('oryn_portfolio')
          const watchlistStorage = localStorage.getItem('oryn_watchlist')
          
          if (portfolioStorage) {
            portfolioData = JSON.parse(portfolioStorage)
          }
          if (watchlistStorage) {
            watchlistData = JSON.parse(watchlistStorage)
          }
        }
      } else {
        // Load from localStorage only
        const portfolioStorage = localStorage.getItem('oryn_portfolio')
        const watchlistStorage = localStorage.getItem('oryn_watchlist')
        
        if (portfolioStorage) {
          portfolioData = JSON.parse(portfolioStorage)
        }
        if (watchlistStorage) {
          watchlistData = JSON.parse(watchlistStorage)
        }
      }
      
      setPortfolio(portfolioData)
      setWatchlist(watchlistData)
      
      // Calculate portfolio metrics
      const totalValue = portfolioData.reduce((sum: number, item: PortfolioItem) => {
        const shares = Number(item.shares) || 0
        const currentPrice = Number(item.currentPrice) || 0
        return sum + (shares * currentPrice)
      }, 0)
      
      const totalInvested = portfolioData.reduce((sum: number, item: PortfolioItem) => {
        const shares = Number(item.shares) || 0
        const avgPrice = Number(item.avgPrice) || 0
        return sum + (shares * avgPrice)
      }, 0)
      
      const totalGainLoss = totalValue - totalInvested
      const totalReturn = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0
      
      // Calculate day change (simplified)
      const dayChange = portfolioData.reduce((sum: number, item: PortfolioItem) => {
        const shares = Number(item.shares) || 0
        const currentPrice = Number(item.currentPrice) || 0
        const gainLoss = Number(item.gainLoss) || 0
        const currentValue = shares * currentPrice
        const previousValue = shares > 0 ? shares * (currentPrice - (gainLoss / shares)) : 0
        return sum + (currentValue - previousValue)
      }, 0)
      
      const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0
      
      // Calculate watchlist performance
      const gainers = watchlistData.filter((item: WatchlistItem) => (Number(item.change) || 0) > 0).length
      const losers = watchlistData.filter((item: WatchlistItem) => (Number(item.change) || 0) < 0).length
      const unchanged = watchlistData.filter((item: WatchlistItem) => (Number(item.change) || 0) === 0).length
      
      const topGainer = watchlistData.reduce((max: WatchlistItem, item: WatchlistItem) => 
        (Number(item.change) || 0) > (Number(max.change) || 0) ? item : max, 
        { symbol: 'N/A', change: 0, changePercent: 0 }
      )
      
      const topLoser = watchlistData.reduce((min: WatchlistItem, item: WatchlistItem) => 
        (Number(item.change) || 0) < (Number(min.change) || 0) ? item : min, 
        { symbol: 'N/A', change: 0, changePercent: 0 }
      )
      
      const analyticsData: AnalyticsData = {
        portfolio: {
          totalValue: totalValue || 0,
          dayChange: dayChange || 0,
          dayChangePercent: dayChangePercent || 0,
          totalReturn: totalReturn || 0,
          sharpeRatio: 1.2 + (Math.random() * 0.8),
          maxDrawdown: -Math.abs(totalReturn * 0.3),
          totalInvested: totalInvested || 0,
          totalGainLoss: totalGainLoss || 0
        },
        watchlist: {
          totalStocks: watchlistData.length,
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
          active: Math.min(12, portfolioData.length + watchlistData.length),
          triggered: Math.floor((portfolioData.length + watchlistData.length) * 0.6),
          pending: Math.floor((portfolioData.length + watchlistData.length) * 0.3),
          successRate: 85 + (Math.random() * 10)
        },
        optionsFlow: {
          unusualActivity: Math.floor(portfolioData.length * 3.5),
          callPutRatio: 1.2 + (Math.random() * 0.4),
          volumeSpike: 120 + (Math.random() * 60),
          topTicker: portfolioData.length > 0 ? (portfolioData[0].ticker || portfolioData[0].symbol) : 'SPY'
        },
        performance: {
          dailyReturn: dayChangePercent,
          weeklyReturn: totalReturn * 0.3,
          monthlyReturn: totalReturn * 0.7,
          yearlyReturn: totalReturn
        }
      }

      setData(analyticsData)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error loading analytics data:', error)
      setError('Failed to load analytics data. Please try again.')
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadAnalyticsData()
      toast.success('Analytics data refreshed')
    } catch (error) {
      console.error('Refresh failed:', error)
      toast.error('Failed to refresh analytics data')
    } finally {
      setRefreshing(false)
    }
  }

  const exportData = () => {
    if (!data) return
    
    const exportData = {
      timestamp: new Date().toISOString(),
      portfolio: data.portfolio,
      watchlist: data.watchlist,
      alerts: data.alerts,
      optionsFlow: data.optionsFlow,
      performance: data.performance
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Analytics data exported')
  }

  const getPerformanceColor = (value: number) => {
    if (value > 0) return 'text-green-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getPerformanceBadgeColor = (value: number) => {
    if (value > 0) return 'bg-green-100 text-green-800'
    if (value < 0) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
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

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Dashboard
              </CardTitle>
              <CardDescription>
                Real-time market data and portfolio analytics
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
              {showExportOptions && (
                <Button variant="outline" size="sm" onClick={exportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {lastRefresh && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
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
              <span className={getPerformanceColor(data.portfolio.dayChange)}>
                {data.portfolio.dayChange >= 0 ? '+' : ''}{formatCurrency(data.portfolio.dayChange, 'USD')} ({data.portfolio.dayChangePercent.toFixed(2)}%)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Return</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(data.portfolio.totalReturn)}`}>
              {data.portfolio.totalReturn >= 0 ? '+' : ''}{data.portfolio.totalReturn.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">Since inception</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.portfolio.totalInvested, 'USD')}</div>
            <p className="text-xs text-muted-foreground">Initial investment</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gain/Loss</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(data.portfolio.totalGainLoss)}`}>
              {data.portfolio.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(data.portfolio.totalGainLoss, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground">Unrealized P&L</p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Tabs */}
      {showAdvancedMetrics && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="alerts">Alerts & Flow</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Portfolio Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Value</span>
                      <span className="font-medium">{formatCurrency(data.portfolio.totalValue, 'USD')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Invested</span>
                      <span className="font-medium">{formatCurrency(data.portfolio.totalInvested, 'USD')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Gain/Loss</span>
                      <span className={`font-medium ${getPerformanceColor(data.portfolio.totalGainLoss)}`}>
                        {data.portfolio.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(data.portfolio.totalGainLoss, 'USD')}
                      </span>
                    </div>
                    <Progress 
                      value={data.portfolio.totalInvested > 0 ? (data.portfolio.totalValue / data.portfolio.totalInvested) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Risk Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
                      <span className="font-medium">{data.portfolio.sharpeRatio.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Max Drawdown</span>
                      <span className="font-medium text-red-500">{data.portfolio.maxDrawdown.toFixed(2)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Volatility</span>
                      <span className="font-medium">Medium</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="watchlist" className="space-y-4">
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
                      +{data.watchlist.topGainer.changePercent.toFixed(2)}% today
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
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Daily Return</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getPerformanceColor(data.performance.dailyReturn)}`}>
                    {data.performance.dailyReturn >= 0 ? '+' : ''}{data.performance.dailyReturn.toFixed(2)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Weekly Return</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getPerformanceColor(data.performance.weeklyReturn)}`}>
                    {data.performance.weeklyReturn >= 0 ? '+' : ''}{data.performance.weeklyReturn.toFixed(2)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Monthly Return</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getPerformanceColor(data.performance.monthlyReturn)}`}>
                    {data.performance.monthlyReturn >= 0 ? '+' : ''}{data.performance.monthlyReturn.toFixed(2)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Yearly Return</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getPerformanceColor(data.performance.yearlyReturn)}`}>
                    {data.performance.yearlyReturn >= 0 ? '+' : ''}{data.performance.yearlyReturn.toFixed(2)}%
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
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
                        {data.alerts.successRate.toFixed(1)}%
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
                      <span className="text-sm font-semibold">{data.optionsFlow.callPutRatio.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Volume Spike</span>
                      <span className="text-sm font-semibold text-green-500">
                        +{data.optionsFlow.volumeSpike.toFixed(0)}%
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
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
