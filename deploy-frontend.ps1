# Frontend Deployment Script
Write-Host "🚀 Deploying Frontend (Next.js) to Vercel..." -ForegroundColor Green

# Check if Vercel CLI is installed
if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

# Verify frontend files exist
Write-Host "📋 Checking frontend files..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "✅ package.json found" -ForegroundColor Green
} else {
    Write-Host "❌ package.json not found" -ForegroundColor Red
    exit 1
}

if (Test-Path "next.config.js") {
    Write-Host "✅ next.config.js found" -ForegroundColor Green
} else {
    Write-Host "❌ next.config.js not found" -ForegroundColor Red
    exit 1
}

if (Test-Path "src/app") {
    Write-Host "✅ Next.js app directory found" -ForegroundColor Green
} else {
    Write-Host "❌ Next.js app directory not found" -ForegroundColor Red
    exit 1
}

# Deploy frontend
Write-Host "🚀 Deploying frontend to Vercel..." -ForegroundColor Green
Write-Host "This will deploy your Next.js frontend." -ForegroundColor Cyan

try {
    vercel --prod --yes
    Write-Host "✅ Frontend deployment completed successfully!" -ForegroundColor Green
    Write-Host "Your frontend should now be accessible at the provided URL." -ForegroundColor Cyan
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "🎉 Frontend deployment process completed!" -ForegroundColor Green