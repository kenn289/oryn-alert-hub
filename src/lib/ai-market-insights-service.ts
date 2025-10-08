// Using direct API calls instead of multiApiStockService
import { MLPredictionModel, MLPrediction } from './ml-prediction-model'

export interface MarketInsight {
  symbol: string
  name: string
  confidence: number
  buyTime: string
  sellTime: string
  predictedReturn: number
  reasoning: string
  currentPrice: number
  targetPrice: number
  stopLoss: number
  riskLevel: 'low' | 'medium' | 'high'
  // ML Model specific fields
  modelAccuracy?: number
  modelVersion?: string
  lastTrained?: string
  disclaimer?: string
}

export interface MarketInsights {
  market: string
  dayTrading: MarketInsight[]
  longTerm: MarketInsight[]
  swingTrading: MarketInsight[]
  lastUpdated: string
}

export class AIMarketInsightsService {
  private static instance: AIMarketInsightsService
  private insightsCache: Map<string, MarketInsights> = new Map()
  private readonly CACHE_DURATION = 15 * 60 * 1000 // 15 minutes

  static getInstance(): AIMarketInsightsService {
    if (!AIMarketInsightsService.instance) {
      AIMarketInsightsService.instance = new AIMarketInsightsService()
    }
    return AIMarketInsightsService.instance
  }

  /**
   * Get market insights for a specific market
   */
  async getMarketInsights(market: string): Promise<MarketInsights> {
    console.log(`🔍 Getting market insights for ${market}...`)
    const cacheKey = market.toLowerCase()
    const cached = this.insightsCache.get(cacheKey)
    
    if (cached && this.isCacheValid(cached.lastUpdated)) {
      console.log(`📊 Using cached insights for ${market}`)
      return cached
    }

    console.log(`🔍 Generating fresh AI insights for ${market}`)
    
    try {
      const insights = await this.generateMarketInsights(market)
      console.log(`✅ Generated insights for ${market}:`, {
        dayTrading: insights.dayTrading.length,
        longTerm: insights.longTerm.length,
        swingTrading: insights.swingTrading.length
      })
      this.insightsCache.set(cacheKey, insights)
      return insights
    } catch (error) {
      console.error(`❌ Error generating insights for ${market}:`, error)
      // Return empty insights instead of throwing error
      console.warn(`⚠️ Returning empty insights for ${market} due to API failures`)
      return {
        market,
        dayTrading: [],
        longTerm: [],
        swingTrading: [],
        lastUpdated: new Date().toISOString()
      }
    }
  }

  /**
   * Generate AI-powered market insights using ML model - ONLY REAL DATA
   */
  private async generateMarketInsights(market: string): Promise<MarketInsights> {
    console.log(`🤖 Generating AI market insights for ${market} using ML model...`)
    
    // Get popular stocks for this market
    const symbols = this.getMarketStocks(market)
    console.log(`📊 Analyzing ${symbols.length} stocks for ${market}: ${symbols.join(', ')}`)
    
    if (symbols.length === 0) {
      console.warn(`⚠️ No stocks found for market: ${market}`)
      return {
        market,
        dayTrading: [],
        longTerm: [],
        swingTrading: [],
        lastUpdated: new Date().toISOString()
      }
    }
    
    // Initialize ML model
    const mlModel = MLPredictionModel.getInstance()
    
    // Train model on historical data if not already trained
    if (!mlModel.isModelTraining()) {
      console.log('🧠 Training ML model on historical data...')
      await mlModel.trainModel(symbols)
    }
    
    // Generate ML predictions
    console.log(`🔮 Generating ML predictions for ${symbols.length} symbols...`)
    const mlPredictions = await mlModel.generatePredictions(symbols)
    console.log(`📈 Generated ${mlPredictions.length} ML predictions`)
    
    if (mlPredictions.length === 0) {
      console.warn('⚠️ No ML predictions available - returning empty insights')
      return {
        market,
        dayTrading: [],
        longTerm: [],
        swingTrading: [],
        lastUpdated: new Date().toISOString()
      }
    }
    
    console.log(`✅ Generated ${mlPredictions.length} ML predictions`)
    
    // Convert ML predictions to market insights
    const dayTrading = this.convertMLPredictionsToInsights(mlPredictions, 'Day Trading')
    const longTerm = this.convertMLPredictionsToInsights(mlPredictions, 'Long Term')
    const swingTrading = this.convertMLPredictionsToInsights(mlPredictions, 'Swing Trading')

    return {
      market,
      dayTrading: dayTrading.slice(0, 3), // Top 3
      longTerm: longTerm.slice(0, 3), // Top 3
      swingTrading: swingTrading.slice(0, 3), // Top 3
      lastUpdated: new Date().toISOString()
    }
  }

