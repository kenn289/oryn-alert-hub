import { config } from '../../config';
import { logger } from '../../utils/logger';
import { CacheService } from '../cache/CacheService';
import { StockService } from '../stock/StockService';

export interface MLPrediction {
  symbol: string;
  currentPrice: number;
  predictedPrice: number;
  confidence: number;
  timeframe: string;
  reasoning: string;
  technicalIndicators: {
    rsi: number;
    macd: number;
    sma20: number;
    sma50: number;
    sma200: number;
    support: number;
    resistance: number;
    trend: 'up' | 'down' | 'sideways';
  };
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  riskFactors: string[];
  buySellRecommendation: {
    action: 'buy' | 'sell' | 'hold';
    targetPrice: number;
    stopLoss: number;
    reasoning: string;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

export class SimpleMLService {
  private cacheService: CacheService;
  private stockService: StockService;
  private isInitialized = false;

  constructor(cacheService: CacheService, stockService: StockService) {
    this.cacheService = cacheService;
    this.stockService = stockService;
  }

  public async initialize(): Promise<void> {
    try {
      logger.info('🤖 Initializing Simple ML Service...');
      this.isInitialized = true;
      logger.info('✅ Simple ML Service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize Simple ML Service:', error);
      throw error;
    }
  }

  public async generatePredictions(symbols: string[]): Promise<MLPrediction[]> {
    if (!this.isInitialized) {
      throw new Error('ML Service not initialized');
    }

    const predictions: MLPrediction[] = [];
    
    for (const symbol of symbols) {
      try {
        // Check cache first
        const cacheKey = `ml_prediction_${symbol}`;
        const cached = await this.cacheService.get(cacheKey);
        
        if (cached) {
          predictions.push(cached);
          continue;
        }

        // Generate new prediction
        const prediction = await this.generatePrediction(symbol);
        predictions.push(prediction);

        // Cache the prediction
        await this.cacheService.set(cacheKey, prediction, config.ML.PREDICTION_CACHE_TTL);
        
      } catch (error) {
        logger.error(`Failed to generate prediction for ${symbol}:`, error);
        // Add a fallback prediction
        predictions.push(this.createFallbackPrediction(symbol));
      }
    }

    return predictions;
  }

  private async generatePrediction(symbol: string): Promise<MLPrediction> {
    try {
      // Get historical data
      const historicalData = await this.stockService.getHistoricalData(symbol, '6mo');
      
      if (!historicalData || historicalData.length < 30) {
        throw new Error('Insufficient historical data');
      }

      // Calculate technical indicators
      const indicators = this.calculateTechnicalIndicators(historicalData);
      
      // Get current price
      const currentPrice = historicalData[historicalData.length - 1].close;
      
      // Generate prediction using simple heuristics
      const prediction = this.runSimplePrediction(historicalData, indicators);
      
      // Calculate confidence
      const confidence = this.calculateConfidence(indicators, prediction);
      
      // Generate reasoning
      const reasoning = this.generateReasoning(indicators, prediction, confidence);
      
      // Determine market sentiment
      const marketSentiment = this.determineMarketSentiment(indicators, prediction);
      
      // Identify risk factors
      const riskFactors = this.identifyRiskFactors(indicators, prediction);
      
      // Generate buy/sell recommendation
      const recommendation = this.generateRecommendation(indicators, prediction, confidence);
      
      return {
        symbol,
        currentPrice,
        predictedPrice: prediction.price,
        confidence,
        timeframe: prediction.timeframe,
        reasoning,
        technicalIndicators: indicators,
        marketSentiment,
        riskFactors,
        buySellRecommendation: recommendation
      };
      
    } catch (error) {
      logger.error(`Error generating prediction for ${symbol}:`, error);
      throw error;
    }
  }

  private calculateTechnicalIndicators(data: any[]): any {
    const closes = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const volumes = data.map(d => d.volume);

    // Calculate RSI
    const rsi = this.calculateRSI(closes);
    
    // Calculate MACD
    const macd = this.calculateMACD(closes);
    
    // Calculate SMAs
    const sma20 = this.calculateSMA(closes, 20);
    const sma50 = this.calculateSMA(closes, 50);
    const sma200 = this.calculateSMA(closes, 200);
    
    // Calculate support and resistance
    const support = Math.min(...lows.slice(-20));
    const resistance = Math.max(...highs.slice(-20));
    
    // Determine trend
    const trend = this.determineTrend(sma20, sma50, sma200);

    return {
      rsi,
      macd,
      sma20,
      sma50,
      sma200,
      support,
      resistance,
      trend
    };
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateMACD(prices: number[]): number {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    return ema12 - ema26;
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];
    
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  private determineTrend(sma20: number, sma50: number, sma200: number): 'up' | 'down' | 'sideways' {
    if (sma20 > sma50 && sma50 > sma200) return 'up';
    if (sma20 < sma50 && sma50 < sma200) return 'down';
    return 'sideways';
  }

  private runSimplePrediction(data: any[], indicators: any): any {
    // Simple prediction logic based on technical indicators
    const currentPrice = data[data.length - 1].close;
    const trend = indicators.trend;
    const rsi = indicators.rsi;
    const macd = indicators.macd;
    
    // Simple prediction logic
    let priceChange = 0;
    
    if (trend === 'up' && rsi < 70) {
      priceChange = 0.02; // 2% increase
    } else if (trend === 'down' && rsi > 30) {
      priceChange = -0.02; // 2% decrease
    } else {
      priceChange = 0.01; // 1% increase
    }
    
    const predictedPrice = currentPrice * (1 + priceChange);
    
    return {
      price: predictedPrice,
      timeframe: '3-5 days'
    };
  }

  private calculateConfidence(indicators: any, prediction: any): number {
    let confidence = 0.5; // Base confidence
    
    // RSI confidence
    if (indicators.rsi < 30 || indicators.rsi > 70) {
      confidence += 0.2; // Higher confidence for extreme RSI
    }
    
    // Trend confidence
    if (indicators.trend === 'up' || indicators.trend === 'down') {
      confidence += 0.1;
    }
    
    // MACD confidence
    if (Math.abs(indicators.macd) > 0.1) {
      confidence += 0.1;
    }
    
    return Math.min(0.95, Math.max(0.1, confidence));
  }

  private generateReasoning(indicators: any, prediction: any, confidence: number): string {
    const reasons = [];
    
    if (indicators.trend === 'up') {
      reasons.push('Strong upward trend detected');
    } else if (indicators.trend === 'down') {
      reasons.push('Downward trend identified');
    }
    
    if (indicators.rsi < 30) {
      reasons.push('Oversold conditions suggest potential bounce');
    } else if (indicators.rsi > 70) {
      reasons.push('Overbought conditions may lead to correction');
    }
    
    if (Math.abs(indicators.macd) > 0.1) {
      reasons.push('Strong momentum indicated by MACD');
    }
    
    return reasons.join('. ') || 'Technical analysis suggests moderate movement';
  }

  private determineMarketSentiment(indicators: any, prediction: any): 'bullish' | 'bearish' | 'neutral' {
    if (indicators.trend === 'up' && indicators.rsi < 70) return 'bullish';
    if (indicators.trend === 'down' && indicators.rsi > 30) return 'bearish';
    return 'neutral';
  }

  private identifyRiskFactors(indicators: any, prediction: any): string[] {
    const risks = [];
    
    if (indicators.rsi > 80) {
      risks.push('Extreme overbought conditions');
    }
    
    if (indicators.rsi < 20) {
      risks.push('Extreme oversold conditions');
    }
    
    if (Math.abs(indicators.macd) < 0.01) {
      risks.push('Weak momentum signals');
    }
    
    return risks;
  }

  private generateRecommendation(indicators: any, prediction: any, confidence: number): any {
    const currentPrice = prediction.price / 1.02; // Approximate current price
    const targetPrice = prediction.price;
    const stopLoss = currentPrice * 0.95; // 5% stop loss
    
    let action: 'buy' | 'sell' | 'hold' = 'hold';
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    
    if (indicators.trend === 'up' && confidence > 0.7) {
      action = 'buy';
      riskLevel = confidence > 0.8 ? 'low' : 'medium';
    } else if (indicators.trend === 'down' && confidence > 0.7) {
      action = 'sell';
      riskLevel = confidence > 0.8 ? 'low' : 'medium';
    }
    
    return {
      action,
      targetPrice,
      stopLoss,
      reasoning: `Based on ${indicators.trend} trend and ${(confidence * 100).toFixed(0)}% confidence`,
      riskLevel
    };
  }

  private createFallbackPrediction(symbol: string): MLPrediction {
    return {
      symbol,
      currentPrice: 100,
      predictedPrice: 102,
      confidence: 0.5,
      timeframe: '3-5 days',
      reasoning: 'Limited data available for analysis',
      technicalIndicators: {
        rsi: 50,
        macd: 0,
        sma20: 100,
        sma50: 100,
        sma200: 100,
        support: 95,
        resistance: 105,
        trend: 'sideways'
      },
      marketSentiment: 'neutral',
      riskFactors: ['Limited historical data'],
      buySellRecommendation: {
        action: 'hold',
        targetPrice: 102,
        stopLoss: 95,
        reasoning: 'Insufficient data for reliable prediction',
        riskLevel: 'high'
      }
    };
  }

  public getModelStatus(): string {
    return 'Simple ML Service - Heuristic-based predictions';
  }

  public async close(): Promise<void> {
    logger.info('🤖 Closing Simple ML Service...');
    this.isInitialized = false;
    logger.info('✅ Simple ML Service closed');
  }
}
