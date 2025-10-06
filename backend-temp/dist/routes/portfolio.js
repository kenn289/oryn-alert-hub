"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching portfolio:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch portfolio',
            message: error.message
        });
    }
});
router.post('/', async (req, res) => {
    try {
        const { ticker, shares, avgPrice } = req.body;
        if (!ticker || !shares || !avgPrice) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'Ticker, shares, and average price are required'
            });
        }
        const portfolioItem = {
            id: Date.now().toString(),
            ticker,
            name: ticker,
            shares: parseFloat(shares),
            avgPrice: parseFloat(avgPrice),
            currentPrice: parseFloat(avgPrice) * 1.05,
            totalValue: parseFloat(shares) * parseFloat(avgPrice) * 1.05,
            gainLoss: parseFloat(shares) * parseFloat(avgPrice) * 0.05,
            gainLossPercent: 5.0
        };
        res.status(201).json({
            success: true,
            data: portfolioItem,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating portfolio item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create portfolio item',
            message: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=portfolio.js.map