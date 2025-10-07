// Backend API for Oryn Alert Hub
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const app = express();

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

// Root route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Oryn Alert Hub Backend API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/api/health',
            stock: '/api/stock/:symbol',
            predictions: '/api/stock/:symbol/predictions',
            portfolio: '/api/portfolio',
            watchlist: '/api/watchlist',
            support: '/api/support/stats'
        },
        documentation: 'https://github.com/your-repo/oryn-alert-hub'
    });
});

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
    const prediction = {
        symbol: symbol.toUpperCase(),
        currentPrice: Math.random() * 1000 + 50,
        predictedPrice: Math.random() * 1000 + 50,
        confidence: Math.random() * 0.4 + 0.6,
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
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// Export for Vercel
module.exports = app;
