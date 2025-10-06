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
  Star,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp as UpTrend,
  TrendingDown as DownTrend,
  Eye,
  Brain as AIBrain
} from "lucide-react"
import { toast } from "sonner"
import { multiApiStockService } from "@/lib/multi-api-stock-service"
import { localizationService } from "@/lib/localization-service"
import { useCurrency } from "@/contexts/CurrencyContext"
import { useAuth } from "@/contexts/AuthContext"
import { RealAIAnalysisService, RealAIPrediction } from "@/lib/real-ai-analysis-service"
import { DatabaseWatchlistService } from "@/lib/database-watchlist-service"

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

// Align with RealAIPrediction for richer details
type AIPrediction = RealAIPrediction

export function AIInsights() {
  const { formatCurrency } = useCurrency()
  const { user } = useAuth()
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [predictions, setPredictions] = useState<AIPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentPredictionIndex, setCurrentPredictionIndex] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)

  useEffect(() => {
    loadAIInsights()
  }, [])

  // Auto-play carousel
  useEffect(() => {
    if (!autoPlay || predictions.length <= 1) return

    const interval = setInterval(() => {
      setCurrentPredictionIndex((prev) => (prev + 1) % predictions.length)
    }, 8000) // Change every 8 seconds

    return () => clearInterval(interval)
  }, [autoPlay, predictions.length])

  const nextPrediction = () => {
    setCurrentPredictionIndex((prev) => (prev + 1) % predictions.length)
  }

  const prevPrediction = () => {
    setCurrentPredictionIndex((prev) => (prev - 1 + predictions.length) % predictions.length)
  }

  const loadAIInsights = async () => {
    setLoading(true)
    try {
      console.log('🤖 Loading real AI insights with transparent market data...')
      
      // Get user's watchlist from database first, then fallback to localStorage
      let watchlist = []
      let symbols = ['NVDA', 'AAPL', 'TSLA'] // Default fallback
      
      try {
        // Try to get watchlist from database
        if (user?.id) {
          watchlist = await DatabaseWatchlistService.getWatchlist(user.id)
          console.log('📊 Got watchlist from database:', watchlist.length, 'items')
        }
      } catch (dbError) {
        console.warn('Database watchlist failed, trying localStorage:', dbError)
      }
      
      // Fallback to localStorage if database failed or empty
      if (watchlist.length === 0) {
        watchlist = JSON.parse(localStorage.getItem('oryn_watchlist') || '[]')
        console.log('📊 Got watchlist from localStorage:', watchlist.length, 'items')
      }
      
      // Extract symbols from watchlist
      if (watchlist.length > 0) {
        symbols = watchlist.map((item: any) => item.ticker)
      }
      
      console.log(`📊 Analyzing ${symbols.length} stocks: ${symbols.join(', ')}`)
      
      // Use real AI analysis service
      const aiService = RealAIAnalysisService.getInstance()
      const realPredictions = await aiService.generateRealPredictions(symbols)
      
      if (realPredictions.length === 0) {
        throw new Error('No real market data available for analysis')
      }
      
      // Already in correct shape; just forward through
      const aiPredictions: AIPrediction[] = realPredictions as AIPrediction[]

      // Generate insights based on real predictions
      const aiInsights: AIInsight[] = await generateInsightsFromPredictions(realPredictions)

      setInsights(aiInsights)
      setPredictions(aiPredictions)
      
      console.log(`✅ Generated ${aiInsights.length} insights and ${aiPredictions.length} real predictions from transparent market data`)
      toast.success(`AI analysis complete: ${aiPredictions.length} stocks analyzed with real market data`)
    } catch (error) {
      console.error('Error loading real AI insights:', error)
      toast.error(`Failed to load AI insights: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
            Real AI Market Analysis
          </h2>
          <p className="text-muted-foreground">Transparent AI analysis using real market data</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle className="h-3 w-3" />
              Real market data
            </div>
            <div className="text-xs text-muted-foreground">
              • Live prices • Real analysis • Transparent predictions
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

      {/* AI Insights */}
      <div className="space-y-4">
        {/* ML Model Explanation */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AIBrain className="h-5 w-5 text-primary" />
              How our ML predictions work
            </CardTitle>
            <CardDescription>
              Uses recent historical prices (up to 6 months) and technical indicators to forecast short-term moves with a confidence score.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-semibold mb-1">Inputs</div>
                <div className="text-muted-foreground">• OHLCV history from Yahoo</div>
                <div className="text-muted-foreground">• Live price and volume</div>
                <div className="text-muted-foreground">• Sector/market context</div>
              </div>
              <div>
                <div className="font-semibold mb-1">Signals</div>
                <div className="text-muted-foreground">• SMA 20/50/200, RSI-14</div>
                <div className="text-muted-foreground">• MACD (12-26-9)</div>
                <div className="text-muted-foreground">• Support/Resistance</div>
              </div>
              <div>
                <div className="font-semibold mb-1">Prediction & Confidence</div>
                <div className="text-muted-foreground">• Momentum-weighted forecast</div>
                <div className="text-muted-foreground">• Confidence from signal agreement, liquidity, volatility</div>
                <div className="text-muted-foreground">• Not financial advice</div>
              </div>
            </div>
          </CardContent>
        </Card>

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
          {predictions.length > 0 ? (
            <div className="space-y-6">
              {/* Carousel Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevPrediction}
                    disabled={predictions.length <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentPredictionIndex + 1} of {predictions.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextPrediction}
                    disabled={predictions.length <= 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAutoPlay(!autoPlay)}
                  >
                    {autoPlay ? <Eye className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                    {autoPlay ? 'Pause' : 'Play'}
                  </Button>
                </div>
              </div>

              {/* Current Prediction Display */}
              {predictions[currentPredictionIndex] && (
                <div className="space-y-6">
                  {(() => {
                    const prediction = predictions[currentPredictionIndex]
                    return (
                      <>
                        {/* Main Prediction Card */}
                        <div className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border">
                          <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                              <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
                      {prediction.symbol}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm font-medium">{prediction.confidence.toFixed(1)}% confidence</span>
                    </div>
                  </div>
                            <div className="flex items-center gap-2">
                  <Badge variant="outline">{prediction.timeframe}</Badge>
                              <Badge variant={prediction.detailedAnalysis.marketSentiment === 'bullish' ? 'default' : 'destructive'}>
                                {prediction.detailedAnalysis.marketSentiment.toUpperCase()}
                              </Badge>
                            </div>
                </div>
                
                          <div className="grid md:grid-cols-3 gap-6 mb-6">
                            <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Current Price</div>
                              <div className="text-2xl font-bold">{formatCurrency(prediction.currentPrice, (prediction as any).currency || 'USD')}</div>
                  </div>
                            <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Predicted Price</div>
                              <div className="text-2xl font-bold text-primary">
                                {formatCurrency(prediction.predictedPrice, (prediction as any).currency || 'USD')}
                    </div>
                  </div>
                            <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Expected Change</div>
                              <div className={`text-2xl font-bold ${
                      prediction.predictedPrice > prediction.currentPrice 
                        ? 'text-green-500' 
                        : 'text-red-500'
                    }`}>
                      {prediction.predictedPrice > prediction.currentPrice ? '+' : ''}
                      {((prediction.predictedPrice - prediction.currentPrice) / prediction.currentPrice * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
                
                          {/* Buy/Sell Recommendation */}
                          <div className="p-4 bg-background rounded-lg border mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="h-4 w-4 text-primary" />
                              <span className="font-semibold">AI Recommendation</span>
                              <Badge variant={prediction.detailedAnalysis.buySellRecommendation.action === 'buy' ? 'default' : 'destructive'}>
                                {prediction.detailedAnalysis.buySellRecommendation.action.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-muted-foreground">Optimal Date & Time</div>
                                <div className="font-medium">
                                  <Calendar className="h-3 w-3 inline mr-1" />
                                  {prediction.detailedAnalysis.buySellRecommendation.optimalDate}
                                </div>
                                <div className="font-medium">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {prediction.detailedAnalysis.buySellRecommendation.optimalTime}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Target & Stop Loss</div>
                                <div className="font-medium">
                                  <DollarSign className="h-3 w-3 inline mr-1" />
                                  Target: {formatCurrency(prediction.detailedAnalysis.buySellRecommendation.targetPrice, (prediction as any).currency || 'USD')}
                                </div>
                                <div className="font-medium">
                                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                                  Stop Loss: {formatCurrency(prediction.detailedAnalysis.buySellRecommendation.stopLoss, (prediction as any).currency || 'USD')}
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                              {prediction.detailedAnalysis.buySellRecommendation.reasoning}
                            </div>
                          </div>

                          {/* Detailed Analysis */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div>
                                <div className="text-sm font-semibold mb-2 flex items-center gap-1">
                                  <TrendingUp className="h-4 w-4" />
                                  Technical Indicators
                                </div>
                                <div className="space-y-1">
                                  <div className="text-sm text-muted-foreground">• RSI: {prediction.detailedAnalysis.technicalIndicators.rsi.toFixed(1)}</div>
                                  <div className="text-sm text-muted-foreground">• MACD: {prediction.detailedAnalysis.technicalIndicators.macd.toFixed(2)}</div>
                                  <div className="text-sm text-muted-foreground">• SMA 20: {prediction.detailedAnalysis.technicalIndicators.sma20.toFixed(2)}</div>
                                  <div className="text-sm text-muted-foreground">• SMA 50: {prediction.detailedAnalysis.technicalIndicators.sma50.toFixed(2)}</div>
                                  <div className="text-sm text-muted-foreground">• SMA 200: {prediction.detailedAnalysis.technicalIndicators.sma200.toFixed(2)}</div>
                                  <div className="text-sm text-muted-foreground">• Support: {prediction.detailedAnalysis.technicalIndicators.support.toFixed(2)}</div>
                                  <div className="text-sm text-muted-foreground">• Resistance: {prediction.detailedAnalysis.technicalIndicators.resistance.toFixed(2)}</div>
                                  <div className="text-sm text-muted-foreground">• Trend: {prediction.detailedAnalysis.technicalIndicators.trend.toUpperCase()}</div>
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-semibold mb-2 flex items-center gap-1">
                                  <CheckCircle className="h-4 w-4" />
                                  Fundamental Factors
                                </div>
                                <div className="space-y-1">
                                  <div className="text-sm text-muted-foreground">• P/E: {prediction.detailedAnalysis.fundamentalFactors.pe.toFixed(1)}</div>
                                  <div className="text-sm text-muted-foreground">• PEG: {prediction.detailedAnalysis.fundamentalFactors.peg.toFixed(2)}</div>
                                  <div className="text-sm text-muted-foreground">• Debt/Equity: {prediction.detailedAnalysis.fundamentalFactors.debtToEquity.toFixed(2)}</div>
                                  <div className="text-sm text-muted-foreground">• ROE: {(prediction.detailedAnalysis.fundamentalFactors.roe * 100).toFixed(1)}%</div>
                                  <div className="text-sm text-muted-foreground">• Revenue Growth: {(prediction.detailedAnalysis.fundamentalFactors.revenueGrowth * 100).toFixed(1)}%</div>
                                  <div className="text-sm text-muted-foreground">• Earnings Growth: {(prediction.detailedAnalysis.fundamentalFactors.earningsGrowth * 100).toFixed(1)}%</div>
                                  <div className="text-sm text-muted-foreground">• Analyst Rating: {prediction.detailedAnalysis.fundamentalFactors.analystRating.toUpperCase()}</div>
                                  <div className="text-sm text-muted-foreground">• Price Target: {formatCurrency(prediction.detailedAnalysis.fundamentalFactors.priceTarget, (prediction as any).currency || 'USD')}</div>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <div className="text-sm font-semibold mb-2 flex items-center gap-1">
                                  <AlertTriangle className="h-4 w-4" />
                                  Risk Factors
                                </div>
                                <div className="space-y-1">
                                  {prediction.detailedAnalysis.riskFactors.map((risk, idx) => (
                                    <div key={idx} className="text-sm text-muted-foreground">• {risk}</div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-semibold mb-2 flex items-center gap-1">
                                  <AIBrain className="h-4 w-4" />
                                  AI Learning
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <div>Model: {prediction.detailedAnalysis.aiLearning.modelVersion}</div>
                                  <div>Accuracy: {prediction.detailedAnalysis.aiLearning.accuracy}%</div>
                                  <div>Training: {prediction.detailedAnalysis.aiLearning.trainingData}</div>
                                  <div>Signals: {prediction.detailedAnalysis.aiLearning.dataPoints.toLocaleString()}</div>
                                  <div className="mt-1">Confidence factors:</div>
                                  <div className="mt-1 space-y-0.5">
                                    {prediction.detailedAnalysis.aiLearning.confidenceFactors.map((f, i) => (
                                      <div key={i} className="text-sm text-muted-foreground">• {f}</div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Market Context and Risk/Reward */}
                          <div className="grid md:grid-cols-3 gap-4 mt-4">
                            <div className="p-3 border rounded-lg">
                              <div className="text-sm text-muted-foreground mb-1">Market Context</div>
                              <div className="text-sm">Sector: {prediction.detailedAnalysis.marketTrends.sector}</div>
                              <div className="text-sm">Industry: {prediction.detailedAnalysis.marketTrends.industry}</div>
                              <div className="text-sm">Market Cap: {prediction.detailedAnalysis.marketTrends.marketCap}</div>
                              <div className="text-sm">Volume: {prediction.detailedAnalysis.marketTrends.volume}</div>
                            </div>
                            <div className="p-3 border rounded-lg">
                              <div className="text-sm text-muted-foreground mb-1">Expected Move</div>
                              <div className={`text-lg font-semibold ${prediction.predictedPrice >= prediction.currentPrice ? 'text-green-600' : 'text-red-600'}`}>
                                {((prediction.predictedPrice - prediction.currentPrice) / prediction.currentPrice * 100).toFixed(2)}%
                              </div>
                              <div className="text-sm text-muted-foreground">Δ {formatCurrency(Math.abs(prediction.predictedPrice - prediction.currentPrice), (prediction as any).currency || 'USD')}</div>
                            </div>
                            <div className="p-3 border rounded-lg">
                              <div className="text-sm text-muted-foreground mb-1">Risk/Reward</div>
                              {(() => {
                                const risk = prediction.detailedAnalysis.buySellRecommendation.stopLoss
                                const reward = prediction.detailedAnalysis.buySellRecommendation.targetPrice
                                const rr = Math.max(0.1, Math.abs(reward - prediction.currentPrice) / Math.max(0.01, Math.abs(prediction.currentPrice - risk)))
                                return <div className="text-lg font-semibold">{rr.toFixed(2)} : 1</div>
                              })()}
                              <div className="text-xs text-muted-foreground mt-1">Based on target vs. stop loss</div>
                            </div>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}
              </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No predictions available
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Fetch real-time data for AI predictions
async function fetchRealTimeData() {
  const symbols = ['NVDA', 'AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'META', 'XOM', 'CVX', 'COP', 'JNJ', 'PFE', 'UNH']
  const realTimeData = []
  const errors = []
  
  for (const symbol of symbols) {
    try {
      console.log(`📊 Fetching real-time data for ${symbol}...`)
      const response = await fetch(`/api/stock/multi/${symbol}`)
      
      if (!response.ok) {
        if (response.status === 503) {
          const errorData = await response.json()
          errors.push(`${symbol}: ${errorData.message || 'Service unavailable'}`)
          console.warn(`❌ Service unavailable for ${symbol}:`, errorData.message)
        } else {
          errors.push(`${symbol}: HTTP ${response.status}`)
          console.warn(`❌ HTTP error for ${symbol}: ${response.status}`)
        }
        continue
      }
      
      const stockData = await response.json()
      
      if (stockData && stockData.price && !stockData.error) {
        realTimeData.push({
          symbol,
          price: stockData.price,
          change: stockData.change,
          changePercent: stockData.changePercent,
          volume: stockData.volume,
          source: stockData.source,
          cacheInfo: stockData._cacheInfo
        })
        console.log(`✅ Got real-time data for ${symbol}: $${stockData.price} (${stockData.changePercent.toFixed(2)}%) from ${stockData.source}`)
      } else {
        errors.push(`${symbol}: Invalid data received`)
        console.warn(`❌ Invalid data for ${symbol}:`, stockData)
      }
    } catch (error) {
      errors.push(`${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.warn(`❌ Failed to fetch data for ${symbol}:`, error)
    }
  }
  
  if (errors.length > 0) {
    console.warn('⚠️ Some data fetch errors:', errors)
  }
  
  return { realTimeData, errors }
}

// Generate insights from real AI predictions
async function generateInsightsFromPredictions(predictions: RealAIPrediction[]): Promise<AIInsight[]> {
  const insights: AIInsight[] = []
  
  // Market sentiment insight
  const bullishCount = predictions.filter(p => p.detailedAnalysis.marketSentiment === 'bullish').length
  const bearishCount = predictions.filter(p => p.detailedAnalysis.marketSentiment === 'bearish').length
  
  if (bullishCount > bearishCount) {
    insights.push({
      id: 'market-sentiment-bullish',
      type: 'bullish',
      title: 'Market Sentiment: Bullish',
      description: `${bullishCount} out of ${predictions.length} stocks showing bullish sentiment`,
      confidence: (bullishCount / predictions.length) * 100,
      impact: 'high',
      timeframe: '7-14 days',
      tickers: predictions.filter(p => p.detailedAnalysis.marketSentiment === 'bullish').map(p => p.symbol),
      metrics: {
        value: bullishCount,
        change: bullishCount - bearishCount,
        trend: 'up'
      }
    })
  } else if (bearishCount > bullishCount) {
    insights.push({
      id: 'market-sentiment-bearish',
      type: 'bearish',
      title: 'Market Sentiment: Bearish',
      description: `${bearishCount} out of ${predictions.length} stocks showing bearish sentiment`,
      confidence: (bearishCount / predictions.length) * 100,
      impact: 'high',
      timeframe: '7-14 days',
      tickers: predictions.filter(p => p.detailedAnalysis.marketSentiment === 'bearish').map(p => p.symbol),
      metrics: {
        value: bearishCount,
        change: bearishCount - bullishCount,
        trend: 'down'
      }
    })
  }
  
  // High confidence predictions
  const highConfidencePredictions = predictions.filter(p => p.confidence > 80)
  if (highConfidencePredictions.length > 0) {
    insights.push({
      id: 'high-confidence-predictions',
      type: 'bullish',
      title: 'High Confidence Predictions',
      description: `${highConfidencePredictions.length} stocks with >80% confidence predictions`,
      confidence: 90,
      impact: 'medium',
      timeframe: '3-7 days',
      tickers: highConfidencePredictions.map(p => p.symbol),
      metrics: {
        value: highConfidencePredictions.length,
        change: 0,
        trend: 'stable'
      }
    })
  }
  
  // Risk factors insight
  const highRiskStocks = predictions.filter(p => p.detailedAnalysis.buySellRecommendation.riskLevel === 'high')
  if (highRiskStocks.length > 0) {
    insights.push({
      id: 'high-risk-stocks',
      type: 'warning',
      title: 'High Risk Stocks Detected',
      description: `${highRiskStocks.length} stocks identified as high risk`,
      confidence: 85,
      impact: 'high',
      timeframe: '1-3 days',
      tickers: highRiskStocks.map(p => p.symbol),
      metrics: {
        value: highRiskStocks.length,
        change: 0,
        trend: 'stable'
      }
    })
  }
  
  return insights
}

// OLD MOCK FUNCTIONS - REMOVED
// All AI analysis now uses real market data via RealAIAnalysisService
async function generateRealTimeInsights(realTimeData: any[]): Promise<AIInsight[]> {
  const insights: AIInsight[] = []
  
  // Analyze tech sector (AAPL, MSFT, GOOGL, NVDA)
  const techStocks = realTimeData.filter(data => ['AAPL', 'MSFT', 'GOOGL', 'NVDA'].includes(data.symbol))
  if (techStocks.length > 0) {
    const avgChange = techStocks.reduce((sum, stock) => sum + stock.changePercent, 0) / techStocks.length
    const confidence = Math.min(95, Math.max(60, 80 + (avgChange * 2)))
    
    insights.push({
      id: 'tech_momentum',
      type: avgChange > 2 ? 'bullish' : avgChange < -2 ? 'bearish' : 'neutral',
      title: 'Tech Sector Momentum',
      description: `AI analysis indicates ${avgChange > 2 ? 'strong upward' : avgChange < -2 ? 'downward' : 'stable'} momentum in tech stocks over the next 7 days, driven by ${avgChange > 0 ? 'positive' : 'negative'} market sentiment.`,
      confidence: Math.round(confidence),
      impact: Math.abs(avgChange) > 3 ? 'high' : Math.abs(avgChange) > 1 ? 'medium' : 'low',
      timeframe: '7 days',
      tickers: techStocks.map(s => s.symbol),
      metrics: {
        value: Math.abs(avgChange),
        change: avgChange,
        trend: avgChange > 0 ? 'up' : avgChange < 0 ? 'down' : 'stable'
      }
    })
  }
  
  // Analyze energy sector (XOM, CVX, COP)
  const energyStocks = realTimeData.filter(data => ['XOM', 'CVX', 'COP'].includes(data.symbol))
  if (energyStocks.length > 0) {
    const avgChange = energyStocks.reduce((sum, stock) => sum + stock.changePercent, 0) / energyStocks.length
    const volatility = energyStocks.reduce((sum, stock) => sum + Math.abs(stock.changePercent), 0) / energyStocks.length
    
    insights.push({
      id: 'energy_volatility',
      type: volatility > 3 ? 'warning' : 'neutral',
      title: 'Energy Sector Volatility',
      description: `${volatility > 3 ? 'High' : 'Moderate'} volatility expected in energy sector due to ${avgChange > 0 ? 'positive' : 'negative'} market conditions and geopolitical factors.`,
      confidence: Math.round(Math.min(90, Math.max(50, 70 + volatility))),
      impact: volatility > 3 ? 'high' : 'medium',
      timeframe: '3 days',
      tickers: energyStocks.map(s => s.symbol),
      metrics: {
        value: volatility,
        change: avgChange,
        trend: avgChange > 0 ? 'up' : avgChange < 0 ? 'down' : 'stable'
      }
    })
  }
  
  // Analyze consumer discretionary (AMZN, TSLA, NFLX)
  const consumerStocks = realTimeData.filter(data => ['AMZN', 'TSLA', 'NFLX'].includes(data.symbol))
  if (consumerStocks.length > 0) {
    const avgChange = consumerStocks.reduce((sum, stock) => sum + stock.changePercent, 0) / consumerStocks.length
    
    insights.push({
      id: 'consumer_pressure',
      type: avgChange < -2 ? 'bearish' : avgChange > 2 ? 'bullish' : 'neutral',
      title: 'Consumer Discretionary Pressure',
      description: `Consumer spending concerns and market data suggest ${avgChange < -2 ? 'potential weakness' : avgChange > 2 ? 'strength' : 'stability'} in discretionary stocks.`,
      confidence: Math.round(Math.min(85, Math.max(55, 65 + Math.abs(avgChange) * 2))),
      impact: Math.abs(avgChange) > 2 ? 'medium' : 'low',
      timeframe: '14 days',
      tickers: consumerStocks.map(s => s.symbol),
      metrics: {
        value: Math.abs(avgChange),
        change: avgChange,
        trend: avgChange > 0 ? 'up' : avgChange < 0 ? 'down' : 'stable'
      }
    })
  }
  
  // Analyze healthcare sector (JNJ, PFE, UNH)
  const healthcareStocks = realTimeData.filter(data => ['JNJ', 'PFE', 'UNH'].includes(data.symbol))
  if (healthcareStocks.length > 0) {
    const avgChange = healthcareStocks.reduce((sum, stock) => sum + stock.changePercent, 0) / healthcareStocks.length
    const stability = 1 - (healthcareStocks.reduce((sum, stock) => sum + Math.abs(stock.changePercent), 0) / healthcareStocks.length / 10)
    
    insights.push({
      id: 'healthcare_stability',
      type: 'neutral',
      title: 'Healthcare Stability',
      description: `Healthcare sector showing ${stability > 0.7 ? 'stable' : 'moderate'} performance with defensive characteristics in current market environment.`,
      confidence: Math.round(Math.min(90, Math.max(60, 70 + stability * 20))),
      impact: 'low',
      timeframe: '30 days',
      tickers: healthcareStocks.map(s => s.symbol),
      metrics: {
        value: stability * 10,
        change: avgChange,
        trend: avgChange > 0 ? 'up' : avgChange < 0 ? 'down' : 'stable'
      }
    })
  }
  
  return insights
}

