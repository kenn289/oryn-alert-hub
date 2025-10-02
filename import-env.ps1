# Import Environment Variables from .env.local to Vercel
# This script will read your .env.local file and set the variables in Vercel

Write-Host "🔑 Importing Environment Variables to Vercel" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ .env.local file not found!" -ForegroundColor Red
    Write-Host "Please make sure you have a .env.local file in your project root." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found .env.local file" -ForegroundColor Green

# Check if Vercel CLI is installed
try {
    vercel --version | Out-Null
    Write-Host "✅ Vercel CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

# Read .env.local file
Write-Host "Reading environment variables from .env.local..." -ForegroundColor Yellow

$envVars = @{}
Get-Content ".env.local" | ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.*)$") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $envVars[$key] = $value
        Write-Host "Found: $key" -ForegroundColor Cyan
    }
}

Write-Host "Found $($envVars.Count) environment variables" -ForegroundColor Green

# Set variables in Vercel
Write-Host "Setting environment variables in Vercel..." -ForegroundColor Yellow

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    Write-Host "Setting $key..." -ForegroundColor Yellow
    
    # Use Vercel CLI to set environment variable
    vercel env add $key production
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $key set successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to set $key" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Environment variables import completed!" -ForegroundColor Green
Write-Host "You can verify the variables in your Vercel dashboard:" -ForegroundColor Yellow
Write-Host "https://vercel.com/dashboard" -ForegroundColor Cyan