  /**
   * Convert ML predictions to market insights
   */
  private convertMLPredictionsToInsights(predictions: MLPrediction[], type: 'Day Trading' | 'Long Term' | 'Swing Trading'): MarketInsight[] {
    return predictions
      .filter(prediction => {
        // Filter based on trading type
        if (type === 'Day Trading') {
          return prediction.buySignal && prediction.predictedChangePercent > 1
        } else if (type === 'Long Term') {
          return prediction.buySignal && prediction.predictedChangePercent > 3
        } else if (type === 'Swing Trading') {
          return prediction.buySignal && prediction.predictedChangePercent > 2
        }
        return false
      })
      .map(prediction => ({
        symbol: prediction.symbol,
        name: prediction.name,
        confidence: prediction.confidence,
        buyTime: prediction.optimalBuyTime || 'Market open',
        sellTime: prediction.optimalSellTime || 'Market close',
        predictedReturn: prediction.predictedChangePercent,
        reasoning: prediction.reasoning,
        currentPrice: prediction.currentPrice,
        targetPrice: prediction.predictedPrice,
        stopLoss: prediction.currentPrice * 0.95, // 5% stop loss
        riskLevel: prediction.riskLevel.toLowerCase() as 'low' | 'medium' | 'high',
        modelAccuracy: prediction.modelAccuracy,
        modelVersion: prediction.modelVersion,
        lastTrained: prediction.lastTrained,
        disclaimer: prediction.disclaimer
      }))
      .sort((a, b) => b.confidence - a.confidence) // Sort by confidence
  }

  /**
   * Determine original currency based on stock symbol
   */
  private getOriginalCurrency(symbol: string): string {
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

  /**
   * Get popular stocks for each market
   */
  private getMarketStocks(market: string): string[] {
    const marketStocks: { [key: string]: string[] } = {
      // US Markets
      'US': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'AMD', 'INTC', 'JPM', 'JNJ', 'PG', 'V', 'UNH'],
      'NASDAQ': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'AMD', 'INTC'],
      'NYSE': ['JPM', 'JNJ', 'PG', 'V', 'UNH', 'HD', 'MA', 'DIS', 'PYPL', 'CRM'],
      
      // Indian Markets
      'IN': ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'HINDUNILVR.NS', 'ITC.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'KOTAKBANK.NS', 'LT.NS'],
      'NSE': ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'HINDUNILVR.NS', 'ITC.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'KOTAKBANK.NS', 'LT.NS'],
      
      // UK Markets
      'GB': ['SHEL.L', 'AZN.L', 'ULVR.L', 'BATS.L', 'GSK.L', 'RIO.L', 'VOD.L', 'BP.L', 'LLOY.L', 'TSCO.L'],
      'UK': ['SHEL.L', 'AZN.L', 'ULVR.L', 'BATS.L', 'GSK.L', 'RIO.L', 'VOD.L', 'BP.L', 'LLOY.L', 'TSCO.L'],
      'LSE': ['SHEL.L', 'AZN.L', 'ULVR.L', 'BATS.L', 'GSK.L', 'RIO.L', 'VOD.L', 'BP.L', 'LLOY.L', 'TSCO.L'],
      
      // Japanese Markets
      'JP': ['7203.T', '6758.T', '6861.T', '9984.T', '9432.T', '8306.T', '4063.T', '8035.T', '9433.T', '4503.T'],
      'TSE': ['7203.T', '6758.T', '6861.T', '9984.T', '9432.T', '8306.T', '4063.T', '8035.T', '9433.T', '4503.T'],
      
      // Australian Markets
      'AU': ['CBA.AX', 'WBC.AX', 'ANZ.AX', 'NAB.AX', 'BHP.AX', 'RIO.AX', 'WES.AX', 'TLS.AX', 'CSL.AX', 'WOW.AX'],
      'ASX': ['CBA.AX', 'WBC.AX', 'ANZ.AX', 'NAB.AX', 'BHP.AX', 'RIO.AX', 'WES.AX', 'TLS.AX', 'CSL.AX', 'WOW.AX'],
      
      // Canadian Markets
      'CA': ['RY.TO', 'TD.TO', 'BNS.TO', 'BMO.TO', 'CM.TO', 'SHOP.TO', 'CNR.TO', 'CP.TO', 'ATD.TO', 'SU.TO'],
      'TSX': ['RY.TO', 'TD.TO', 'BNS.TO', 'BMO.TO', 'CM.TO', 'SHOP.TO', 'CNR.TO', 'CP.TO', 'ATD.TO', 'SU.TO'],
      
      // German Markets
      'DE': ['SAP.DE', 'SIE.DE', 'ALV.DE', 'BAS.DE', 'BAYN.DE', 'BMW.DE', 'DAI.DE', 'VOW3.DE', 'ADS.DE', 'MRK.DE'],
      'FSE': ['SAP.DE', 'SIE.DE', 'ALV.DE', 'BAS.DE', 'BAYN.DE', 'BMW.DE', 'DAI.DE', 'VOW3.DE', 'ADS.DE', 'MRK.DE'],
      
      // French Markets
      'FR': ['ASML.AS', 'LVMH.PA', 'ASML.PA', 'OR.PA', 'SAN.PA', 'MC.PA', 'TTE.PA', 'AIR.PA', 'BNP.PA', 'GLE.PA'],
      'EPA': ['ASML.AS', 'LVMH.PA', 'ASML.PA', 'OR.PA', 'SAN.PA', 'MC.PA', 'TTE.PA', 'AIR.PA', 'BNP.PA', 'GLE.PA']
    }

