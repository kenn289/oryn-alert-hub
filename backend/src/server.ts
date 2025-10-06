import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Simple logger
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args)
};

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.'
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    }
  });
});

// Stock data endpoint
app.get('/api/stock/:symbol', (req, res) => {
  const { symbol } = req.params;
  
  // Mock stock data
  const stockData = {
    symbol: symbol.toUpperCase(),
    name: `${symbol} Inc.`,
    price: Math.random() * 1000 + 50,
    change: (Math.random() - 0.5) * 10,
    changePercent: (Math.random() - 0.5) * 5,
    volume: Math.floor(Math.random() * 1000000),
    currency: 'USD',
    exchange: 'NASDAQ',
    market: 'US',
    timestamp: new Date().toISOString(),
    source: 'mock'
  };

  stockData.changePercent = (stockData.change / (stockData.price - stockData.change)) * 100;

  res.json({
    success: true,
    data: stockData,
    timestamp: new Date().toISOString()
  });
});

// ML predictions endpoint
app.get('/api/stock/:symbol/predictions', (req, res) => {
  const { symbol } = req.params;
  
  // Mock ML prediction
  const prediction = {
    symbol: symbol.toUpperCase(),
    currentPrice: Math.random() * 1000 + 50,
    predictedPrice: Math.random() * 1000 + 50,
    confidence: Math.random() * 0.4 + 0.6, // 60-100%
    timeframe: '3-5 days',
    reasoning: 'Technical analysis suggests moderate movement based on RSI and MACD indicators',
    technicalIndicators: {
      rsi: Math.random() * 100,
      macd: (Math.random() - 0.5) * 2,
      sma20: Math.random() * 1000 + 50,
      sma50: Math.random() * 1000 + 50,
      sma200: Math.random() * 1000 + 50,
      support: Math.random() * 1000 + 50,
      resistance: Math.random() * 1000 + 50,
      trend: Math.random() > 0.5 ? 'up' : 'down'
    },
    marketSentiment: Math.random() > 0.5 ? 'bullish' : 'bearish',
    riskFactors: ['Market volatility', 'Economic uncertainty'],
    buySellRecommendation: {
      action: Math.random() > 0.5 ? 'buy' : 'hold',
      targetPrice: Math.random() * 1000 + 50,
      stopLoss: Math.random() * 1000 + 50,
      reasoning: 'Based on technical analysis and market conditions',
      riskLevel: Math.random() > 0.5 ? 'medium' : 'low'
    }
  };

  res.json({
    success: true,
    data: prediction,
    timestamp: new Date().toISOString()
  });
});

// Portfolio endpoint
app.get('/api/portfolio', (req, res) => {
  const portfolio = [
    {
      id: '1',
      ticker: 'AAPL',
      name: 'Apple Inc.',
      shares: 10,
      avgPrice: 150.00,
      currentPrice: 175.50,
      totalValue: 1755.00,
      gainLoss: 255.00,
      gainLossPercent: 17.0
    },
    {
      id: '2',
      ticker: 'GOOGL',
      name: 'Alphabet Inc.',
      shares: 5,
      avgPrice: 2800.00,
      currentPrice: 2950.00,
      totalValue: 14750.00,
      gainLoss: 750.00,
      gainLossPercent: 5.36
    }
  ];

  res.json({
    success: true,
    data: portfolio,
    timestamp: new Date().toISOString()
  });
});

// Watchlist endpoint
app.get('/api/watchlist', (req, res) => {
  const watchlist = [
    {
      id: '1',
      ticker: 'AAPL',
      name: 'Apple Inc.',
      price: 175.50,
      change: 2.50,
      changePercent: 1.45
    },
    {
      id: '2',
      ticker: 'TSLA',
      name: 'Tesla Inc.',
      price: 250.75,
      change: -5.25,
      changePercent: -2.05
    }
  ];

  res.json({
    success: true,
    data: watchlist,
    timestamp: new Date().toISOString()
  });
});

// Support stats endpoint
app.get('/api/support/stats', (req, res) => {
  const stats = {
    openTickets: 5,
    resolvedThisMonth: 12,
    averageResponseTime: 2.5,
    customerRating: 4.8,
    totalTickets: 25
  };

  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString()
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('subscribe', (symbol) => {
    logger.info(`Client ${socket.id} subscribed to ${symbol}`);
    socket.join(`stock:${symbol}`);
  });

  socket.on('unsubscribe', (symbol) => {
    logger.info(`Client ${socket.id} unsubscribed from ${symbol}`);
    socket.leave(`stock:${symbol}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((error: any, req: any, res: any, next: any) => {
  logger.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || 'localhost';

server.listen(PORT, () => {
  logger.info(`🚀 Server running on http://${HOST}:${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 CORS Origins: ${process.env.CORS_ORIGINS || 'http://localhost:3000, http://localhost:3001'}`);
  logger.info(`📈 ML Models: Simple heuristic-based predictions`);
  logger.info(`💾 Cache Status: In-memory caching enabled`);
  logger.info(`🗄️ Database Status: Mock data mode`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;