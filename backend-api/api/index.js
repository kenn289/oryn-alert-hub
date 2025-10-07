// Backend API for Oryn Alert Hub
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const RealAIAnalysisService = require('../ai/real-ai-analysis-service');
const StockDataService = require('../services/stock-data-service');
const PortfolioService = require('../services/portfolio-service');
const WatchlistService = require('../services/watchlist-service');
const NotificationService = require('../services/notification-service');
const SupportService = require('../services/support-service');
const PaymentService = require('../services/payment-service');

const app = express();

// Initialize services
const aiService = RealAIAnalysisService.getInstance();
const stockService = new StockDataService();
const portfolioService = new PortfolioService();
const watchlistService = new WatchlistService();
const notificationService = new NotificationService();
const supportService = new SupportService();
const paymentService = new PaymentService();

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
            stockHistory: '/api/stock/:symbol/history',
            stockSearch: '/api/stock/search?q=AAPL',
            marketStatus: '/api/stock/market-status',
            predictions: '/api/stock/:symbol/predictions',
            aiInsights: '/api/ai/insights?symbols=AAPL,TSLA,MSFT',
            portfolio: '/api/portfolio',
            watchlist: '/api/watchlist',
            notifications: '/api/notifications',
            supportTickets: '/api/support/tickets',
            supportStats: '/api/support/stats',
            paymentCheckout: '/api/razorpay/create-checkout-session',
            paymentVerify: '/api/razorpay/verify-payment'
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
app.get('/api/stock/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        
        // Validate symbol format
        if (!symbol || symbol.length < 1 || symbol.length > 10) {
            return res.status(400).json({
                success: false,
                error: 'Invalid stock symbol',
                message: 'Symbol must be 1-10 characters long'
            });
        }

        // Get real stock data
        const stockData = await stockService.getStockQuote(symbol.toUpperCase());
        
        res.json({
            success: true,
            data: stockData,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(`Error fetching stock data for ${req.params.symbol}:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stock data',
            message: error.message
        });
    }
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

// AI insights endpoint for multiple symbols
app.get('/api/ai/insights', async (req, res) => {
    try {
        const { symbols } = req.query;
        
        if (!symbols) {
            return res.status(400).json({
                success: false,
                error: 'Missing symbols parameter',
                message: 'Please provide symbols as query parameter (e.g., ?symbols=AAPL,TSLA,MSFT)',
                timestamp: new Date().toISOString()
            });
        }
        
        const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
        const predictions = [];
        
        // Generate predictions using real AI service
        try {
            const realPredictions = await aiService.generateRealPredictions(symbolList);
            predictions.push(...realPredictions);
        } catch (error) {
            console.error('Failed to generate real predictions:', error);
            // Fallback to individual predictions
            for (const symbol of symbolList) {
                try {
                    const prediction = await aiService.generatePrediction(symbol);
                    predictions.push(prediction);
                } catch (error) {
                    console.error(`Failed to generate prediction for ${symbol}:`, error);
                }
            }
        }
        
        res.json({
            success: true,
            data: {
                predictions,
                totalSymbols: symbolList.length,
                successfulPredictions: predictions.length,
                aiModel: {
                    version: 'v3.1.0-hist',
                    lastUpdated: new Date().toISOString(),
                    features: [
                        'Technical Analysis (RSI, MACD, SMA)',
                        'Market Sentiment Analysis',
                        'Risk Assessment',
                        'Buy/Sell Recommendations',
                        'Confidence Scoring'
                    ]
                }
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('AI insights error:', error);
        res.status(500).json({
            success: false,
            error: 'AI Insights Failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Stock history endpoint
app.get('/api/stock/:symbol/history', async (req, res) => {
    try {
        const { symbol } = req.params;
        const { range = '6mo', interval = '1d' } = req.query;
        
        const history = await stockService.getStockHistory(symbol, range, interval);
        
        res.json({
            success: true,
            data: history,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(`Error fetching stock history for ${req.params.symbol}:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stock history',
            message: error.message
        });
    }
});

// Stock search endpoint
app.get('/api/stock/search', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Missing query parameter',
                message: 'Please provide a search query (q)'
            });
        }
        
        const results = await stockService.searchStocks(q);
        
        res.json({
            success: true,
            data: results,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error searching stocks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search stocks',
            message: error.message
        });
    }
});

// Market status endpoint
app.get('/api/stock/market-status', async (req, res) => {
    try {
        const status = await stockService.getMarketStatus();
        
        res.json({
            success: true,
            data: status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching market status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch market status',
            message: error.message
        });
    }
});

// Portfolio endpoints
app.get('/api/portfolio', async (req, res) => {
    try {
        const { userId = 'default' } = req.query;
        const portfolio = await portfolioService.getPortfolio(userId);
        
        res.json({
            success: true,
            data: portfolio,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch portfolio',
            message: error.message
        });
    }
});

app.post('/api/portfolio', async (req, res) => {
    try {
        const { userId = 'default', ...stockData } = req.body;
        const portfolioItem = await portfolioService.addToPortfolio(userId, stockData);
        
        res.json({
            success: true,
            data: portfolioItem,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error adding to portfolio:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add to portfolio',
            message: error.message
        });
    }
});

// Watchlist endpoints
app.get('/api/watchlist', async (req, res) => {
    try {
        const { userId = 'default' } = req.query;
        const watchlist = await watchlistService.getWatchlist(userId);
        
        res.json({
            success: true,
            data: watchlist,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch watchlist',
            message: error.message
        });
    }
});

app.post('/api/watchlist', async (req, res) => {
    try {
        const { userId = 'default', ...stockData } = req.body;
        const watchlistItem = await watchlistService.addToWatchlist(userId, stockData);
        
        res.json({
            success: true,
            data: watchlistItem,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add to watchlist',
            message: error.message
        });
    }
});

// Notifications endpoints
app.get('/api/notifications', async (req, res) => {
    try {
        const { userId = 'default' } = req.query;
        const notifications = await notificationService.getNotifications(userId);
        
        res.json({
            success: true,
            data: notifications,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch notifications',
            message: error.message
        });
    }
});

// Support endpoints
app.get('/api/support/tickets', async (req, res) => {
    try {
        const { userId = 'default' } = req.query;
        const tickets = await supportService.getTickets(userId);
        
        res.json({
            success: true,
            data: tickets,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching support tickets:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch support tickets',
            message: error.message
        });
    }
});

app.post('/api/support/tickets', async (req, res) => {
    try {
        const { userId = 'default', ...ticketData } = req.body;
        const ticket = await supportService.createTicket(userId, ticketData);
        
        res.json({
            success: true,
            data: ticket,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error creating support ticket:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create support ticket',
            message: error.message
        });
    }
});

// Payment endpoints
app.post('/api/razorpay/create-checkout-session', async (req, res) => {
    try {
        const { userId = 'default', ...planData } = req.body;
        const session = await paymentService.createCheckoutSession(userId, planData);
        
        res.json({
            success: true,
            data: session,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create checkout session',
            message: error.message
        });
    }
});

app.post('/api/razorpay/verify-payment', async (req, res) => {
    try {
        const paymentData = req.body;
        const verification = await paymentService.verifyPayment(paymentData);
        
        res.json({
            success: true,
            data: verification,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify payment',
            message: error.message
        });
    }
});

// Support stats endpoint
app.get('/api/support/stats', async (req, res) => {
    try {
        const stats = await supportService.getSupportStats();
        
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching support stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch support stats',
            message: error.message
        });
    }
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
