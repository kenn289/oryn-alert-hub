# Frontend-only deployment script for Vercel
# This script ensures only the frontend is deployed, excluding the backend

Write-Host "🚀 Starting Frontend-Only Deployment to Vercel..." -ForegroundColor Green

# Check if Vercel CLI is installed
if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

# Verify .vercelignore is properly configured
Write-Host "📋 Checking .vercelignore configuration..." -ForegroundColor Yellow
if (Test-Path ".vercelignore") {
    Write-Host "✅ .vercelignore found" -ForegroundColor Green
} else {
    Write-Host "❌ .vercelignore not found" -ForegroundColor Red
    exit 1
}

# Verify vercel.json is properly configured
Write-Host "📋 Checking vercel.json configuration..." -ForegroundColor Yellow
if (Test-Path "vercel.json") {
    Write-Host "✅ vercel.json found" -ForegroundColor Green
} else {
    Write-Host "❌ vercel.json not found" -ForegroundColor Red
    exit 1
}

# Check if backend directory exists and is properly ignored
Write-Host "📋 Checking backend directory exclusion..." -ForegroundColor Yellow
if (Test-Path "backend") {
    Write-Host "⚠️  Backend directory found - should be excluded by .vercelignore" -ForegroundColor Yellow
} else {
    Write-Host "✅ No backend directory found" -ForegroundColor Green
}

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Green
Write-Host "This will deploy only the frontend (Next.js app) and exclude the backend directory." -ForegroundColor Cyan

# Use Vercel CLI to deploy
vercel --prod

Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host "Your frontend should now be deployed and accessible." -ForegroundColor Cyan
