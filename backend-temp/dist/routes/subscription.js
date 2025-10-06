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
        const subscription = {
            plan: 'pro',
            status: 'active',
            startDate: '2024-01-01T00:00:00Z',
            endDate: '2024-12-31T23:59:59Z',
            features: {
                watchlist: { enabled: true, unlimited: true },
                priceAlerts: { enabled: true, unlimited: true },
                emailNotifications: { enabled: true, unlimited: true },
                basicOptionsFlow: { enabled: true, unlimited: true },
                advancedOptionsFlow: { enabled: true, unlimited: true },
                portfolioAnalytics: { enabled: true, unlimited: true },
                customWebhooks: { enabled: true, unlimited: true },
                teamCollaboration: { enabled: true, unlimited: true },
                prioritySupport: { enabled: true, unlimited: true },
                aiInsights: { enabled: true, unlimited: true }
            }
        };
        res.json({
            success: true,
            data: subscription,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching subscription:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch subscription',
            message: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=subscription.js.map