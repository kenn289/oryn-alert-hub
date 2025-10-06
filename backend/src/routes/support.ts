import express from 'express';
import { logger } from '../utils/logger';

const router = express.Router();

// GET /api/support/tickets - Get support tickets
router.get('/tickets', async (req, res) => {
  try {
    // Mock support tickets data
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
  } catch (error) {
    logger.error('Error fetching support tickets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch support tickets',
      message: error.message
    });
  }
});

// GET /api/support/stats - Get support statistics
router.get('/stats', async (req, res) => {
  try {
    // Mock support stats
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
  } catch (error) {
    logger.error('Error fetching support stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch support stats',
      message: error.message
    });
  }
});

export default router;
