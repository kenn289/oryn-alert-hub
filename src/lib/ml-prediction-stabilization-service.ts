import { supabase } from './supabase'

export interface StabilizedPrediction {
  id: string
  symbol: string
  name: string
  currentPrice: number
  predictedPrice: number
  confidence: number
  direction: 'bullish' | 'bearish' | 'neutral'
  timeframe: '1d' | '1w' | '1m' | '3m' | '6m' | '1y'
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

export interface PredictionMetrics {
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

export interface PredictionValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

export class MLPredictionStabilizationService {
  private static instance: MLPredictionStabilizationService
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

  static getInstance(): MLPredictionStabilizationService {
    if (!MLPredictionStabilizationService.instance) {
      MLPredictionStabilizationService.instance = new MLPredictionStabilizationService()
    }
    return MLPredictionStabilizationService.instance
  }

  /**
   * Generate stabilized ML predictions with comprehensive data
   */
  async generateStabilizedPredictions(symbols: string[]): Promise<StabilizedPrediction[]> {
    const cacheKey = `predictions_${symbols.join('_')}`
    const cached = this.cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('🎯 Using cached predictions')
      return cached.data
    }

    try {
      console.log(`🔮 Generating stabilized predictions for ${symbols.length} symbols...`)
      
      const predictions: StabilizedPrediction[] = []
      
      for (const symbol of symbols) {
        try {
          const prediction = await this.generateStabilizedPrediction(symbol)
          if (prediction) {
            predictions.push(prediction)
          }
        } catch (error) {
          console.error(`Error generating prediction for ${symbol}:`, error)
        }
      }

      // Store in cache
      this.cache.set(cacheKey, {
        data: predictions,
        timestamp: Date.now()
      })

      // Store predictions in database
      await this.storePredictions(predictions)

      console.log(`✅ Generated ${predictions.length} stabilized predictions`)
      return predictions
    } catch (error) {
      console.error('Error generating stabilized predictions:', error)
      return []
    }
  }

  /**
   * Generate stabilized prediction for a single symbol
   */
  private async generateStabilizedPrediction(symbol: string): Promise<StabilizedPrediction | null> {
    try {
      // Get current market data
      const marketData = await this.getMarketData(symbol)
      if (!marketData) {
        console.warn(`No market data available for ${symbol}`)
        return null
      }

      // Get historical predictions for accuracy calculation
      const historicalPredictions = await this.getHistoricalPredictions(symbol)
      
      // Calculate technical indicators
      const technicalScore = this.calculateTechnicalScore(marketData)
      
      // Calculate fundamental score
      const fundamentalScore = this.calculateFundamentalScore(marketData)
      
      // Calculate sentiment score
      const sentimentScore = this.calculateSentimentScore(marketData)
      
      // Generate prediction using ensemble method
      const prediction = this.generateEnsemblePrediction(
        marketData,
        technicalScore,
        fundamentalScore,
        sentimentScore,
        historicalPredictions
      )

      // Calculate confidence based on historical accuracy
      const confidence = this.calculateConfidence(prediction, historicalPredictions)
      
      // Determine risk level
      const riskLevel = this.determineRiskLevel(confidence, marketData)
      
      // Generate reasoning
      const reasoning = this.generateReasoning(marketData, technicalScore, fundamentalScore, sentimentScore)
      
      // Generate factors
      const factors = this.generateFactors(marketData, technicalScore, fundamentalScore, sentimentScore)

      return {
        id: `${symbol}_${Date.now()}`,
        symbol: symbol.toUpperCase(),
        name: marketData.name || symbol,
        currentPrice: marketData.price,
        predictedPrice: prediction.price,
        confidence: Math.round(confidence * 100) / 100,
        direction: prediction.direction,
        timeframe: prediction.timeframe,
        technicalScore: Math.round(technicalScore * 100) / 100,
        fundamentalScore: Math.round(fundamentalScore * 100) / 100,
        sentimentScore: Math.round(sentimentScore * 100) / 100,
        riskLevel,
        reasoning,
        factors,
        lastUpdated: new Date().toISOString(),
        accuracy: this.calculateAccuracy(historicalPredictions),
        historicalAccuracy: this.calculateHistoricalAccuracy(historicalPredictions)
      }
    } catch (error) {
      console.error(`Error generating stabilized prediction for ${symbol}:`, error)
      return null
    }
  }

