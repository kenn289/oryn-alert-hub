'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  LineChart, 
  RefreshCw, 
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react'

interface PerformanceChartData {
  date: string
  value: number
  gainLoss: number
  gainLossPercent: number
  dayChange: number
  dayChangePercent: number
}

interface PerformanceMetrics {
  totalReturn: number
  annualizedReturn: number
  volatility: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  averageWin: number
  averageLoss: number
  profitFactor: number
  sortinoRatio: number
  calmarRatio: number
}

interface TopPerformer {
  symbol: string
  name: string
  gain_loss: number
  gain_loss_percent: number
  current_value: number
}

interface PLVisualizationProps {
  userId: string
  autoRefresh?: boolean
  showAdvancedMetrics?: boolean
}

export function PLVisualization({ 
  userId, 
  autoRefresh = true,
  showAdvancedMetrics = true 
}: PLVisualizationProps) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [chartData, setChartData] = useState<PerformanceChartData[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const loadAnalytics = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/portfolio/performance?userId=${userId}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      if (data.analytics) {
        setAnalytics(data.analytics)
        setChartData(data.analytics.chartData || [])
        setMetrics(data.analytics.performanceMetrics)
        setTopPerformers(data.analytics.topPerformers || [])
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      setError('Failed to load portfolio analytics. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadChartData = async () => {
    try {
      const response = await fetch(`/api/portfolio/performance?userId=${userId}&action=chart-data`)
      if (response.ok) {
        const data = await response.json()
        setChartData(data.chartData || [])
      }
    } catch (error) {
      console.error('Error loading chart data:', error)
    }
  }

  const loadMetrics = async () => {
    try {
      const response = await fetch(`/api/portfolio/performance?userId=${userId}&action=metrics`)
      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics)
      }
    } catch (error) {
      console.error('Error loading metrics:', error)
    }
  }

  const loadTopPerformers = async () => {
    try {
      const response = await fetch(`/api/portfolio/performance?userId=${userId}&action=top-performers`)
      if (response.ok) {
        const data = await response.json()
        setTopPerformers(data.topPerformers || [])
      }
    } catch (error) {
      console.error('Error loading top performers:', error)
    }
  }

  const refreshData = async () => {
    await Promise.all([
      loadAnalytics(),
      loadChartData(),
      loadMetrics(),
      loadTopPerformers()
    ])
  }

  const clearCache = async () => {
    try {
      await fetch('/api/portfolio/performance', { method: 'DELETE', body: JSON.stringify({ action: 'clear-cache' }) })
      await refreshData()
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  useEffect(() => {
    if (userId) {
      refreshData()
      
      if (autoRefresh) {
        const interval = setInterval(refreshData, 5 * 60 * 1000) // 5 minutes
        return () => clearInterval(interval)
      }
    }
  }, [userId, autoRefresh])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
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

  const getRiskLevel = (sharpeRatio: number) => {
    if (sharpeRatio > 2) return { level: 'Low', color: 'bg-green-100 text-green-800' }
    if (sharpeRatio > 1) return { level: 'Medium', color: 'bg-yellow-100 text-yellow-800' }
    return { level: 'High', color: 'bg-red-100 text-red-800' }
  }

  if (loading && !analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading portfolio performance data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Portfolio Performance & P/L Visualization
              </CardTitle>
              <CardDescription>
                Comprehensive performance tracking and profit/loss analysis
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

          {lastRefresh && (
            <p className="text-sm text-muted-foreground text-center">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Performance Summary */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(analytics.totalValue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total P/L</p>
                  <p className={`text-2xl font-bold ${getPerformanceColor(analytics.totalGainLoss)}`}>
                    {formatCurrency(analytics.totalGainLoss)}
                  </p>
                </div>
                {analytics.totalGainLoss >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                )}
              </div>
              <div className="mt-2">
                <Badge className={getPerformanceBadgeColor(analytics.totalGainLossPercent)}>
                  {formatPercentage(analytics.totalGainLossPercent)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Day Change</p>
                  <p className={`text-2xl font-bold ${getPerformanceColor(analytics.dayChange)}`}>
                    {formatCurrency(analytics.dayChange)}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="mt-2">
                <Badge className={getPerformanceBadgeColor(analytics.dayChangePercent)}>
                  {formatPercentage(analytics.dayChangePercent)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Invested</p>
                  <p className="text-2xl font-bold">{formatCurrency(analytics.totalInvested)}</p>
                </div>
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Advanced Metrics */}
      {metrics && showAdvancedMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Advanced Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formatPercentage(metrics.totalReturn * 100)}</div>
                <p className="text-sm text-muted-foreground">Total Return</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{formatPercentage(metrics.annualizedReturn * 100)}</div>
                <p className="text-sm text-muted-foreground">Annualized Return</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{formatPercentage(metrics.volatility * 100)}</div>
                <p className="text-sm text-muted-foreground">Volatility</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.sharpeRatio.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{formatPercentage(metrics.maxDrawdown * 100)}</div>
                <p className="text-sm text-muted-foreground">Max Drawdown</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{formatPercentage(metrics.winRate * 100)}</div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-600">{metrics.profitFactor.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground">Profit Factor</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">{metrics.calmarRatio.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground">Calmar Ratio</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Risk Level</span>
                <Badge className={getRiskLevel(metrics.sharpeRatio).color}>
                  {getRiskLevel(metrics.sharpeRatio).level}
                </Badge>
              </div>
              <Progress value={(metrics.sharpeRatio / 3) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((performer, index) => (
                <div key={performer.symbol} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-green-800">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{performer.symbol}</p>
                      <p className="text-sm text-muted-foreground">{performer.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">{formatCurrency(performer.gain_loss)}</p>
                    <p className="text-sm text-green-600">{formatPercentage(performer.gain_loss_percent)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Performance Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Performance chart visualization</p>
                <p className="text-sm text-gray-400">Chart data available: {chartData.length} data points</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sector Allocation */}
      {analytics?.sectorAllocation && analytics.sectorAllocation.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Sector Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.sectorAllocation.map((sector: any, index: number) => (
                <div key={sector.sector} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="font-medium">{sector.sector}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(sector.value)}</p>
                    <p className="text-sm text-muted-foreground">{formatPercentage(sector.percentage)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
