'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, BarChart3, RefreshCw } from 'lucide-react'

interface StabilizedPrediction {
  id: string
  symbol: string
  name: string
  currentPrice: number
  predictedPrice: number
  confidence: number
  direction: 'bullish' | 'bearish' | 'neutral'
  timeframe: string
  technicalScore: number
  fundamentalScore: number
  sentimentScore: number
  riskLevel: 'low' | 'medium' | 'high'
  reasoning: string[]
  factors: {
    technical: string[]
    fundamental: string[]
    sentiment: string[]
  }
  lastUpdated: string
  accuracy?: number
  historicalAccuracy?: number
}

interface PredictionMetrics {
  totalPredictions: number
  accuratePredictions: number
  averageAccuracy: number
  confidenceDistribution: {
    high: number
    medium: number
    low: number
  }
  timeframeAccuracy: Record<string, number>
  symbolAccuracy: Record<string, number>
}

interface StabilizedAIInsightsProps {
  symbols?: string[]
  autoRefresh?: boolean
  showMetrics?: boolean
}

export function StabilizedAIInsights({ 
  symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA'], 
  autoRefresh = true,
  showMetrics = true 
}: StabilizedAIInsightsProps) {
  const [predictions, setPredictions] = useState<StabilizedPrediction[]>([])
  const [metrics, setMetrics] = useState<PredictionMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const loadPredictions = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ml/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      if (data.success) {
        setPredictions(data.predictions)
        setLastRefresh(new Date())
      } else {
        throw new Error(data.error || 'Failed to load predictions')
      }
    } catch (error) {
      console.error('Error loading predictions:', error)
      setError('Failed to load AI predictions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/ml/predictions?action=metrics')
      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics)
      }
    } catch (error) {
      console.error('Error loading metrics:', error)
    }
  }

  const refreshData = async () => {
    await loadPredictions()
    if (showMetrics) {
      await loadMetrics()
    }
  }

  const clearCache = async () => {
    try {
      await fetch('/api/ml/predictions?action=clear-cache')
      await loadPredictions()
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  useEffect(() => {
    loadPredictions()
    if (showMetrics) {
      loadMetrics()
    }
    
    if (autoRefresh) {
      const interval = setInterval(loadPredictions, 5 * 60 * 1000) // 5 minutes
      return () => clearInterval(interval)
    }
  }, [symbols, autoRefresh, showMetrics])

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'bullish':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'bearish':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case 'bullish':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'bearish':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'high':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'text-green-600'
    if (confidence >= 0.4) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading && predictions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading AI predictions...</span>
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
                <Brain className="h-5 w-5" />
                Stabilized AI Predictions
              </CardTitle>
              <CardDescription>
                ML-powered predictions with comprehensive analysis and confidence scoring
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

      {/* Metrics */}
      {metrics && showMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Prediction Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.totalPredictions}</div>
                <p className="text-sm text-muted-foreground">Total Predictions</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.accuratePredictions}</div>
                <p className="text-sm text-muted-foreground">Accurate</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{formatPercentage(metrics.averageAccuracy)}</div>
                <p className="text-sm text-muted-foreground">Avg Accuracy</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{metrics.confidenceDistribution.high}</div>
                <p className="text-sm text-muted-foreground">High Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Predictions */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Predictions</TabsTrigger>
          <TabsTrigger value="bullish">Bullish</TabsTrigger>
          <TabsTrigger value="bearish">Bearish</TabsTrigger>
          <TabsTrigger value="high-confidence">High Confidence</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions.map((prediction) => (
              <Card key={prediction.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{prediction.symbol}</h3>
                    <p className="text-sm text-muted-foreground">{prediction.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getDirectionIcon(prediction.direction)}
                    <Badge className={getDirectionColor(prediction.direction)}>
                      {prediction.direction}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current Price</span>
                    <span className="font-medium">{formatPrice(prediction.currentPrice)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Predicted Price</span>
                    <span className="font-medium">{formatPrice(prediction.predictedPrice)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Confidence</span>
                    <span className={`font-medium ${getConfidenceColor(prediction.confidence)}`}>
                      {formatPercentage(prediction.confidence)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Risk Level</span>
                    <Badge className={getRiskColor(prediction.riskLevel)}>
                      {prediction.riskLevel}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Technical</span>
                      <span>{formatPercentage(prediction.technicalScore)}</span>
                    </div>
                    <Progress value={prediction.technicalScore * 100} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Fundamental</span>
                      <span>{formatPercentage(prediction.fundamentalScore)}</span>
                    </div>
                    <Progress value={prediction.fundamentalScore * 100} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Sentiment</span>
                      <span>{formatPercentage(prediction.sentimentScore)}</span>
                    </div>
                    <Progress value={prediction.sentimentScore * 100} className="h-2" />
                  </div>

                  {prediction.reasoning.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Key Factors:</p>
                      <ul className="text-xs space-y-1">
                        {prediction.reasoning.slice(0, 2).map((reason, index) => (
                          <li key={index} className="text-muted-foreground">• {reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {prediction.accuracy && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Historical Accuracy</span>
                      <span className="font-medium">{formatPercentage(prediction.accuracy)}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bullish" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions
              .filter(p => p.direction === 'bullish')
              .map((prediction) => (
                <Card key={prediction.id} className="p-4 border-green-200 bg-green-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{prediction.symbol}</h3>
                      <p className="text-sm text-muted-foreground">{prediction.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <Badge className="bg-green-100 text-green-800">Bullish</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Current: {formatPrice(prediction.currentPrice)}</span>
                      <span className="text-sm font-medium">Target: {formatPrice(prediction.predictedPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Confidence</span>
                      <span className={`text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
                        {formatPercentage(prediction.confidence)}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="bearish" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions
              .filter(p => p.direction === 'bearish')
              .map((prediction) => (
                <Card key={prediction.id} className="p-4 border-red-200 bg-red-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{prediction.symbol}</h3>
                      <p className="text-sm text-muted-foreground">{prediction.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <Badge className="bg-red-100 text-red-800">Bearish</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Current: {formatPrice(prediction.currentPrice)}</span>
                      <span className="text-sm font-medium">Target: {formatPrice(prediction.predictedPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Confidence</span>
                      <span className={`text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
                        {formatPercentage(prediction.confidence)}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="high-confidence" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions
              .filter(p => p.confidence >= 0.7)
              .sort((a, b) => b.confidence - a.confidence)
              .map((prediction) => (
                <Card key={prediction.id} className="p-4 border-blue-200 bg-blue-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{prediction.symbol}</h3>
                      <p className="text-sm text-muted-foreground">{prediction.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <Badge className="bg-blue-100 text-blue-800">High Confidence</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Current: {formatPrice(prediction.currentPrice)}</span>
                      <span className="text-sm font-medium">Target: {formatPrice(prediction.predictedPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Confidence</span>
                      <span className="text-sm font-medium text-blue-600">
                        {formatPercentage(prediction.confidence)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Risk</span>
                      <Badge className={getRiskColor(prediction.riskLevel)}>
                        {prediction.riskLevel}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
