# Oryn Alert Hub - Vercel Deployment Script
# Run this script to deploy your application to Vercel

Write-Host "🚀 Oryn Alert Hub - Vercel Deployment" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Check if Vercel CLI is installed
Write-Host "Checking Vercel CLI..." -ForegroundColor Yellow
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Vercel CLI. Please install manually:" -ForegroundColor Red
        Write-Host "npm install -g vercel" -ForegroundColor Yellow
        exit 1
    }
}

# Check if user is logged in
Write-Host "Checking Vercel authentication..." -ForegroundColor Yellow
try {
    vercel whoami | Out-Null
    Write-Host "✅ Logged in to Vercel" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to Vercel. Please login:" -ForegroundColor Red
    Write-Host "vercel login" -ForegroundColor Yellow
    vercel login
}

# Deploy to Vercel
Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Yellow

vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 Deployment successful!" -ForegroundColor Green
    Write-Host "Your app is now live on Vercel!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Set up environment variables in Vercel dashboard" -ForegroundColor White
    Write-Host "2. Configure your database (Supabase)" -ForegroundColor White
    Write-Host "3. Test all features" -ForegroundColor White
    Write-Host ""
    Write-Host "Check DEPLOYMENT.md for detailed instructions" -ForegroundColor Cyan
} else {
    Write-Host "❌ Deployment failed. Check the error messages above." -ForegroundColor Red
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "- Environment variables not set" -ForegroundColor White
    Write-Host "- Build errors (run 'npm run build' to check)" -ForegroundColor White
    Write-Host "- Network connectivity issues" -ForegroundColor White
}
