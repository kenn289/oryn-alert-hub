"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
router.get('/tickets', async (req, res) => {
    try {
        const tickets = [
            {
                id: '1',
                subject: 'Login Issue',
                description: 'Cannot login to my account',
                priority: 'high',
                status: 'open',
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                subject: 'Feature Request',
                description: 'Need dark mode option',
                priority: 'medium',
                status: 'in_progress',
                createdAt: new Date().toISOString()
            }
        ];
        res.json({
            success: true,
            data: tickets,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching support tickets:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch support tickets',
            message: error.message
        });
    }
});
router.get('/stats', async (req, res) => {
    try {
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
    }
    catch (error) {
        logger_1.logger.error('Error fetching support stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch support stats',
            message: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=support.js.map