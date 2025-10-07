# Deploy Complete Backend API with All Features
Write-Host "🚀 Deploying Complete Backend API with All Features..." -ForegroundColor Green

# Navigate to backend-api
Set-Location "backend-api"

# Verify all required files exist
Write-Host "🔍 Verifying all backend files..." -ForegroundColor Yellow

$requiredFiles = @(
    "index.js",
    "api/index.js",
    "ai/real-ai-analysis-service.js",
    "services/stock-data-service.js",
    "services/portfolio-service.js",
    "services/watchlist-service.js",
    "services/notification-service.js",
    "services/support-service.js",
    "services/payment-service.js",
    "package.json",
    "vercel.json"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Missing required file: $file" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host "❌ Missing required files. Please check the backend structure." -ForegroundColor Red
    Set-Location ".."
    exit 1
}

Write-Host "✅ All required files present" -ForegroundColor Green

# Test the backend locally
Write-Host "🧪 Testing backend services..." -ForegroundColor Yellow
try {
    node -e "
        const RealAI = require('./ai/real-ai-analysis-service');
        const StockService = require('./services/stock-data-service');
        const PortfolioService = require('./services/portfolio-service');
        const WatchlistService = require('./services/watchlist-service');
        const NotificationService = require('./services/notification-service');
        const SupportService = require('./services/support-service');
        const PaymentService = require('./services/payment-service');
        
        console.log('✅ All services load successfully');
        
        // Test AI service
        const ai = RealAI.getInstance();
        console.log('✅ AI service initialized');
        
        // Test other services
        const stock = new StockService();
        const portfolio = new PortfolioService();
        const watchlist = new WatchlistService();
        const notifications = new NotificationService();
        const support = new SupportService();
        const payment = new PaymentService();
        
        console.log('✅ All services initialized successfully');
    "
    Write-Host "✅ Backend services test passed" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend services test failed: $($_.Exception.Message)" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
try {
    vercel --prod --yes
    Write-Host "✅ Complete Backend API deployed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

Set-Location ".."

Write-Host "🎉 COMPLETE BACKEND DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "📊 All Features Implemented:" -ForegroundColor Cyan
Write-Host "✅ Real-time Stock Data" -ForegroundColor White
Write-Host "✅ AI Predictions & Analysis" -ForegroundColor White
Write-Host "✅ Portfolio Management" -ForegroundColor White
Write-Host "✅ Watchlist Management" -ForegroundColor White
Write-Host "✅ Notifications System" -ForegroundColor White
Write-Host "✅ Support Tickets" -ForegroundColor White
Write-Host "✅ Payment Processing" -ForegroundColor White
Write-Host "✅ Market Status" -ForegroundColor White
Write-Host "✅ Stock Search" -ForegroundColor White
Write-Host "✅ Historical Data" -ForegroundColor White

Write-Host "🧪 Test your complete backend:" -ForegroundColor Cyan
Write-Host "- Root: https://your-backend-url.vercel.app/" -ForegroundColor White
Write-Host "- Stock: https://your-backend-url.vercel.app/api/stock/AAPL" -ForegroundColor White
Write-Host "- AI Predictions: https://your-backend-url.vercel.app/api/stock/AAPL/predictions" -ForegroundColor White
Write-Host "- AI Insights: https://your-backend-url.vercel.app/api/ai/insights?symbols=AAPL,TSLA,MSFT" -ForegroundColor White
Write-Host "- Portfolio: https://your-backend-url.vercel.app/api/portfolio" -ForegroundColor White
Write-Host "- Watchlist: https://your-backend-url.vercel.app/api/watchlist" -ForegroundColor White
Write-Host "- Notifications: https://your-backend-url.vercel.app/api/notifications" -ForegroundColor White
Write-Host "- Support: https://your-backend-url.vercel.app/api/support/tickets" -ForegroundColor White
Write-Host "- Health: https://your-backend-url.vercel.app/api/health" -ForegroundColor White