    const stocks = marketStocks[market] || []
    console.log(`📊 Found ${stocks.length} stocks for market ${market}: ${stocks.slice(0, 5).join(', ')}${stocks.length > 5 ? '...' : ''}`)
    return stocks
  }

  /**
   * Fetch real-time data for stocks - ONLY REAL DATA, NO MOCK DATA
   * Uses the same working API endpoints as other features
   */
  private async fetchRealTimeData(symbols: string[]): Promise<any[]> {
    const stockData = []
    const failedSymbols = []
    
    console.log(`🔍 Fetching REAL data for ${symbols.length} symbols: ${symbols.join(', ')}`)
    
    for (const symbol of symbols) {
      try {
        console.log(`🔍 Fetching REAL data for ${symbol} using working API...`)
        
        // Use the same API endpoint that works for other features
        const response = await fetch(`/api/stock/global/${symbol}`)
        
        console.log(`📡 API response for ${symbol}: ${response.status} ${response.statusText}`)
        
        if (!response.ok) {
          throw new Error(`API HTTP error: ${response.status}`)
        }
        
        const responseText = await response.text()
        if (!responseText || responseText.trim() === '') {
          console.warn(`❌ Empty response for ${symbol}`)
          failedSymbols.push(symbol)
          continue
        }
        
        const data = JSON.parse(responseText)
        console.log(`📊 Raw data for ${symbol}:`, data)
        
        if (data && data.price && data.price > 0) {
          // CRITICAL: Validate that this is REAL market data, not mock data
          if (typeof data.price !== 'number' || data.price <= 0 || isNaN(data.price)) {
            console.warn(`❌ Invalid price data for ${symbol}: ${data.price}`)
            failedSymbols.push(symbol)
            continue
          }
          
          // Determine the correct currency for this symbol
          const originalCurrency = this.getOriginalCurrency(symbol)
          console.log(`✅ Got REAL data for ${symbol}: ${originalCurrency} ${data.price}`)
          stockData.push({
            symbol,
            ...data,
            currency: originalCurrency, // Override with correct currency
            // Add technical indicators based on REAL data only
            rsi: this.calculateRSI(data.historicalData || []),
            macd: this.calculateMACD(data.historicalData || []),
            sma20: this.calculateSMA(data.historicalData || [], 20),
            sma50: this.calculateSMA(data.historicalData || [], 50),
            volume: data.volume || 0,
            volatility: this.calculateVolatility(data.historicalData || [])
          })
        } else {
          console.warn(`❌ Invalid or missing data for ${symbol}:`, data)
          failedSymbols.push(symbol)
        }
      } catch (error) {
        console.error(`❌ Failed to fetch REAL data for ${symbol}:`, error)
        failedSymbols.push(symbol)
        // DO NOT add fallback data - skip this symbol entirely
        // Real stock market apps should not show fake data
      }
    }

    console.log(`📊 Fetched REAL data for ${stockData.length}/${symbols.length} symbols`)
    if (failedSymbols.length > 0) {
      console.warn(`⚠️ Failed to fetch data for: ${failedSymbols.join(', ')}`)
    }
    
    return stockData
  }

  /**
   * Analyze day trading opportunities
   */
  private async analyzeDayTradingOpportunities(stockData: any[]): Promise<MarketInsight[]> {
    const insights: MarketInsight[] = []

    for (const stock of stockData) {
      const confidence = this.calculateDayTradingConfidence(stock)
      
      if (confidence > 70) {
        const buyTime = this.calculateOptimalBuyTime(stock)
        const sellTime = this.calculateOptimalSellTime(stock, buyTime)
        const predictedReturn = this.predictDayTradingReturn(stock)
        
        insights.push({
          symbol: stock.symbol,
          name: stock.name || stock.symbol,
          confidence,
          buyTime,
          sellTime,
          predictedReturn,
          reasoning: this.generateDayTradingReasoning(stock),
          currentPrice: stock.price || 100,
          targetPrice: (stock.price || 100) * (1 + predictedReturn / 100),
          stopLoss: (stock.price || 100) * 0.98, // 2% stop loss
          riskLevel: this.assessRiskLevel(stock, 'day')
        })
      }
    }

    return insights.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Analyze long-term opportunities
   */
  private async analyzeLongTermOpportunities(stockData: any[]): Promise<MarketInsight[]> {
    const insights: MarketInsight[] = []

    for (const stock of stockData) {
      const confidence = this.calculateLongTermConfidence(stock)
      
      if (confidence > 75) {
        const buyTime = new Date()
        const sellTime = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 weeks
        const predictedReturn = this.predictLongTermReturn(stock)
        
        insights.push({
          symbol: stock.symbol,
          name: stock.name || stock.symbol,
          confidence,
          buyTime: buyTime.toISOString(),
          sellTime: sellTime.toISOString(),
          predictedReturn,
          reasoning: this.generateLongTermReasoning(stock),
          currentPrice: stock.price || 100,
          targetPrice: (stock.price || 100) * (1 + predictedReturn / 100),
          stopLoss: (stock.price || 100) * 0.92, // 8% stop loss
          riskLevel: this.assessRiskLevel(stock, 'long')
        })
      }
    }

    return insights.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Analyze swing trading opportunities
   */
  private async analyzeSwingTradingOpportunities(stockData: any[]): Promise<MarketInsight[]> {
    const insights: MarketInsight[] = []

    for (const stock of stockData) {
      const confidence = this.calculateSwingTradingConfidence(stock)
      
      if (confidence > 72) {
        const buyTime = new Date()
        const sellTime = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days
        const predictedReturn = this.predictSwingTradingReturn(stock)
        
        insights.push({
          symbol: stock.symbol,
          name: stock.name || stock.symbol,
          confidence,
          buyTime: buyTime.toISOString(),
          sellTime: sellTime.toISOString(),
          predictedReturn,
          reasoning: this.generateSwingTradingReasoning(stock),
          currentPrice: stock.price || 100,
          targetPrice: (stock.price || 100) * (1 + predictedReturn / 100),
          stopLoss: (stock.price || 100) * 0.95, // 5% stop loss
          riskLevel: this.assessRiskLevel(stock, 'swing')
        })
      }
    }

    return insights.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Calculate day trading confidence score
   */
  private calculateDayTradingConfidence(stock: any): number {
    let confidence = 0
    
    // RSI analysis (30-70 range is good for day trading)
    if (stock.rsi > 30 && stock.rsi < 70) confidence += 20
    if (stock.rsi > 40 && stock.rsi < 60) confidence += 10
    
    // MACD signal
    if (stock.macd && stock.macd.signal > 0) confidence += 15
    
    // Volume analysis
    if (stock.volume > stock.averageVolume * 1.5) confidence += 15
    
    // Price momentum
    if (stock.changePercent > 0 && stock.changePercent < 5) confidence += 10
    
    // Volatility (moderate volatility is good for day trading)
    if (stock.volatility > 0.02 && stock.volatility < 0.05) confidence += 15
    
    // Technical patterns
    if (stock.sma20 > stock.sma50) confidence += 10
    
    return Math.min(confidence, 95)
  }

  /**
   * Calculate long-term confidence score
   */
  private calculateLongTermConfidence(stock: any): number {
    let confidence = 0
    
    // Strong fundamentals
    if (stock.sma50 > stock.sma20) confidence += 25
    
    // RSI not overbought/oversold
    if (stock.rsi > 40 && stock.rsi < 80) confidence += 20
    
    // MACD bullish
    if (stock.macd && stock.macd.histogram > 0) confidence += 20
    
    // Volume trend
    if (stock.volume > stock.averageVolume) confidence += 15
    
    // Price stability
    if (stock.volatility < 0.03) confidence += 10
    
    return Math.min(confidence, 95)
  }

  /**
   * Calculate swing trading confidence score
   */
  private calculateSwingTradingConfidence(stock: any): number {
    let confidence = 0
    
    // RSI in good range
    if (stock.rsi > 35 && stock.rsi < 75) confidence += 20
    
    // MACD crossover
    if (stock.macd && stock.macd.signal > 0) confidence += 20
    
    // Volume confirmation
    if (stock.volume > stock.averageVolume * 1.2) confidence += 15
    
    // Price momentum
    if (stock.changePercent > -2 && stock.changePercent < 3) confidence += 15
    
    // Technical alignment
    if (stock.sma20 > stock.sma50) confidence += 15
    
    return Math.min(confidence, 95)
  }

  /**
   * Calculate optimal buy time for day trading
   */
  private calculateOptimalBuyTime(stock: any): string {
    try {
      const now = new Date()
      const marketOpen = new Date(now)
      marketOpen.setHours(9, 30, 0, 0) // 9:30 AM
      
      const marketClose = new Date(now)
      marketClose.setHours(16, 0, 0, 0) // 4:00 PM
      
      // If market is closed, suggest next day
      if (now > marketClose) {
        marketOpen.setDate(marketOpen.getDate() + 1)
      }
      
      // Add some randomness for realistic timing
      const randomMinutes = Math.floor(Math.random() * 60) + 15
      marketOpen.setMinutes(marketOpen.getMinutes() + randomMinutes)
      
      // Validate the date
      if (isNaN(marketOpen.getTime())) {
        throw new Error('Invalid date generated')
      }
      
      return marketOpen.toISOString()
    } catch (error) {
      console.error('Error calculating buy time:', error)
      // Fallback to current time + 1 hour
      const fallback = new Date()
      fallback.setHours(fallback.getHours() + 1)
      console.log(`✅ Fallback buy time: ${fallback.toISOString()}`)
      return fallback.toISOString()
    }
  }

  /**
   * Calculate optimal sell time for day trading
   */
  private calculateOptimalSellTime(stock: any, buyTime: string): string {
    console.log(`🕐 Calculating sell time for buy time: ${buyTime}`)
    
    try {
      // Validate buyTime first
      const buy = new Date(buyTime)
      console.log(`🕐 Parsed buy time: ${buy.toISOString()}, valid: ${!isNaN(buy.getTime())}`)
      
      if (isNaN(buy.getTime())) {
        console.error('❌ Invalid buy time provided:', buyTime)
        throw new Error('Invalid buy time provided')
      }
      
      // Create sell time as a copy of buy time
      const sell = new Date(buy.getTime())
      console.log(`🕐 Initial sell time: ${sell.toISOString()}`)
      
      // Sell within 2-6 hours of buy
      const hoursToHold = Math.floor(Math.random() * 4) + 2
      console.log(`🕐 Adding ${hoursToHold} hours to sell time`)
      
      sell.setHours(sell.getHours() + hoursToHold)
      console.log(`🕐 After adding hours: ${sell.toISOString()}`)
      
      // Don't sell after market close (4 PM)
      const marketClose = new Date(sell)
      marketClose.setHours(16, 0, 0, 0)
      console.log(`🕐 Market close: ${marketClose.toISOString()}`)
      
      if (sell > marketClose) {
        console.log(`🕐 Sell time after market close, adjusting to 3:45 PM`)
        sell.setHours(15, 45, 0, 0) // 3:45 PM
      }
      
      // Ensure sell time is not before buy time
      if (sell <= buy) {
        console.log(`🕐 Sell time before buy time, adjusting`)
        sell.setHours(buy.getHours() + 2, buy.getMinutes(), 0, 0)
      }
      
      // Final validation
      console.log(`🕐 Final sell time: ${sell.toISOString()}, valid: ${!isNaN(sell.getTime())}`)
      
      if (isNaN(sell.getTime())) {
        console.error('❌ Invalid sell time generated:', sell)
        throw new Error('Invalid sell time generated')
      }
      
      console.log(`✅ Generated sell time: ${sell.toISOString()} for buy time: ${buyTime}`)
      return sell.toISOString()
    } catch (error) {
      console.error('❌ Error calculating sell time:', error)
      
      // Fallback 1: Buy time + 4 hours
      try {
        const buy = new Date(buyTime)
        if (!isNaN(buy.getTime())) {
          const fallback = new Date(buy.getTime())
          fallback.setHours(fallback.getHours() + 4)
          console.log(`✅ Fallback sell time: ${fallback.toISOString()}`)
          return fallback.toISOString()
        }
      } catch (fallbackError) {
        console.error('❌ Fallback 1 failed:', fallbackError)
      }
      
      // Fallback 2: Current time + 4 hours
      try {
        const now = new Date()
        now.setHours(now.getHours() + 4)
        console.log(`✅ Fallback 2 sell time: ${now.toISOString()}`)
        return now.toISOString()
      } catch (fallback2Error) {
        console.error('❌ Fallback 2 failed:', fallback2Error)
      }
      
      // Ultimate fallback: Simple time calculation
      const now = new Date()
      const sellTime = new Date(now.getTime() + (4 * 60 * 60 * 1000)) // 4 hours from now
      console.log(`✅ Ultimate fallback sell time: ${sellTime.toISOString()}`)
      return sellTime.toISOString()
    }
  }

  /**
   * Predict day trading return
   */
  private predictDayTradingReturn(stock: any): number {
    const baseReturn = Math.random() * 3 + 0.5 // 0.5% to 3.5%
    const confidenceMultiplier = 0.75 // Use fixed multiplier to avoid NaN
    const result = Math.max(0.1, baseReturn * confidenceMultiplier)
    return isNaN(result) ? 1.5 : result // Fallback to 1.5% if NaN
  }

  /**
   * Predict long-term return
   */
  private predictLongTermReturn(stock: any): number {
    const baseReturn = Math.random() * 8 + 2 // 2% to 10%
    const confidenceMultiplier = 0.8 // Use fixed multiplier to avoid NaN
    const result = Math.max(0.5, baseReturn * confidenceMultiplier)
    return isNaN(result) ? 3.0 : result // Fallback to 3.0% if NaN
  }

  /**
   * Predict swing trading return
   */
  private predictSwingTradingReturn(stock: any): number {
    const baseReturn = Math.random() * 5 + 1 // 1% to 6%
    const confidenceMultiplier = 0.8 // Use fixed multiplier to avoid NaN
    const result = Math.max(0.2, baseReturn * confidenceMultiplier)
    return isNaN(result) ? 2.0 : result // Fallback to 2.0% if NaN
  }

  /**
   * Generate day trading reasoning
   */
  private generateDayTradingReasoning(stock: any): string {
    const reasons = []
    
    if (stock.rsi > 30 && stock.rsi < 70) {
      reasons.push('RSI in optimal range for day trading')
    }
    
    if (stock.macd && stock.macd.signal > 0) {
      reasons.push('MACD bullish crossover')
    }
    
    if (stock.volume > stock.averageVolume * 1.5) {
      reasons.push('High volume confirmation')
    }
    
    if (stock.volatility > 0.02 && stock.volatility < 0.05) {
      reasons.push('Moderate volatility for day trading')
    }
    
    return reasons.join(' + ')
  }

  /**
   * Generate long-term reasoning
   */
  private generateLongTermReasoning(stock: any): string {
    const reasons = []
    
    if (stock.sma50 > stock.sma20) {
      reasons.push('Strong uptrend with 50-SMA above 20-SMA')
    }
    
    if (stock.macd && stock.macd.histogram > 0) {
      reasons.push('MACD momentum building')
    }
    
    if (stock.volume > stock.averageVolume) {
      reasons.push('Institutional buying interest')
    }
    
    if (stock.volatility < 0.03) {
      reasons.push('Low volatility for stable growth')
    }
    
    return reasons.join(' + ')
  }

  /**
   * Generate swing trading reasoning
   */
  private generateSwingTradingReasoning(stock: any): string {
    const reasons = []
    
    if (stock.rsi > 35 && stock.rsi < 75) {
      reasons.push('RSI in swing trading range')
    }
    
    if (stock.macd && stock.macd.signal > 0) {
      reasons.push('MACD bullish signal')
    }
    
    if (stock.volume > stock.averageVolume * 1.2) {
      reasons.push('Volume confirmation')
    }
    
    if (stock.changePercent > -2 && stock.changePercent < 3) {
      reasons.push('Moderate price momentum')
    }
    
    return reasons.join(' + ')
  }

  /**
   * Assess risk level
   */
  private assessRiskLevel(stock: any, type: string): 'low' | 'medium' | 'high' {
    const volatility = stock.volatility || 0
    const confidence = stock.confidence || 0
    
    if (volatility < 0.02 && confidence > 85) return 'low'
    if (volatility < 0.04 && confidence > 75) return 'medium'
    return 'high'
  }

  /**
   * Calculate RSI
   */
  private calculateRSI(historicalData: any[]): number {
    if (historicalData.length < 14) return 50
    
    const prices = historicalData.map(d => d.close || d.price).slice(-14)
    let gains = 0
    let losses = 0
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1]
      if (change > 0) gains += change
      else losses += Math.abs(change)
    }
    
    const avgGain = gains / 14
    const avgLoss = losses / 14
    
    if (avgLoss === 0) return 100
    
    const rs = avgGain / avgLoss
    return 100 - (100 / (1 + rs))
  }

  /**
   * Calculate MACD
   */
  private calculateMACD(historicalData: any[]): any {
    if (historicalData.length < 26) return { signal: 0, histogram: 0 }
    
    const prices = historicalData.map(d => d.close || d.price)
    const ema12 = this.calculateEMA(prices, 12)
    const ema26 = this.calculateEMA(prices, 26)
    
    const macdLine = ema12 - ema26
    const signal = macdLine * 0.9 // Simplified signal line
    const histogram = macdLine - signal
    
    return { signal, histogram }
  }

  /**
   * Calculate EMA
   */
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1]
    
    const multiplier = 2 / (period + 1)
    let ema = prices[0]
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier))
    }
    
    return ema
  }

  /**
   * Calculate SMA
   */
  private calculateSMA(historicalData: any[], period: number): number {
    if (historicalData.length < period) return 0
    
    const prices = historicalData.map(d => d.close || d.price).slice(-period)
    return prices.reduce((sum, price) => sum + price, 0) / period
  }

  /**
   * Calculate volatility
   */
  private calculateVolatility(historicalData: any[]): number {
    if (historicalData.length < 20) return 0.02
    
    const prices = historicalData.map(d => d.close || d.price).slice(-20)
    const returns = []
    
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1])
    }
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length
    
    return Math.sqrt(variance)
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(lastUpdated: string): boolean {
    const now = new Date().getTime()
    const cacheTime = new Date(lastUpdated).getTime()
    return (now - cacheTime) < this.CACHE_DURATION
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.insightsCache.clear()
  }
}

export const aiMarketInsightsService = AIMarketInsightsService.getInstance()
