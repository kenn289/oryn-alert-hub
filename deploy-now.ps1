# Quick deployment script - moves backend temporarily
Write-Host "🚀 Quick Frontend Deployment..." -ForegroundColor Green

# Move backend directories temporarily
if (Test-Path "backend") {
    Move-Item "backend" "backend-hidden"
    Write-Host "✅ Hidden backend directory" -ForegroundColor Green
}

if (Test-Path "backend-temp") {
    Move-Item "backend-temp" "backend-temp-hidden"
    Write-Host "✅ Hidden backend-temp directory" -ForegroundColor Green
}

# Deploy
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Green
vercel --prod

# Restore directories
if (Test-Path "backend-hidden") {
    Move-Item "backend-hidden" "backend"
    Write-Host "✅ Restored backend directory" -ForegroundColor Green
}

if (Test-Path "backend-temp-hidden") {
    Move-Item "backend-temp-hidden" "backend-temp"
    Write-Host "✅ Restored backend-temp directory" -ForegroundColor Green
}

Write-Host "🎉 Deployment completed!" -ForegroundColor Green
