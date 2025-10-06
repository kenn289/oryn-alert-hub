import * as tf from '@tensorflow/tfjs-node';
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
export interface MLModel {
    name: string;
    version: string;
    accuracy: number;
    lastTrained: Date;
    isLoaded: boolean;
    model?: tf.LayersModel;
}
export declare class MLService {
    private models;
    private cacheService;
    private stockService;
    private isInitialized;
    constructor(cacheService: CacheService, stockService: StockService);
    initialize(): Promise<void>;
    private loadModels;
    private loadModel;
    generatePredictions(symbols: string[]): Promise<MLPrediction[]>;
    private generatePrediction;
    private calculateTechnicalIndicators;
    private calculateRSI;
    private calculateMACD;
    private calculateEMA;
    private calculateSMA;
    private determineTrend;
    private runMLPrediction;
    private calculateConfidence;
    private generateReasoning;
    private determineMarketSentiment;
    private identifyRiskFactors;
    private generateRecommendation;
    private createFallbackPrediction;
    private startBackgroundTraining;
    private retrainModels;
    getModelStatus(): string;
    close(): Promise<void>;
}
//# sourceMappingURL=MLService.d.ts.map