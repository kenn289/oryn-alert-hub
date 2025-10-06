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
        const analytics = {
            portfolio: {
                totalValue: 50000,
                totalGainLoss: 5000,
                totalGainLossPercent: 10.0,
                dayChange: 250,
                dayChangePercent: 0.5
            },
            watchlist: {
                totalStocks: 15,
                positiveStocks: 10,
                negativeStocks: 5,
                averageChange: 2.5
            },
            alerts: {
                totalAlerts: 8,
                activeAlerts: 5,
                triggeredToday: 2
            }
        };
        res.json({
            success: true,
            data: analytics,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analytics',
            message: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map