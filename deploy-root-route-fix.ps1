# Quick fix for root route issue
Write-Host "🔧 Fixing root route issue..." -ForegroundColor Yellow

# Navigate to backend-api
Set-Location "backend-api"

# Deploy the fix
Write-Host "🚀 Deploying root route fix..." -ForegroundColor Green
vercel --prod --yes

Set-Location ".."

Write-Host "✅ Root route fix deployed!" -ForegroundColor Green
Write-Host "🧪 Test your backend now:" -ForegroundColor Cyan
Write-Host "- Root: https://your-backend-url.vercel.app/" -ForegroundColor White
Write-Host "- Health: https://your-backend-url.vercel.app/api/health" -ForegroundColor White
Write-Host "- Stock: https://your-backend-url.vercel.app/api/stock/AAPL" -ForegroundColor White
