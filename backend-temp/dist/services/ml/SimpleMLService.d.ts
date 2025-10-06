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
export declare class SimpleMLService {
    private cacheService;
    private stockService;
    private isInitialized;
    constructor(cacheService: CacheService, stockService: StockService);
    initialize(): Promise<void>;
    generatePredictions(symbols: string[]): Promise<MLPrediction[]>;
    private generatePrediction;
    private calculateTechnicalIndicators;
    private calculateRSI;
    private calculateMACD;
    private calculateEMA;
    private calculateSMA;
    private determineTrend;
    private runSimplePrediction;
    private calculateConfidence;
    private generateReasoning;
    private determineMarketSentiment;
    private identifyRiskFactors;
    private generateRecommendation;
    private createFallbackPrediction;
    getModelStatus(): string;
    close(): Promise<void>;
}
//# sourceMappingURL=SimpleMLService.d.ts.map