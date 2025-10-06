import express from 'express';
import { logger } from '../utils/logger';

const router = express.Router();

// GET /api/analytics - Get analytics data
router.get('/', async (req, res) => {
  try {
    // Mock analytics data
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
  } catch (error) {
    logger.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
      message: error.message
    });
  }
});

export default router;
