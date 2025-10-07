// Test script to verify backend works locally
const app = require('./index.js');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`🚀 Backend API running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📈 Stock data: http://localhost:${PORT}/api/stock/AAPL`);
    console.log(`📋 Portfolio: http://localhost:${PORT}/api/portfolio`);
    console.log(`👀 Watchlist: http://localhost:${PORT}/api/watchlist`);
});
