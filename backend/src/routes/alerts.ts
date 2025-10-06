import express from 'express';
import { logger } from '../utils/logger';

const router = express.Router();

// GET /api/alerts - Get user alerts
router.get('/', async (req, res) => {
  try {
    // Mock alerts data
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
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts',
      message: error.message
    });
  }
});

// POST /api/alerts - Create alert
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

    // Mock alert creation
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
  } catch (error) {
    logger.error('Error creating alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create alert',
      message: error.message
    });
  }
});

export default router;
