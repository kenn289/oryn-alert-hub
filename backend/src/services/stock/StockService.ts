import axios from 'axios';
import { config } from '../../config';
import { logger } from '../../utils/logger';
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

export class StockService {
  private cacheService: CacheService;
  private apiClients: Map<string, any> = new Map();
  private isInitialized = false;

  constructor(cacheService: CacheService) {
    this.cacheService = cacheService;
  }

  public async initialize(): Promise<void> {
    try {
      logger.info('📈 Initializing Stock Service...');
      
      // Initialize API clients
      await this.initializeAPIClients();
      
      // Test connections
      await this.testConnections();
      
      this.isInitialized = true;
      logger.info('✅ Stock Service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize Stock Service:', error);
      throw error;
    }
  }

  private async initializeAPIClients(): Promise<void> {
    // Yahoo Finance client
    this.apiClients.set('yahoo', {
      baseURL: 'https://query1.finance.yahoo.com/v8/finance/chart',
      timeout: config.STOCK.TIMEOUT,
      retries: config.STOCK.RETRY_ATTEMPTS
    });

    // Alpha Vantage client
    if (config.API_KEYS.ALPHA_VANTAGE) {
      this.apiClients.set('alpha_vantage', {
        baseURL: 'https://www.alphavantage.co/query',
        apiKey: config.API_KEYS.ALPHA_VANTAGE,
        timeout: config.STOCK.TIMEOUT,
        retries: config.STOCK.RETRY_ATTEMPTS
      });
    }

    // Polygon client
    if (config.API_KEYS.POLYGON) {
      this.apiClients.set('polygon', {
        baseURL: 'https://api.polygon.io/v2',
        apiKey: config.API_KEYS.POLYGON,
        timeout: config.STOCK.TIMEOUT,
        retries: config.STOCK.RETRY_ATTEMPTS
      });
    }

    // IEX Cloud client
    if (config.API_KEYS.IEX_CLOUD) {
      this.apiClients.set('iex', {
        baseURL: 'https://cloud.iexapis.com/stable',
        apiKey: config.API_KEYS.IEX_CLOUD,
        timeout: config.STOCK.TIMEOUT,
        retries: config.STOCK.RETRY_ATTEMPTS
      });
    }
  }

  private async testConnections(): Promise<void> {
    const testSymbol = 'AAPL';
    
    for (const [name, client] of this.apiClients) {
      try {
        await this.getStockData(testSymbol, name);
        logger.info(`✅ ${name} API connection successful`);
      } catch (error) {
        logger.warn(`⚠️ ${name} API connection failed:`, error.message);
      }
    }
  }

  public async getStockData(symbol: string, source?: string): Promise<StockData> {
    if (!this.isInitialized) {
      throw new Error('Stock Service not initialized');
    }

    // Check cache first
    const cacheKey = `stock_${symbol}_${source || 'default'}`;
    const cached = await this.cacheService.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Get data from API
    const stockData = await this.fetchStockData(symbol, source);
    
    // Cache the result
    await this.cacheService.set(cacheKey, stockData, config.STOCK.CACHE_TTL);
    
    return stockData;
  }

