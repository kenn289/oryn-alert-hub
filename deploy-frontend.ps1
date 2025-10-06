# Frontend Deployment Script for Vercel
Write-Host "🚀 Deploying Frontend to Vercel..." -ForegroundColor Green

# Check if Vercel CLI is installed
if (-not (Get-Command "vercel" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

# Set environment variables for production
$env:NODE_ENV = "production"
$env:BACKEND_URL = "https://your-backend-app.vercel.app"

Write-Host "📦 Building frontend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
vercel --prod

Write-Host "✅ Frontend deployment complete!" -ForegroundColor Green
Write-Host "📝 Don't forget to:" -ForegroundColor Cyan
Write-Host "   1. Set environment variables in Vercel dashboard" -ForegroundColor Cyan
Write-Host "   2. Update BACKEND_URL with your actual backend URL" -ForegroundColor Cyan
Write-Host "   3. Test the deployment" -ForegroundColor Cyan
