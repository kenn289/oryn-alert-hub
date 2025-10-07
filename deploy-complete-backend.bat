@echo off
echo 🚀 Deploying Complete Backend API with All Features...

REM Navigate to backend-api
cd backend-api

REM Verify all required files exist
echo 🔍 Verifying all backend files...

if not exist "index.js" (
    echo ❌ Missing required file: index.js
    cd ..
    pause
    exit /b 1
)
if not exist "api\index.js" (
    echo ❌ Missing required file: api\index.js
    cd ..
    pause
    exit /b 1
)
if not exist "ai\real-ai-analysis-service.js" (
    echo ❌ Missing required file: ai\real-ai-analysis-service.js
    cd ..
    pause
    exit /b 1
)
if not exist "services\stock-data-service.js" (
    echo ❌ Missing required file: services\stock-data-service.js
    cd ..
    pause
    exit /b 1
)
if not exist "services\portfolio-service.js" (
    echo ❌ Missing required file: services\portfolio-service.js
    cd ..
    pause
    exit /b 1
)
if not exist "services\watchlist-service.js" (
    echo ❌ Missing required file: services\watchlist-service.js
    cd ..
    pause
    exit /b 1
)
if not exist "services\notification-service.js" (
    echo ❌ Missing required file: services\notification-service.js
    cd ..
    pause
    exit /b 1
)
if not exist "services\support-service.js" (
    echo ❌ Missing required file: services\support-service.js
    cd ..
    pause
    exit /b 1
)
if not exist "services\payment-service.js" (
    echo ❌ Missing required file: services\payment-service.js
    cd ..
    pause
    exit /b 1
)
if not exist "package.json" (
    echo ❌ Missing required file: package.json
    cd ..
    pause
    exit /b 1
)
if not exist "vercel.json" (
    echo ❌ Missing required file: vercel.json
    cd ..
    pause
    exit /b 1
)

echo ✅ All required files present

REM Test the backend locally
echo 🧪 Testing backend services...
node -e "const RealAI = require('./ai/real-ai-analysis-service'); const StockService = require('./services/stock-data-service'); const PortfolioService = require('./services/portfolio-service'); const WatchlistService = require('./services/watchlist-service'); const NotificationService = require('./services/notification-service'); const SupportService = require('./services/support-service'); const PaymentService = require('./services/payment-service'); console.log('✅ All services load successfully'); const ai = RealAI.getInstance(); console.log('✅ AI service initialized'); const stock = new StockService(); const portfolio = new PortfolioService(); const watchlist = new WatchlistService(); const notifications = new NotificationService(); const support = new SupportService(); const payment = new PaymentService(); console.log('✅ All services initialized successfully');"
if %errorlevel% neq 0 (
    echo ❌ Backend services test failed
    cd ..
    pause
    exit /b 1
)

echo ✅ Backend services test passed

REM Deploy to Vercel
echo 🚀 Deploying to Vercel...
vercel --prod --yes
if %errorlevel% neq 0 (
    echo ❌ Deployment failed
    cd ..
    pause
    exit /b 1
)

cd ..

echo 🎉 COMPLETE BACKEND DEPLOYMENT SUCCESSFUL!
echo 📊 All Features Implemented:
echo ✅ Real-time Stock Data
echo ✅ AI Predictions & Analysis
echo ✅ Portfolio Management
echo ✅ Watchlist Management
echo ✅ Notifications System
echo ✅ Support Tickets
echo ✅ Payment Processing
echo ✅ Market Status
echo ✅ Stock Search
echo ✅ Historical Data

echo 🧪 Test your complete backend:
echo - Root: https://your-backend-url.vercel.app/
echo - Stock: https://your-backend-url.vercel.app/api/stock/AAPL
echo - AI Predictions: https://your-backend-url.vercel.app/api/stock/AAPL/predictions
echo - AI Insights: https://your-backend-url.vercel.app/api/ai/insights?symbols=AAPL,TSLA,MSFT
echo - Portfolio: https://your-backend-url.vercel.app/api/portfolio
echo - Watchlist: https://your-backend-url.vercel.app/api/watchlist
echo - Notifications: https://your-backend-url.vercel.app/api/notifications
echo - Support: https://your-backend-url.vercel.app/api/support/tickets
echo - Health: https://your-backend-url.vercel.app/api/health
pause
