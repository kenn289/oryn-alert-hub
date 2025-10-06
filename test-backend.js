// Simple backend test
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

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🚀 Simple backend running on http://localhost:${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📈 Support Stats: http://localhost:${PORT}/api/support/stats`);
});