  public async getMultipleStocks(symbols: string[]): Promise<StockData[]> {
    if (symbols.length > config.STOCK.MAX_SYMBOLS_PER_REQUEST) {
      throw new Error(`Too many symbols requested. Maximum: ${config.STOCK.MAX_SYMBOLS_PER_REQUEST}`);
    }

    const promises = symbols.map(symbol => this.getStockData(symbol));
    const results = await Promise.allSettled(promises);
    
    return results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<StockData>).value);
  }

  public async getHistoricalData(symbol: string, range: string = '6mo'): Promise<HistoricalData[]> {
    const cacheKey = `historical_${symbol}_${range}`;
    const cached = await this.cacheService.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const data = await this.fetchHistoricalData(symbol, range);
      await this.cacheService.set(cacheKey, data, config.STOCK.CACHE_TTL);
      return data;
    } catch (error) {
      logger.error(`Failed to fetch historical data for ${symbol}:`, error);
      throw error;
    }
  }

  private async fetchStockData(symbol: string, source?: string): Promise<StockData> {
    const sources = source ? [source] : ['yahoo', 'alpha_vantage', 'polygon', 'iex'];
    
    for (const sourceName of sources) {
      try {
        const client = this.apiClients.get(sourceName);
        if (!client) continue;

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
      } catch (error) {
        logger.warn(`Failed to fetch from ${sourceName}:`, error.message);
        continue;
      }
    }

    throw new Error(`Failed to fetch data for ${symbol} from all sources`);
  }

  private async fetchFromYahoo(symbol: string, client: any): Promise<StockData> {
    const response = await axios.get(`${client.baseURL}/${symbol}`, {
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

  private async fetchFromAlphaVantage(symbol: string, client: any): Promise<StockData> {
    const response = await axios.get(client.baseURL, {
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

  private async fetchFromPolygon(symbol: string, client: any): Promise<StockData> {
    const response = await axios.get(`${client.baseURL}/aggs/ticker/${symbol}/prev`, {
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

  private async fetchFromIEX(symbol: string, client: any): Promise<StockData> {
    const response = await axios.get(`${client.baseURL}/stock/${symbol}/quote`, {
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

  private async fetchHistoricalData(symbol: string, range: string): Promise<HistoricalData[]> {
    // Use Yahoo Finance for historical data
    const client = this.apiClients.get('yahoo');
    if (!client) {
      throw new Error('Yahoo Finance client not available');
    }

    const response = await axios.get(`${client.baseURL}/${symbol}`, {
      timeout: client.timeout,
      params: {
        interval: '1d',
        range: range
      }
    });

    const data = response.data.chart.result[0];
    const timestamps = data.timestamp;
    const quotes = data.indicators.quote[0];
    
    const historicalData: HistoricalData[] = [];
    
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

  private inferMarketFromExchange(exchange: string): string {
    const exchangeMap: { [key: string]: string } = {
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

  public async searchStocks(query: string): Promise<StockData[]> {
    const cacheKey = `search_${query}`;
    const cached = await this.cacheService.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Use Yahoo Finance search
      const response = await axios.get('https://query1.finance.yahoo.com/v1/finance/search', {
        params: { q: query },
        timeout: config.STOCK.TIMEOUT
      });

      const results = response.data.quotes.slice(0, 10); // Limit to 10 results
      const stockData: StockData[] = [];

      for (const result of results) {
        try {
          const data = await this.getStockData(result.symbol);
          stockData.push(data);
        } catch (error) {
          // Skip invalid symbols
          continue;
        }
      }

      await this.cacheService.set(cacheKey, stockData, 300); // Cache for 5 minutes
      return stockData;
    } catch (error) {
      logger.error('Stock search failed:', error);
      return [];
    }
  }

  public async getMarketStatus(): Promise<{ [market: string]: boolean }> {
    const markets = ['US', 'IN', 'GB', 'JP', 'AU'];
    const status: { [market: string]: boolean } = {};

    for (const market of markets) {
      try {
        const testSymbol = this.getTestSymbolForMarket(market);
        await this.getStockData(testSymbol);
        status[market] = true;
      } catch (error) {
        status[market] = false;
      }
    }

    return status;
  }

  private getTestSymbolForMarket(market: string): string {
    const testSymbols: { [market: string]: string } = {
      'US': 'AAPL',
      'IN': 'RELIANCE.NS',
      'GB': 'VOD.L',
      'JP': '7203.T',
      'AU': 'CBA.AX'
    };

    return testSymbols[market] || 'AAPL';
  }

  public getStatus(): string {
    const availableSources = Array.from(this.apiClients.keys()).join(', ');
    return `Stock Service initialized with sources: ${availableSources}`;
  }

  public async close(): Promise<void> {
    logger.info('📈 Closing Stock Service...');
    this.isInitialized = false;
    logger.info('✅ Stock Service closed');
  }
}
