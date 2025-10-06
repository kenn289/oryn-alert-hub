import { CacheService } from '../cache/CacheService';
export interface StockData {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    marketCap?: number;
    pe?: number;
    currency: string;
    exchange: string;
    market: string;
    timestamp: Date;
    source: string;
}
export interface HistoricalData {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
export interface StockQuote {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    timestamp: Date;
}
export declare class StockService {
    private cacheService;
    private apiClients;
    private isInitialized;
    constructor(cacheService: CacheService);
    initialize(): Promise<void>;
    private initializeAPIClients;
    private testConnections;
    getStockData(symbol: string, source?: string): Promise<StockData>;
    getMultipleStocks(symbols: string[]): Promise<StockData[]>;
    getHistoricalData(symbol: string, range?: string): Promise<HistoricalData[]>;
    private fetchStockData;
    private fetchFromYahoo;
    private fetchFromAlphaVantage;
    private fetchFromPolygon;
    private fetchFromIEX;
    private fetchHistoricalData;
    private inferMarketFromExchange;
    searchStocks(query: string): Promise<StockData[]>;
    getMarketStatus(): Promise<{
        [market: string]: boolean;
    }>;
    private getTestSymbolForMarket;
    getStatus(): string;
    close(): Promise<void>;
}
//# sourceMappingURL=StockService.d.ts.map