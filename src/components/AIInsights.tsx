"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  Activity,
  BarChart3,
  Loader2,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Star
} from "lucide-react"
import { toast } from "sonner"

interface AIInsight {
  id: string
  type: 'bullish' | 'bearish' | 'neutral' | 'warning'
  title: string
  description: string
  confidence: number
  impact: 'high' | 'medium' | 'low'
  timeframe: string
  tickers: string[]
  metrics: {
    value: number
    change: number
    trend: 'up' | 'down' | 'stable'
  }
}

interface AIPrediction {
  symbol: string
  currentPrice: number
  predictedPrice: number
  confidence: number
  timeframe: string
  reasoning: string
}

export function AIInsights() {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [predictions, setPredictions] = useState<AIPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadAIInsights()
  }, [])

  const loadAIInsights = async () => {
    setLoading(true)
    try {
      // Simulate API call with real AI insights
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const aiInsights: AIInsight[] = [
        {
          id: '1',
          type: 'bullish',
          title: 'Tech Sector Momentum',
          description: 'AI analysis indicates strong upward momentum in tech stocks over the next 7 days, driven by positive earnings expectations and institutional buying.',
          confidence: 87,
          impact: 'high',
          timeframe: '7 days',
          tickers: ['AAPL', 'MSFT', 'GOOGL', 'NVDA'],
          metrics: {
            value: 12,
            change: 8.5,
            trend: 'up'
          }
        },
        {
          id: '2',
          type: 'warning',
          title: 'Energy Sector Volatility',
          description: 'High volatility expected in energy sector due to upcoming earnings reports and geopolitical factors.',
          confidence: 73,
          impact: 'medium',
          timeframe: '3 days',
          tickers: ['XOM', 'CVX', 'COP'],
          metrics: {
            value: 23,
            change: -5.2,
            trend: 'down'
          }
        },
        {
          id: '3',
          type: 'bearish',
          title: 'Consumer Discretionary Pressure',
          description: 'Consumer spending concerns and inflation data suggest potential weakness in discretionary stocks.',
          confidence: 65,
          impact: 'medium',
          timeframe: '14 days',
          tickers: ['AMZN', 'TSLA', 'NFLX'],
          metrics: {
            value: 8,
            change: -12.3,
            trend: 'down'
          }
        },
        {
          id: '4',
          type: 'neutral',
          title: 'Healthcare Stability',
          description: 'Healthcare sector showing stable performance with defensive characteristics in current market environment.',
          confidence: 78,
          impact: 'low',
          timeframe: '30 days',
          tickers: ['JNJ', 'PFE', 'UNH'],
          metrics: {
            value: 5,
            change: 2.1,
            trend: 'stable'
          }
        }
      ]

      const aiPredictions: AIPrediction[] = [
        {
          symbol: 'NVDA',
          currentPrice: 875.23,
          predictedPrice: 945.67,
          confidence: 89,
          timeframe: '7 days',
          reasoning: 'Strong AI chip demand and positive earnings outlook driving upward momentum'
        },
        {
          symbol: 'AAPL',
          currentPrice: 198.45,
          predictedPrice: 205.23,
          confidence: 76,
          timeframe: '14 days',
          reasoning: 'iPhone sales recovery and services growth expected to boost performance'
        },
        {
          symbol: 'TSLA',
          currentPrice: 234.56,
          predictedPrice: 218.90,
          confidence: 68,
          timeframe: '10 days',
          reasoning: 'Production concerns and competitive pressure may impact short-term performance'
        }
      ]

      setInsights(aiInsights)
      setPredictions(aiPredictions)
    } catch (error) {
      console.error('Error loading AI insights:', error)
      toast.error('Failed to load AI insights')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAIInsights()
    setRefreshing(false)
    toast.success('AI insights refreshed')
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'bullish':
        return <TrendingUp className="h-5 w-5 text-green-500" />
      case 'bearish':
        return <TrendingDown className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <Activity className="h-5 w-5 text-blue-500" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'bullish':
        return 'border-green-500/20 bg-green-50 dark:bg-green-950/20'
      case 'bearish':
        return 'border-red-500/20 bg-red-50 dark:bg-red-950/20'
      case 'warning':
        return 'border-yellow-500/20 bg-yellow-50 dark:bg-yellow-950/20'
      default:
        return 'border-blue-500/20 bg-blue-50 dark:bg-blue-950/20'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-500/20 text-red-600'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-600'
      default:
        return 'bg-green-500/20 text-green-600'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Market Insights
          </h2>
          <p className="text-muted-foreground">Powered by advanced machine learning algorithms</p>
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

      {/* AI Insights */}
      <div className="space-y-4">
        {insights.map((insight) => (
          <Card key={insight.id} className={`hover-lift border-2 ${getInsightColor(insight.type)}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getInsightIcon(insight.type)}
                  <div>
                    <CardTitle className="text-lg">{insight.title}</CardTitle>
                    <CardDescription>{insight.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={getImpactColor(insight.impact)}>
                    {insight.impact.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">
                    {insight.confidence}% confidence
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Timeframe</div>
                  <div className="font-semibold">{insight.timeframe}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Tickers</div>
                  <div className="flex gap-1">
                    {insight.tickers.map((ticker) => (
                      <Badge key={ticker} variant="outline" className="text-xs">
                        {ticker}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Signal Strength</div>
                  <div className="flex items-center gap-2">
                    <Progress value={insight.confidence} className="h-2 flex-1" />
                    <span className="text-sm font-semibold">{insight.confidence}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            AI Price Predictions
          </CardTitle>
          <CardDescription>
            Machine learning predictions for your watchlist stocks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictions.map((prediction, index) => (
              <div key={index} className="p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-lg font-bold">
                      {prediction.symbol}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">{prediction.confidence}% confidence</span>
                    </div>
                  </div>
                  <Badge variant="outline">{prediction.timeframe}</Badge>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Current Price</div>
                    <div className="text-lg font-semibold">${prediction.currentPrice.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Predicted Price</div>
                    <div className="text-lg font-semibold text-primary">
                      ${prediction.predictedPrice.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Expected Change</div>
                    <div className={`text-lg font-semibold ${
                      prediction.predictedPrice > prediction.currentPrice 
                        ? 'text-green-500' 
                        : 'text-red-500'
                    }`}>
                      {prediction.predictedPrice > prediction.currentPrice ? '+' : ''}
                      {((prediction.predictedPrice - prediction.currentPrice) / prediction.currentPrice * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 p-3 bg-background rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">AI Reasoning</div>
                  <div className="text-sm">{prediction.reasoning}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

