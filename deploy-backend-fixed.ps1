# Fixed Backend Deployment Script for Vercel
Write-Host "🚀 Starting Fixed Backend Deployment to Vercel..." -ForegroundColor Green

# Check if Vercel CLI is installed
if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

# Verify backend files exist
Write-Host "📋 Checking backend files..." -ForegroundColor Yellow
if (Test-Path "backend/package.json") {
    Write-Host "✅ backend/package.json found" -ForegroundColor Green
} else {
    Write-Host "❌ backend/package.json not found" -ForegroundColor Red
    exit 1
}

if (Test-Path "backend/api/index.js") {
    Write-Host "✅ backend/api/index.js found" -ForegroundColor Green
} else {
    Write-Host "❌ backend/api/index.js not found" -ForegroundColor Red
    exit 1
}

if (Test-Path "vercel.json") {
    Write-Host "✅ vercel.json found" -ForegroundColor Green
} else {
    Write-Host "❌ vercel.json not found" -ForegroundColor Red
    exit 1
}

# Build the backend first
Write-Host "🔨 Building backend..." -ForegroundColor Yellow
Set-Location backend
npm run build
Set-Location ..

# Deploy to Vercel
Write-Host "🚀 Deploying backend to Vercel..." -ForegroundColor Green
Write-Host "This will deploy your Express.js backend as Vercel serverless functions." -ForegroundColor Cyan

try {
    # Use Vercel CLI to deploy from root directory
    vercel --prod --yes
    
    Write-Host "✅ Backend deployment completed successfully!" -ForegroundColor Green
    Write-Host "Your backend should now be accessible at the provided URL." -ForegroundColor Cyan
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "🎉 Backend deployment process completed!" -ForegroundColor Green
