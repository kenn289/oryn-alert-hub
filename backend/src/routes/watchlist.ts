import express from 'express';
import { logger } from '../utils/logger';

const router = express.Router();

// GET /api/watchlist - Get user watchlist
router.get('/', async (req, res) => {
  try {
    // Mock watchlist data
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
  } catch (error) {
    logger.error('Error fetching watchlist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch watchlist',
      message: error.message
    });
  }
});

// POST /api/watchlist - Add to watchlist
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

    // Mock watchlist item creation
    const watchlistItem = {
      id: Date.now().toString(),
      ticker,
      name: name || ticker,
      price: 100.00, // Mock price
      change: 0,
      changePercent: 0
    };

    res.status(201).json({
      success: true,
      data: watchlistItem,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error adding to watchlist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add to watchlist',
      message: error.message
    });
  }
});

export default router;
