"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleMLService = void 0;
const config_1 = require("../../config");
const logger_1 = require("../../utils/logger");
class SimpleMLService {
    constructor(cacheService, stockService) {
        this.isInitialized = false;
        this.cacheService = cacheService;
        this.stockService = stockService;
    }
    async initialize() {
        try {
            logger_1.logger.info('🤖 Initializing Simple ML Service...');
            this.isInitialized = true;
            logger_1.logger.info('✅ Simple ML Service initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to initialize Simple ML Service:', error);
            throw error;
        }
    }
    async generatePredictions(symbols) {
        if (!this.isInitialized) {
            throw new Error('ML Service not initialized');
        }
        const predictions = [];
        for (const symbol of symbols) {
            try {
                const cacheKey = `ml_prediction_${symbol}`;
                const cached = await this.cacheService.get(cacheKey);
                if (cached) {
                    predictions.push(cached);
                    continue;
                }
                const prediction = await this.generatePrediction(symbol);
                predictions.push(prediction);
                await this.cacheService.set(cacheKey, prediction, config_1.config.ML.PREDICTION_CACHE_TTL);
            }
            catch (error) {
                logger_1.logger.error(`Failed to generate prediction for ${symbol}:`, error);
                predictions.push(this.createFallbackPrediction(symbol));
            }
        }
        return predictions;
    }
    async generatePrediction(symbol) {
        try {
            const historicalData = await this.stockService.getHistoricalData(symbol, '6mo');
            if (!historicalData || historicalData.length < 30) {
                throw new Error('Insufficient historical data');
            }
            const indicators = this.calculateTechnicalIndicators(historicalData);
            const currentPrice = historicalData[historicalData.length - 1].close;
            const prediction = this.runSimplePrediction(historicalData, indicators);
            const confidence = this.calculateConfidence(indicators, prediction);
            const reasoning = this.generateReasoning(indicators, prediction, confidence);
            const marketSentiment = this.determineMarketSentiment(indicators, prediction);
            const riskFactors = this.identifyRiskFactors(indicators, prediction);
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
        }
        catch (error) {
            logger_1.logger.error(`Error generating prediction for ${symbol}:`, error);
            throw error;
        }
    }
    calculateTechnicalIndicators(data) {
        const closes = data.map(d => d.close);
        const highs = data.map(d => d.high);
        const lows = data.map(d => d.low);
        const volumes = data.map(d => d.volume);
        const rsi = this.calculateRSI(closes);
        const macd = this.calculateMACD(closes);
        const sma20 = this.calculateSMA(closes, 20);
        const sma50 = this.calculateSMA(closes, 50);
        const sma200 = this.calculateSMA(closes, 200);
        const support = Math.min(...lows.slice(-20));
        const resistance = Math.max(...highs.slice(-20));
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
    calculateRSI(prices, period = 14) {
        if (prices.length < period + 1)
            return 50;
        let gains = 0;
        let losses = 0;
        for (let i = 1; i <= period; i++) {
            const change = prices[i] - prices[i - 1];
            if (change > 0)
                gains += change;
            else
                losses -= change;
        }
        const avgGain = gains / period;
        const avgLoss = losses / period;
        if (avgLoss === 0)
            return 100;
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }
    calculateMACD(prices) {
        const ema12 = this.calculateEMA(prices, 12);
        const ema26 = this.calculateEMA(prices, 26);
        return ema12 - ema26;
    }
    calculateEMA(prices, period) {
        if (prices.length < period)
            return prices[prices.length - 1];
        const multiplier = 2 / (period + 1);
        let ema = prices[0];
        for (let i = 1; i < prices.length; i++) {
            ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
        }
        return ema;
    }
    calculateSMA(prices, period) {
        if (prices.length < period)
            return prices[prices.length - 1];
        const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
        return sum / period;
    }
    determineTrend(sma20, sma50, sma200) {
        if (sma20 > sma50 && sma50 > sma200)
            return 'up';
        if (sma20 < sma50 && sma50 < sma200)
            return 'down';
        return 'sideways';
    }
    runSimplePrediction(data, indicators) {
        const currentPrice = data[data.length - 1].close;
        const trend = indicators.trend;
        const rsi = indicators.rsi;
        const macd = indicators.macd;
        let priceChange = 0;
        if (trend === 'up' && rsi < 70) {
            priceChange = 0.02;
        }
        else if (trend === 'down' && rsi > 30) {
            priceChange = -0.02;
        }
        else {
            priceChange = 0.01;
        }
        const predictedPrice = currentPrice * (1 + priceChange);
        return {
            price: predictedPrice,
            timeframe: '3-5 days'
        };
    }
    calculateConfidence(indicators, prediction) {
        let confidence = 0.5;
        if (indicators.rsi < 30 || indicators.rsi > 70) {
            confidence += 0.2;
        }
        if (indicators.trend === 'up' || indicators.trend === 'down') {
            confidence += 0.1;
        }
        if (Math.abs(indicators.macd) > 0.1) {
            confidence += 0.1;
        }
        return Math.min(0.95, Math.max(0.1, confidence));
    }
    generateReasoning(indicators, prediction, confidence) {
        const reasons = [];
        if (indicators.trend === 'up') {
            reasons.push('Strong upward trend detected');
        }
        else if (indicators.trend === 'down') {
            reasons.push('Downward trend identified');
        }
        if (indicators.rsi < 30) {
            reasons.push('Oversold conditions suggest potential bounce');
        }
        else if (indicators.rsi > 70) {
            reasons.push('Overbought conditions may lead to correction');
        }
        if (Math.abs(indicators.macd) > 0.1) {
            reasons.push('Strong momentum indicated by MACD');
        }
        return reasons.join('. ') || 'Technical analysis suggests moderate movement';
    }
    determineMarketSentiment(indicators, prediction) {
        if (indicators.trend === 'up' && indicators.rsi < 70)
            return 'bullish';
        if (indicators.trend === 'down' && indicators.rsi > 30)
            return 'bearish';
        return 'neutral';
    }
    identifyRiskFactors(indicators, prediction) {
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
    generateRecommendation(indicators, prediction, confidence) {
        const currentPrice = prediction.price / 1.02;
        const targetPrice = prediction.price;
        const stopLoss = currentPrice * 0.95;
        let action = 'hold';
        let riskLevel = 'medium';
        if (indicators.trend === 'up' && confidence > 0.7) {
            action = 'buy';
            riskLevel = confidence > 0.8 ? 'low' : 'medium';
        }
        else if (indicators.trend === 'down' && confidence > 0.7) {
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
    createFallbackPrediction(symbol) {
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
    getModelStatus() {
        return 'Simple ML Service - Heuristic-based predictions';
    }
    async close() {
        logger_1.logger.info('🤖 Closing Simple ML Service...');
        this.isInitialized = false;
        logger_1.logger.info('✅ Simple ML Service closed');
    }
}
exports.SimpleMLService = SimpleMLService;
//# sourceMappingURL=SimpleMLService.js.map