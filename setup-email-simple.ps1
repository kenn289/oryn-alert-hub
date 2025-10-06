Write-Host "Setting up Email Notifications for Oryn Support System" -ForegroundColor Green
Write-Host ""

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "Found .env.local file" -ForegroundColor Green
} else {
    Write-Host "Creating .env.local from template..." -ForegroundColor Yellow
    Copy-Item "env.template" ".env.local"
    Write-Host "Created .env.local from template" -ForegroundColor Green
}

Write-Host ""
Write-Host "EMAIL SETUP INSTRUCTIONS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Gmail Setup (Recommended):" -ForegroundColor Yellow
Write-Host "   - Go to: https://myaccount.google.com/security"
Write-Host "   - Enable 2-Factor Authentication"
Write-Host "   - Generate an App Password for Mail"
Write-Host "   - Use your Gmail address and the App Password"
Write-Host ""
Write-Host "2. Add these lines to your .env.local file:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   ADMIN_EMAIL=your-email@gmail.com" -ForegroundColor White
Write-Host "   SMTP_USER=your-email@gmail.com" -ForegroundColor White
Write-Host "   SMTP_PASS=your-16-character-app-password" -ForegroundColor White
Write-Host "   NEXT_PUBLIC_APP_URL=http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "3. After configuring, test by:" -ForegroundColor Yellow
Write-Host "   - Run: npm run dev" -ForegroundColor White
Write-Host "   - Go to: http://localhost:3000/dashboard" -ForegroundColor White
Write-Host "   - Create a test support ticket" -ForegroundColor White
Write-Host "   - Check your email!" -ForegroundColor White
Write-Host ""
Write-Host "Ready to test!" -ForegroundColor Green