  /**
   * Get market data for a symbol
   */
  private async getMarketData(symbol: string): Promise<any> {
    try {
      const response = await fetch(`/api/stock/global/${symbol}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error(`Error fetching market data for ${symbol}:`, error)
      return null
    }
  }

  /**
   * Calculate technical score based on multiple indicators
   */
  private calculateTechnicalScore(marketData: any): number {
    const { price, change, changePercent, volume, high, low, open } = marketData
    
    let score = 0.5 // Start neutral
    
    // Price momentum
    if (changePercent > 0) score += 0.1
    else if (changePercent < -2) score -= 0.1
    
    // Volume analysis
    if (volume > 0) {
      const avgVolume = marketData.avgVolume || volume
      if (volume > avgVolume * 1.5) score += 0.1 // High volume
      else if (volume < avgVolume * 0.5) score -= 0.1 // Low volume
    }
    
    // Price position
    if (high && low && price) {
      const position = (price - low) / (high - low)
      if (position > 0.8) score += 0.1 // Near high
      else if (position < 0.2) score -= 0.1 // Near low
    }
    
    // RSI-like calculation
    const rsi = this.calculateRSI(marketData)
    if (rsi > 70) score -= 0.1 // Overbought
    else if (rsi < 30) score += 0.1 // Oversold
    
    return Math.max(0, Math.min(1, score))
  }

  /**
   * Calculate fundamental score
   */
  private calculateFundamentalScore(marketData: any): number {
    let score = 0.5 // Start neutral
    
    // P/E ratio analysis
    if (marketData.pe) {
      if (marketData.pe < 15) score += 0.1 // Undervalued
      else if (marketData.pe > 30) score -= 0.1 // Overvalued
    }
    
    // Market cap analysis
    if (marketData.marketCap) {
      if (marketData.marketCap > 100000000000) score += 0.1 // Large cap
      else if (marketData.marketCap < 1000000000) score -= 0.1 // Small cap
    }
    
    // Sector analysis (simplified)
    if (marketData.sector) {
      const growthSectors = ['Technology', 'Healthcare', 'Consumer Discretionary']
      if (growthSectors.includes(marketData.sector)) score += 0.1
    }
    
    return Math.max(0, Math.min(1, score))
  }

  /**
   * Calculate sentiment score
   */
  private calculateSentimentScore(marketData: any): number {
    let score = 0.5 // Start neutral
    
    // Price change sentiment
    if (marketData.changePercent > 5) score += 0.2
    else if (marketData.changePercent < -5) score -= 0.2
    else if (marketData.changePercent > 0) score += 0.1
    else if (marketData.changePercent < 0) score -= 0.1
    
    // Volume sentiment
    if (marketData.volume && marketData.avgVolume) {
      const volumeRatio = marketData.volume / marketData.avgVolume
      if (volumeRatio > 2) score += 0.1 // High interest
      else if (volumeRatio < 0.5) score -= 0.1 // Low interest
    }
    
    return Math.max(0, Math.min(1, score))
  }

  /**
   * Generate ensemble prediction
   */
  private generateEnsemblePrediction(
    marketData: any,
    technicalScore: number,
    fundamentalScore: number,
    sentimentScore: number,
    historicalPredictions: any[]
  ): { price: number; direction: 'bullish' | 'bearish' | 'neutral'; timeframe: string } {
    
    // Weighted average of scores
    const weights = { technical: 0.4, fundamental: 0.3, sentiment: 0.3 }
    const overallScore = (
      technicalScore * weights.technical +
      fundamentalScore * weights.fundamental +
      sentimentScore * weights.sentiment
    )
    
    // Calculate price prediction
    const currentPrice = marketData.price
    const priceChangePercent = (overallScore - 0.5) * 20 // Scale to -10% to +10%
    const predictedPrice = currentPrice * (1 + priceChangePercent / 100)
    
    // Determine direction
    let direction: 'bullish' | 'bearish' | 'neutral'
    if (overallScore > 0.6) direction = 'bullish'
    else if (overallScore < 0.4) direction = 'bearish'
    else direction = 'neutral'
    
    // Determine timeframe based on confidence
    let timeframe = '1m'
    if (overallScore > 0.7 || overallScore < 0.3) timeframe = '1w'
    if (overallScore > 0.8 || overallScore < 0.2) timeframe = '1d'
    
    return {
      price: Math.round(predictedPrice * 100) / 100,
      direction,
      timeframe
    }
  }

  /**
   * Calculate confidence based on historical accuracy
   */
  private calculateConfidence(prediction: any, historicalPredictions: any[]): number {
    if (historicalPredictions.length === 0) return 0.5
    
    const historicalAccuracy = this.calculateHistoricalAccuracy(historicalPredictions)
    const baseConfidence = 0.5 + (historicalAccuracy - 0.5) * 0.5 // Scale accuracy to confidence
    
    return Math.max(0.1, Math.min(0.9, baseConfidence))
  }

  /**
   * Determine risk level
   */
  private determineRiskLevel(confidence: number, marketData: any): 'low' | 'medium' | 'high' {
    let riskScore = 0.5
    
    // Confidence factor
    if (confidence < 0.3) riskScore += 0.3
    else if (confidence > 0.7) riskScore -= 0.3
    
    // Volatility factor
    if (Math.abs(marketData.changePercent) > 5) riskScore += 0.2
    
    // Volume factor
    if (marketData.volume && marketData.avgVolume) {
      const volumeRatio = marketData.volume / marketData.avgVolume
      if (volumeRatio > 3) riskScore += 0.2 // High volume = higher risk
    }
    
    if (riskScore > 0.7) return 'high'
    if (riskScore > 0.4) return 'medium'
    return 'low'
  }

  /**
   * Generate reasoning
   */
  private generateReasoning(
    marketData: any,
    technicalScore: number,
    fundamentalScore: number,
    sentimentScore: number
  ): string[] {
    const reasoning: string[] = []
    
    // Technical reasoning
    if (technicalScore > 0.6) {
      reasoning.push('Strong technical indicators suggest upward momentum')
    } else if (technicalScore < 0.4) {
      reasoning.push('Weak technical indicators suggest downward pressure')
    }
    
    // Fundamental reasoning
    if (fundamentalScore > 0.6) {
      reasoning.push('Solid fundamental metrics support positive outlook')
    } else if (fundamentalScore < 0.4) {
      reasoning.push('Concerning fundamental metrics indicate potential weakness')
    }
    
    // Sentiment reasoning
    if (sentimentScore > 0.6) {
      reasoning.push('Positive market sentiment supports bullish outlook')
    } else if (sentimentScore < 0.4) {
      reasoning.push('Negative market sentiment suggests bearish outlook')
    }
    
    // Price movement reasoning
    if (Math.abs(marketData.changePercent) > 3) {
      reasoning.push(`Significant price movement (${marketData.changePercent.toFixed(2)}%) indicates strong market reaction`)
    }
    
    return reasoning
  }

  /**
   * Generate factors
   */
  private generateFactors(
    marketData: any,
    technicalScore: number,
    fundamentalScore: number,
    sentimentScore: number
  ): { technical: string[]; fundamental: string[]; sentiment: string[] } {
    return {
      technical: [
        technicalScore > 0.6 ? 'Strong momentum indicators' : 'Weak momentum indicators',
        marketData.volume > (marketData.avgVolume || 0) * 1.5 ? 'High trading volume' : 'Normal trading volume',
        'Price action analysis'
      ],
      fundamental: [
        marketData.pe && marketData.pe < 20 ? 'Attractive valuation' : 'Premium valuation',
        marketData.marketCap > 10000000000 ? 'Large cap stability' : 'Small cap volatility',
        'Sector performance analysis'
      ],
      sentiment: [
        marketData.changePercent > 0 ? 'Positive price momentum' : 'Negative price momentum',
        'Market sentiment indicators',
        'Trading volume analysis'
      ]
    }
  }

  /**
   * Calculate RSI
   */
  private calculateRSI(marketData: any): number {
    // Simplified RSI calculation
    const change = marketData.change || 0
    const price = marketData.price || 1
    
    if (change > 0) return 50 + (change / price) * 1000
    if (change < 0) return 50 + (change / price) * 1000
    return 50
  }

  /**
   * Get historical predictions
   */
  private async getHistoricalPredictions(symbol: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('ml_predictions')
        .select('*')
        .eq('symbol', symbol.toUpperCase())
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error fetching historical predictions:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching historical predictions:', error)
      return []
    }
  }

  /**
   * Calculate accuracy
   */
  private calculateAccuracy(historicalPredictions: any[]): number {
    if (historicalPredictions.length === 0) return 0.5
    
    let correct = 0
    for (const prediction of historicalPredictions) {
      if (prediction.actual_direction === prediction.predicted_direction) {
        correct++
      }
    }
    
    return correct / historicalPredictions.length
  }

  /**
   * Calculate historical accuracy
   */
  private calculateHistoricalAccuracy(historicalPredictions: any[]): number {
    return this.calculateAccuracy(historicalPredictions)
  }

  /**
   * Store predictions in database
   */
  private async storePredictions(predictions: StabilizedPrediction[]): Promise<void> {
    try {
      const predictionData = predictions.map(prediction => ({
        symbol: prediction.symbol,
        name: prediction.name,
        current_price: prediction.currentPrice,
        predicted_price: prediction.predictedPrice,
        confidence: prediction.confidence,
        direction: prediction.direction,
        timeframe: prediction.timeframe,
        technical_score: prediction.technicalScore,
        fundamental_score: prediction.fundamentalScore,
        sentiment_score: prediction.sentimentScore,
        risk_level: prediction.riskLevel,
        reasoning: prediction.reasoning,
        factors: prediction.factors,
        accuracy: prediction.accuracy,
        historical_accuracy: prediction.historicalAccuracy
      }))

      const { error } = await supabase
        .from('ml_predictions')
        .insert(predictionData)

      if (error) {
        console.error('Error storing predictions:', error)
      } else {
        console.log(`✅ Stored ${predictions.length} predictions in database`)
      }
    } catch (error) {
      console.error('Error storing predictions:', error)
    }
  }

  /**
   * Get prediction metrics
   */
  async getPredictionMetrics(): Promise<PredictionMetrics> {
    try {
      const { data, error } = await supabase
        .from('ml_predictions')
        .select('*')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

      if (error) {
        console.error('Error fetching prediction metrics:', error)
        return {
          totalPredictions: 0,
          accuratePredictions: 0,
          averageAccuracy: 0,
          confidenceDistribution: { high: 0, medium: 0, low: 0 },
          timeframeAccuracy: {},
          symbolAccuracy: {}
        }
      }

      const predictions = data || []
      const totalPredictions = predictions.length
      const accuratePredictions = predictions.filter(p => p.accuracy > 0.5).length
      const averageAccuracy = totalPredictions > 0 ? accuratePredictions / totalPredictions : 0

      const confidenceDistribution = {
        high: predictions.filter(p => p.confidence > 0.7).length,
        medium: predictions.filter(p => p.confidence >= 0.4 && p.confidence <= 0.7).length,
        low: predictions.filter(p => p.confidence < 0.4).length
      }

      const timeframeAccuracy: Record<string, number> = {}
      const symbolAccuracy: Record<string, number> = {}

      // Calculate accuracy by timeframe
      const timeframes = [...new Set(predictions.map(p => p.timeframe))]
      for (const timeframe of timeframes) {
        const timeframePredictions = predictions.filter(p => p.timeframe === timeframe)
        const timeframeAccurate = timeframePredictions.filter(p => p.accuracy > 0.5).length
        timeframeAccuracy[timeframe] = timeframePredictions.length > 0 ? timeframeAccurate / timeframePredictions.length : 0
      }

      // Calculate accuracy by symbol
      const symbols = [...new Set(predictions.map(p => p.symbol))]
      for (const symbol of symbols) {
        const symbolPredictions = predictions.filter(p => p.symbol === symbol)
        const symbolAccurate = symbolPredictions.filter(p => p.accuracy > 0.5).length
        symbolAccuracy[symbol] = symbolPredictions.length > 0 ? symbolAccurate / symbolPredictions.length : 0
      }

      return {
        totalPredictions,
        accuratePredictions,
        averageAccuracy,
        confidenceDistribution,
        timeframeAccuracy,
        symbolAccuracy
      }
    } catch (error) {
      console.error('Error calculating prediction metrics:', error)
      return {
        totalPredictions: 0,
        accuratePredictions: 0,
        averageAccuracy: 0,
        confidenceDistribution: { high: 0, medium: 0, low: 0 },
        timeframeAccuracy: {},
        symbolAccuracy: {}
      }
    }
  }

  /**
   * Validate prediction data
   */
  validatePrediction(prediction: StabilizedPrediction): PredictionValidation {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    // Validate required fields
    if (!prediction.symbol) errors.push('Symbol is required')
    if (!prediction.currentPrice || prediction.currentPrice <= 0) errors.push('Valid current price is required')
    if (!prediction.predictedPrice || prediction.predictedPrice <= 0) errors.push('Valid predicted price is required')
    if (prediction.confidence < 0 || prediction.confidence > 1) errors.push('Confidence must be between 0 and 1')

    // Validate scores
    if (prediction.technicalScore < 0 || prediction.technicalScore > 1) warnings.push('Technical score should be between 0 and 1')
    if (prediction.fundamentalScore < 0 || prediction.fundamentalScore > 1) warnings.push('Fundamental score should be between 0 and 1')
    if (prediction.sentimentScore < 0 || prediction.sentimentScore > 1) warnings.push('Sentiment score should be between 0 and 1')

    // Validate confidence
    if (prediction.confidence < 0.3) warnings.push('Low confidence prediction')
    if (prediction.confidence > 0.8) warnings.push('Very high confidence - verify data quality')

    // Suggestions
    if (prediction.reasoning.length < 2) suggestions.push('Add more detailed reasoning')
    if (prediction.factors.technical.length < 2) suggestions.push('Include more technical factors')
    if (prediction.factors.fundamental.length < 2) suggestions.push('Include more fundamental factors')

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
    console.log('🧹 ML prediction cache cleared')
  }
}

export const mlPredictionStabilizationService = MLPredictionStabilizationService.getInstance()
