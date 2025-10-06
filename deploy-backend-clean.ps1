# Clean Backend Deployment Script
Write-Host "🚀 Deploying Backend (Express.js) to Vercel..." -ForegroundColor Green

# Check if Vercel CLI is installed
if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

# Navigate to backend directory
Write-Host "📁 Navigating to backend directory..." -ForegroundColor Yellow
Set-Location backend

# Verify backend files exist
Write-Host "📋 Checking backend files..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "✅ package.json found" -ForegroundColor Green
} else {
    Write-Host "❌ package.json not found" -ForegroundColor Red
    Set-Location ..
    exit 1
}

if (Test-Path "api/index.js") {
    Write-Host "✅ api/index.js found" -ForegroundColor Green
} else {
    Write-Host "❌ api/index.js not found" -ForegroundColor Red
    Set-Location ..
    exit 1
}

if (Test-Path "vercel.json") {
    Write-Host "✅ vercel.json found" -ForegroundColor Green
} else {
    Write-Host "❌ vercel.json not found" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Remove any existing .vercel directory to avoid conflicts
if (Test-Path ".vercel") {
    Remove-Item .vercel -Recurse -Force
    Write-Host "✅ Removed existing .vercel directory" -ForegroundColor Green
}

# Deploy backend
Write-Host "🚀 Deploying backend to Vercel..." -ForegroundColor Green
Write-Host "This will deploy your Express.js backend as Vercel serverless functions." -ForegroundColor Cyan

try {
    vercel --prod --yes
    Write-Host "✅ Backend deployment completed successfully!" -ForegroundColor Green
    Write-Host "Your backend should now be accessible at the provided URL." -ForegroundColor Cyan
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Return to root directory
    Set-Location ..
}

Write-Host "🎉 Backend deployment process completed!" -ForegroundColor Green
