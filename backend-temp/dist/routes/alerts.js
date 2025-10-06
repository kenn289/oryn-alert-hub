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
        const alerts = [
            {
                id: '1',
                ticker: 'AAPL',
                condition: 'above',
                targetPrice: 180.00,
                isActive: true,
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                ticker: 'TSLA',
                condition: 'below',
                targetPrice: 200.00,
                isActive: false,
                createdAt: new Date().toISOString()
            }
        ];
        res.json({
            success: true,
            data: alerts,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching alerts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch alerts',
            message: error.message
        });
    }
});
router.post('/', async (req, res) => {
    try {
        const { ticker, condition, targetPrice, isActive = true } = req.body;
        if (!ticker || !condition || !targetPrice) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'Ticker, condition, and target price are required'
            });
        }
        const alert = {
            id: Date.now().toString(),
            ticker,
            condition,
            targetPrice: parseFloat(targetPrice),
            isActive,
            createdAt: new Date().toISOString()
        };
        res.status(201).json({
            success: true,
            data: alert,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating alert:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create alert',
            message: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=alerts.js.map