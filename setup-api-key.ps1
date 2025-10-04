# Setup Alpha Vantage API Key for Real-Time Stock Data
Write-Host "Oryn Alert Hub - API Key Setup" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

Write-Host "STEP 1: Get Alpha Vantage API Key" -ForegroundColor Yellow
Write-Host "1. Go to: https://www.alphavantage.co/support/#api-key" -ForegroundColor White
Write-Host "2. Sign up for a FREE account" -ForegroundColor White
Write-Host "3. Copy your API key" -ForegroundColor White
Write-Host ""

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host ".env.local file found" -ForegroundColor Green
} else {
    Write-Host "Creating .env.local file..." -ForegroundColor Yellow
    New-Item -Path ".env.local" -ItemType File -Force | Out-Null
}

Write-Host ""
Write-Host "STEP 2: Enter Your API Key" -ForegroundColor Yellow
Write-Host "Paste your Alpha Vantage API key below:" -ForegroundColor White
Write-Host ""

# Get API key from user
$apiKey = Read-Host "Enter your Alpha Vantage API key"

if ($apiKey -and $apiKey -ne "") {
    # Write to .env.local
    $envContent = "# Alpha Vantage API Key - REQUIRED for real-time stock data`nALPHA_VANTAGE_API_KEY=$apiKey`n`n# Other environment variables (optional)`nNEXT_PUBLIC_BASE_URL=http://localhost:3000"
    
    Set-Content -Path ".env.local" -Value $envContent
    
    Write-Host ""
    Write-Host "API key configured successfully!" -ForegroundColor Green
    Write-Host "Saved to: .env.local" -ForegroundColor Green
    Write-Host ""
    Write-Host "STEP 3: Restart Development Server" -ForegroundColor Yellow
    Write-Host "Run: npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "Your app will now use REAL-TIME stock data!" -ForegroundColor Green
    Write-Host "   - Live stock prices" -ForegroundColor White
    Write-Host "   - Real volume data" -ForegroundColor White
    Write-Host "   - Actual market movements" -ForegroundColor White
    Write-Host "   - No mock data anywhere" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "No API key provided" -ForegroundColor Red
    Write-Host "Please run this script again and enter a valid API key" -ForegroundColor Red
}

Write-Host ""
Write-Host "Documentation: REAL_TIME_SETUP.md" -ForegroundColor Cyan
Write-Host "Get API Key: https://www.alphavantage.co/support/#api-key" -ForegroundColor Cyan
