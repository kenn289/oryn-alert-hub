const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

app.get('/api/support/stats', (req, res) => {
  res.json({
    openTickets: 0,
    resolvedThisMonth: 3,
    averageResponseTime: 0,
    customerRating: 4,
    totalTickets: 5
  });
});

app.get('/api/stock/:symbol', (req, res) => {
  const { symbol } = req.params;
  res.json({
    symbol,
    name: `${symbol} Company`,
    price: Math.random() * 100 + 100,
    change: Math.random() * 5 - 2.5,
    change_percent: Math.random() * 2 - 1
  });
});

app.get('/api/stock/:symbol/predictions', (req, res) => {
  const { symbol } = req.params;
  res.json({
    symbol,
    currentPrice: Math.random() * 100 + 100,
    predictedPrice: Math.random() * 100 + 100,
    confidence: Math.random(),
    trend: Math.random() > 0.5 ? 'Up' : 'Down',
    signals: ['Mock Signal'],
    timestamp: new Date().toISOString()
  });
});

app.get('/api/portfolio', (req, res) => {
  res.json([{
    symbol: 'AAPL',
    name: 'Apple Inc.',
    shares: 10,
    avg_price: 150,
    current_price: 170,
    total_value: 1700,
    gain_loss: 200,
    gain_loss_percent: 13.33
  }]);
});

app.get('/api/watchlist', (req, res) => {
  res.json([{
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 2800,
    change: 15.5,
    change_percent: 0.56
  }]);
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🚀 Simple Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📈 Support Stats: http://localhost:${PORT}/api/support/stats`);
});
