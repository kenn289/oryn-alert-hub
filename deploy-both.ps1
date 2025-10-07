# Deploy Both Frontend and Backend API
# Run this script from the root directory (oryn-alert-hub)

Write-Host "🚀 Starting deployment of Oryn Alert Hub..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the root directory (oryn-alert-hub)" -ForegroundColor Red
    exit 1
}

# Deploy Frontend (Next.js)
Write-Host "📦 Deploying Frontend (Next.js)..." -ForegroundColor Yellow
try {
    vercel --prod --yes
    Write-Host "✅ Frontend deployed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend deployment failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Deploy Backend API
Write-Host "🔧 Deploying Backend API..." -ForegroundColor Yellow
try {
    Set-Location "backend-api"
    vercel --prod --yes
    Write-Host "✅ Backend API deployed successfully!" -ForegroundColor Green
    Set-Location ".."
} catch {
    Write-Host "❌ Backend API deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Set-Location ".."
}

Write-Host "🎉 Deployment process completed!" -ForegroundColor Green
Write-Host "📝 Check your Vercel dashboard for deployment URLs" -ForegroundColor Cyan
