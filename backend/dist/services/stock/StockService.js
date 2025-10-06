"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../../config");
const logger_1 = require("../../utils/logger");
class StockService {
    constructor(cacheService) {
        this.apiClients = new Map();
        this.isInitialized = false;
        this.cacheService = cacheService;
    }
    async initialize() {
        try {
            logger_1.logger.info('📈 Initializing Stock Service...');
            await this.initializeAPIClients();
            await this.testConnections();
            this.isInitialized = true;
            logger_1.logger.info('✅ Stock Service initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('❌ Failed to initialize Stock Service:', error);
            throw error;
        }
    }
    async initializeAPIClients() {
        this.apiClients.set('yahoo', {
            baseURL: 'https://query1.finance.yahoo.com/v8/finance/chart',
            timeout: config_1.config.STOCK.TIMEOUT,
            retries: config_1.config.STOCK.RETRY_ATTEMPTS
        });
        if (config_1.config.API_KEYS.ALPHA_VANTAGE) {
            this.apiClients.set('alpha_vantage', {
                baseURL: 'https://www.alphavantage.co/query',
                apiKey: config_1.config.API_KEYS.ALPHA_VANTAGE,
                timeout: config_1.config.STOCK.TIMEOUT,
                retries: config_1.config.STOCK.RETRY_ATTEMPTS
            });
        }
        if (config_1.config.API_KEYS.POLYGON) {
            this.apiClients.set('polygon', {
                baseURL: 'https://api.polygon.io/v2',
                apiKey: config_1.config.API_KEYS.POLYGON,
                timeout: config_1.config.STOCK.TIMEOUT,
                retries: config_1.config.STOCK.RETRY_ATTEMPTS
            });
        }
        if (config_1.config.API_KEYS.IEX_CLOUD) {
            this.apiClients.set('iex', {
                baseURL: 'https://cloud.iexapis.com/stable',
                apiKey: config_1.config.API_KEYS.IEX_CLOUD,
                timeout: config_1.config.STOCK.TIMEOUT,
                retries: config_1.config.STOCK.RETRY_ATTEMPTS
            });
        }
    }
    async testConnections() {
        const testSymbol = 'AAPL';
        for (const [name, client] of this.apiClients) {
            try {
                await this.getStockData(testSymbol, name);
                logger_1.logger.info(`✅ ${name} API connection successful`);
            }
            catch (error) {
                logger_1.logger.warn(`⚠️ ${name} API connection failed:`, error.message);
            }
        }
    }
    async getStockData(symbol, source) {
        if (!this.isInitialized) {
            throw new Error('Stock Service not initialized');
        }
        const cacheKey = `stock_${symbol}_${source || 'default'}`;
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }
        const stockData = await this.fetchStockData(symbol, source);
        await this.cacheService.set(cacheKey, stockData, config_1.config.STOCK.CACHE_TTL);
        return stockData;
    }
    async getMultipleStocks(symbols) {
        if (symbols.length > config_1.config.STOCK.MAX_SYMBOLS_PER_REQUEST) {
            throw new Error(`Too many symbols requested. Maximum: ${config_1.config.STOCK.MAX_SYMBOLS_PER_REQUEST}`);
        }
        const promises = symbols.map(symbol => this.getStockData(symbol));
        const results = await Promise.allSettled(promises);
        return results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);
    }
    async getHistoricalData(symbol, range = '6mo') {
        const cacheKey = `historical_${symbol}_${range}`;
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const data = await this.fetchHistoricalData(symbol, range);
            await this.cacheService.set(cacheKey, data, config_1.config.STOCK.CACHE_TTL);
            return data;
        }
        catch (error) {
            logger_1.logger.error(`Failed to fetch historical data for ${symbol}:`, error);
            throw error;
        }
    }
    async fetchStockData(symbol, source) {
        const sources = source ? [source] : ['yahoo', 'alpha_vantage', 'polygon', 'iex'];
        for (const sourceName of sources) {
            try {
                const client = this.apiClients.get(sourceName);
                if (!client)
                    continue;
                switch (sourceName) {
                    case 'yahoo':
                        return await this.fetchFromYahoo(symbol, client);
                    case 'alpha_vantage':
                        return await this.fetchFromAlphaVantage(symbol, client);
                    case 'polygon':
                        return await this.fetchFromPolygon(symbol, client);
                    case 'iex':
                        return await this.fetchFromIEX(symbol, client);
                }
            }
            catch (error) {
                logger_1.logger.warn(`Failed to fetch from ${sourceName}:`, error.message);
                continue;
            }
        }
        throw new Error(`Failed to fetch data for ${symbol} from all sources`);
    }
    async fetchFromYahoo(symbol, client) {
        const response = await axios_1.default.get(`${client.baseURL}/${symbol}`, {
            timeout: client.timeout,
            params: {
                interval: '1d',
                range: '1d'
            }
        });
        const data = response.data.chart.result[0];
        const meta = data.meta;
        const quote = data.indicators.quote[0];
        const currentPrice = meta.regularMarketPrice;
        const previousClose = meta.previousClose;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;
        return {
            symbol: meta.symbol,
            name: meta.longName || meta.shortName,
            price: currentPrice,
            change,
            changePercent,
            volume: meta.regularMarketVolume,
            marketCap: meta.marketCap,
            currency: meta.currency,
            exchange: meta.exchangeName,
            market: this.inferMarketFromExchange(meta.exchangeName),
            timestamp: new Date(meta.regularMarketTime * 1000),
            source: 'yahoo'
        };
    }
    async fetchFromAlphaVantage(symbol, client) {
        const response = await axios_1.default.get(client.baseURL, {
            timeout: client.timeout,
            params: {
                function: 'GLOBAL_QUOTE',
                symbol,
                apikey: client.apiKey
            }
        });
        const data = response.data['Global Quote'];
        return {
            symbol: data['01. symbol'],
            name: data['01. symbol'],
            price: parseFloat(data['05. price']),
            change: parseFloat(data['09. change']),
            changePercent: parseFloat(data['10. change percent'].replace('%', '')),
            volume: parseInt(data['06. volume']),
            currency: 'USD',
            exchange: 'NYSE',
            market: 'US',
            timestamp: new Date(data['07. latest trading day']),
            source: 'alpha_vantage'
        };
    }
    async fetchFromPolygon(symbol, client) {
        const response = await axios_1.default.get(`${client.baseURL}/aggs/ticker/${symbol}/prev`, {
            timeout: client.timeout,
            params: {
                apikey: client.apiKey
            }
        });
        const data = response.data.results[0];
        return {
            symbol: data.T,
            name: data.T,
            price: data.c,
            change: data.c - data.o,
            changePercent: ((data.c - data.o) / data.o) * 100,
            volume: data.v,
            currency: 'USD',
            exchange: 'NYSE',
            market: 'US',
            timestamp: new Date(data.t),
            source: 'polygon'
        };
    }
    async fetchFromIEX(symbol, client) {
        const response = await axios_1.default.get(`${client.baseURL}/stock/${symbol}/quote`, {
            timeout: client.timeout,
            params: {
                token: client.apiKey
            }
        });
        const data = response.data;
        return {
            symbol: data.symbol,
            name: data.companyName,
            price: data.latestPrice,
            change: data.change,
            changePercent: data.changePercent * 100,
            volume: data.volume,
            marketCap: data.marketCap,
            pe: data.peRatio,
            currency: 'USD',
            exchange: data.primaryExchange,
            market: 'US',
            timestamp: new Date(data.latestUpdate),
            source: 'iex'
        };
    }
    async fetchHistoricalData(symbol, range) {
        const client = this.apiClients.get('yahoo');
        if (!client) {
            throw new Error('Yahoo Finance client not available');
        }
        const response = await axios_1.default.get(`${client.baseURL}/${symbol}`, {
            timeout: client.timeout,
            params: {
                interval: '1d',
                range: range
            }
        });
        const data = response.data.chart.result[0];
        const timestamps = data.timestamp;
        const quotes = data.indicators.quote[0];
        const historicalData = [];
        for (let i = 0; i < timestamps.length; i++) {
            historicalData.push({
                time: new Date(timestamps[i] * 1000).toISOString(),
                open: quotes.open[i],
                high: quotes.high[i],
                low: quotes.low[i],
                close: quotes.close[i],
                volume: quotes.volume[i]
            });
        }
        return historicalData;
    }
    inferMarketFromExchange(exchange) {
        const exchangeMap = {
            'NASDAQ': 'US',
            'NYSE': 'US',
            'NSE': 'IN',
            'BSE': 'IN',
            'LSE': 'GB',
            'TSE': 'JP',
            'ASX': 'AU'
        };
        return exchangeMap[exchange] || 'US';
    }
    async searchStocks(query) {
        const cacheKey = `search_${query}`;
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }
        try {
            const response = await axios_1.default.get('https://query1.finance.yahoo.com/v1/finance/search', {
                params: { q: query },
                timeout: config_1.config.STOCK.TIMEOUT
            });
            const results = response.data.quotes.slice(0, 10);
            const stockData = [];
            for (const result of results) {
                try {
                    const data = await this.getStockData(result.symbol);
                    stockData.push(data);
                }
                catch (error) {
                    continue;
                }
            }
            await this.cacheService.set(cacheKey, stockData, 300);
            return stockData;
        }
        catch (error) {
            logger_1.logger.error('Stock search failed:', error);
            return [];
        }
    }
    async getMarketStatus() {
        const markets = ['US', 'IN', 'GB', 'JP', 'AU'];
        const status = {};
        for (const market of markets) {
            try {
                const testSymbol = this.getTestSymbolForMarket(market);
                await this.getStockData(testSymbol);
                status[market] = true;
            }
            catch (error) {
                status[market] = false;
            }
        }
        return status;
    }
    getTestSymbolForMarket(market) {
        const testSymbols = {
            'US': 'AAPL',
            'IN': 'RELIANCE.NS',
            'GB': 'VOD.L',
            'JP': '7203.T',
            'AU': 'CBA.AX'
        };
        return testSymbols[market] || 'AAPL';
    }
    getStatus() {
        const availableSources = Array.from(this.apiClients.keys()).join(', ');
        return `Stock Service initialized with sources: ${availableSources}`;
    }
    async close() {
        logger_1.logger.info('📈 Closing Stock Service...');
        this.isInitialized = false;
        logger_1.logger.info('✅ Stock Service closed');
    }
}
exports.StockService = StockService;
//# sourceMappingURL=StockService.js.map