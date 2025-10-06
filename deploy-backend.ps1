# Backend Deployment Script for Vercel
Write-Host "🚀 Deploying Backend to Vercel..." -ForegroundColor Green

# Check if Vercel CLI is installed
if (-not (Get-Command "vercel" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

# Navigate to backend directory
Set-Location backend

# Set environment variables for production
$env:NODE_ENV = "production"

Write-Host "📦 Building backend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
vercel --prod

Write-Host "✅ Backend deployment complete!" -ForegroundColor Green
Write-Host "📝 Don't forget to:" -ForegroundColor Cyan
Write-Host "   1. Set environment variables in Vercel dashboard" -ForegroundColor Cyan
Write-Host "   2. Update frontend BACKEND_URL with this backend URL" -ForegroundColor Cyan
Write-Host "   3. Test the API endpoints" -ForegroundColor Cyan

# Return to root directory
Set-Location ..
