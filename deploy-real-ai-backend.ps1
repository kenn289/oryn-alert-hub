# Deploy Backend API with Real AI Service
Write-Host "🤖 Deploying Backend API with Real AI Service..." -ForegroundColor Green

# Navigate to backend-api
Set-Location "backend-api"

# Verify real AI service files exist
Write-Host "🔍 Verifying real AI service files..." -ForegroundColor Yellow

if (-not (Test-Path "ai/real-ai-analysis-service.js")) {
    Write-Host "❌ Real AI service file missing!" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

Write-Host "✅ Real AI service files present" -ForegroundColor Green

# Test the real AI service locally
Write-Host "🧪 Testing real AI service..." -ForegroundColor Yellow
try {
    node -e "const RealAI = require('./ai/real-ai-analysis-service'); const ai = RealAI.getInstance(); console.log('✅ Real AI service loads successfully');"
    Write-Host "✅ Real AI service test passed" -ForegroundColor Green
} catch {
    Write-Host "❌ Real AI service test failed: $($_.Exception.Message)" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
try {
    vercel --prod --yes
    Write-Host "✅ Backend with Real AI service deployed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

Set-Location ".."

Write-Host "🎉 Real AI Backend Deployment Complete!" -ForegroundColor Green
Write-Host "🧪 Test your Real AI endpoints:" -ForegroundColor Cyan
Write-Host "- Root: https://your-backend-url.vercel.app/" -ForegroundColor White
Write-Host "- Real AI Prediction: https://your-backend-url.vercel.app/api/stock/AAPL/predictions" -ForegroundColor White
Write-Host "- Real AI Insights: https://your-backend-url.vercel.app/api/ai/insights?symbols=AAPL,TSLA,MSFT" -ForegroundColor White
Write-Host "- Health: https://your-backend-url.vercel.app/api/health" -ForegroundColor White
