import express from 'express';
import { logger } from '../utils/logger';

const router = express.Router();

// GET /api/admin/stats - Get admin statistics
router.get('/stats', async (req, res) => {
  try {
    // Mock admin stats
    const stats = {
      users: {
        total: 1250,
        active: 980,
        newThisMonth: 45
      },
      revenue: {
        monthly: 15000,
        yearly: 180000,
        growth: 15.5
      },
      system: {
        uptime: 99.9,
        responseTime: 120,
        errorRate: 0.1
      }
    };

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin stats',
      message: error.message
    });
  }
});

export default router;
