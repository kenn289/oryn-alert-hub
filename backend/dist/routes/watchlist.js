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
    }
    catch (error) {
        logger_1.logger.error('Error fetching watchlist:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch watchlist',
            message: error.message
        });
    }
});
router.post('/', async (req, res) => {
    try {
        const { ticker, name } = req.body;
        if (!ticker) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'Ticker is required'
            });
        }
        const watchlistItem = {
            id: Date.now().toString(),
            ticker,
            name: name || ticker,
            price: 100.00,
            change: 0,
            changePercent: 0
        };
        res.status(201).json({
            success: true,
            data: watchlistItem,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error adding to watchlist:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add to watchlist',
            message: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=watchlist.js.map