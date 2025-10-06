"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const StockService_1 = require("../../services/stock/StockService");
const MLService_1 = require("../../services/ml/MLService");
const CacheService_1 = require("../../services/cache/CacheService");
const logger_1 = require("../../utils/logger");
const validation_1 = require("../../middleware/validation");
const router = express_1.default.Router();
let stockService;
let mlService;
let cacheService;
const initializeServices = async () => {
    if (!stockService) {
        cacheService = new CacheService_1.CacheService();
        await cacheService.initialize();
        stockService = new StockService_1.StockService(cacheService);
        await stockService.initialize();
        mlService = new MLService_1.MLService(cacheService, stockService);
        await mlService.initialize();
    }
};
router.get('/:symbol', validation_1.validateSymbol, async (req, res) => {
    try {
        await initializeServices();
        const { symbol } = req.params;
        const { source } = req.query;
        const stockData = await stockService.getStockData(symbol, source);
        res.json({
            success: true,
            data: stockData,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching stock data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stock data',
            message: error.message
        });
    }
});
router.get('/multi/:symbols', validation_1.validateSymbols, async (req, res) => {
    try {
        await initializeServices();
        const { symbols } = req.params;
        const symbolArray = symbols.split(',');
        if (symbolArray.length > 50) {
            return res.status(400).json({
                success: false,
                error: 'Too many symbols requested',
                message: 'Maximum 50 symbols allowed per request'
            });
        }
        const stockData = await stockService.getMultipleStocks(symbolArray);
        res.json({
            success: true,
            data: stockData,
            count: stockData.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching multiple stocks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch multiple stocks',
            message: error.message
        });
    }
});
router.get('/:symbol/history', validation_1.validateSymbol, validation_1.validateRange, async (req, res) => {
    try {
        await initializeServices();
        const { symbol } = req.params;
        const { range = '6mo', interval = '1d' } = req.query;
        const historicalData = await stockService.getHistoricalData(symbol, range);
        res.json({
            success: true,
            data: {
                symbol,
                range,
                interval,
                data: historicalData
            },
            count: historicalData.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching historical data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch historical data',
            message: error.message
        });
    }
});
router.get('/search/:query', async (req, res) => {
    try {
        await initializeServices();
        const { query } = req.params;
        const { limit = 10 } = req.query;
        if (query.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Query too short',
                message: 'Search query must be at least 2 characters'
            });
        }
        const searchResults = await stockService.searchStocks(query);
        const limitedResults = searchResults.slice(0, parseInt(limit));
        res.json({
            success: true,
            data: limitedResults,
            count: limitedResults.length,
            query,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error searching stocks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search stocks',
            message: error.message
        });
    }
});
router.get('/market/status', async (req, res) => {
    try {
        await initializeServices();
        const marketStatus = await stockService.getMarketStatus();
        res.json({
            success: true,
            data: marketStatus,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching market status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch market status',
            message: error.message
        });
    }
});
router.get('/:symbol/predictions', validation_1.validateSymbol, async (req, res) => {
    try {
        await initializeServices();
        const { symbol } = req.params;
        const predictions = await mlService.generatePredictions([symbol]);
        if (predictions.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No predictions available',
                message: `No predictions found for ${symbol}`
            });
        }
        res.json({
            success: true,
            data: predictions[0],
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error generating predictions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate predictions',
            message: error.message
        });
    }
});
router.post('/predictions/batch', async (req, res) => {
    try {
        await initializeServices();
        const { symbols } = req.body;
        if (!symbols || !Array.isArray(symbols)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request',
                message: 'Symbols array is required'
            });
        }
        if (symbols.length > 20) {
            return res.status(400).json({
                success: false,
                error: 'Too many symbols',
                message: 'Maximum 20 symbols allowed for batch predictions'
            });
        }
        const predictions = await mlService.generatePredictions(symbols);
        res.json({
            success: true,
            data: predictions,
            count: predictions.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error generating batch predictions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate batch predictions',
            message: error.message
        });
    }
});
router.get('/status', async (req, res) => {
    try {
        await initializeServices();
        const status = {
            stockService: stockService.getStatus(),
            mlService: mlService.getModelStatus(),
            cacheService: cacheService.getStatus(),
            timestamp: new Date().toISOString()
        };
        res.json({
            success: true,
            data: status
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching service status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch service status',
            message: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=stockRoutes.js.map