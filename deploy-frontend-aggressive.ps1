# Aggressive Frontend-Only Deployment Script
# This script temporarily moves the backend directory to prevent Vercel from detecting it

Write-Host "🚀 Starting Aggressive Frontend-Only Deployment..." -ForegroundColor Green

# Check if Vercel CLI is installed
if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

# Create a temporary directory for backend
$tempBackendDir = "backend-temp-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "📁 Creating temporary backend directory: $tempBackendDir" -ForegroundColor Yellow

# Move backend directories to temporary location
if (Test-Path "backend") {
    Move-Item "backend" $tempBackendDir
    Write-Host "✅ Moved backend directory to $tempBackendDir" -ForegroundColor Green
}

if (Test-Path "backend-temp") {
    Move-Item "backend-temp" "$tempBackendDir-temp"
    Write-Host "✅ Moved backend-temp directory" -ForegroundColor Green
}

# Verify only frontend files remain
Write-Host "📋 Verifying frontend-only structure..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "✅ Frontend package.json found" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend package.json not found" -ForegroundColor Red
    exit 1
}

if (Test-Path "next.config.js") {
    Write-Host "✅ Next.js config found" -ForegroundColor Green
} else {
    Write-Host "❌ Next.js config not found" -ForegroundColor Red
    exit 1
}

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel (backend directories temporarily moved)..." -ForegroundColor Green
Write-Host "This ensures Vercel only sees the frontend files." -ForegroundColor Cyan

try {
    # Use Vercel CLI to deploy
    vercel --prod
    
    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Restore backend directories
    Write-Host "🔄 Restoring backend directories..." -ForegroundColor Yellow
    
    if (Test-Path $tempBackendDir) {
        Move-Item $tempBackendDir "backend"
        Write-Host "✅ Restored backend directory" -ForegroundColor Green
    }
    
    if (Test-Path "$tempBackendDir-temp") {
        Move-Item "$tempBackendDir-temp" "backend-temp"
        Write-Host "✅ Restored backend-temp directory" -ForegroundColor Green
    }
}

Write-Host "🎉 Deployment process completed!" -ForegroundColor Green
Write-Host "Backend directories have been restored." -ForegroundColor Cyan
