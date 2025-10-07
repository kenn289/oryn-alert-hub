# URGENT: Backend API Deployment Fix
# This script fixes and deploys the backend API immediately

Write-Host "🚨 URGENT: Fixing Backend API Deployment..." -ForegroundColor Red

# Check if we're in the right directory
if (-not (Test-Path "backend-api")) {
    Write-Host "❌ Error: Please run from root directory (oryn-alert-hub)" -ForegroundColor Red
    exit 1
}

# Navigate to backend-api
Set-Location "backend-api"

Write-Host "🔧 Verifying backend-api structure..." -ForegroundColor Yellow

# Verify all required files exist
$requiredFiles = @("index.js", "api/index.js", "package.json", "vercel.json")
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Missing required file: $file" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ All required files present" -ForegroundColor Green

# Test locally first
Write-Host "🧪 Testing backend locally..." -ForegroundColor Yellow
try {
    $testResult = node -e "const app = require('./index.js'); console.log('✅ Backend loads successfully'); process.exit(0);"
    Write-Host "✅ Backend loads successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend test failed: $($_.Exception.Message)" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
try {
    vercel --prod --yes
    Write-Host "✅ Backend deployed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Try: Delete the Vercel project and recreate with Root Directory: backend-api" -ForegroundColor Cyan
    Set-Location ".."
    exit 1
}

Set-Location ".."

Write-Host "🎉 BACKEND DEPLOYMENT FIXED!" -ForegroundColor Green
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Check your Vercel dashboard for the backend URL" -ForegroundColor White
Write-Host "2. Test: https://your-backend-url.vercel.app/api/health" -ForegroundColor White
Write-Host "3. Update frontend environment variables with backend URL" -ForegroundColor White
