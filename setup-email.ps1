# Email Setup Script for Oryn Support System
# This script helps you set up Gmail SMTP for support ticket notifications

Write-Host "🚀 Setting up Email Notifications for Oryn Support System" -ForegroundColor Green
Write-Host ""

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "✅ Found .env.local file" -ForegroundColor Green
} else {
    Write-Host "❌ .env.local file not found. Creating one..." -ForegroundColor Yellow
    Copy-Item "env.template" ".env.local"
    Write-Host "✅ Created .env.local from template" -ForegroundColor Green
}

Write-Host ""
Write-Host "📧 EMAIL SETUP INSTRUCTIONS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Gmail Setup (Recommended):" -ForegroundColor Yellow
Write-Host "   - Go to: https://myaccount.google.com/security"
Write-Host "   - Enable 2-Factor Authentication"
Write-Host "   - Generate an 'App Password' for 'Mail'"
Write-Host "   - Use your Gmail address and the App Password"
Write-Host ""
Write-Host "2. Add these lines to your .env.local file:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   # Email Configuration" -ForegroundColor Gray
Write-Host "   ADMIN_EMAIL=your-email@gmail.com" -ForegroundColor White
Write-Host "   SMTP_USER=your-email@gmail.com" -ForegroundColor White
Write-Host "   SMTP_PASS=your-16-character-app-password" -ForegroundColor White
Write-Host "   NEXT_PUBLIC_APP_URL=http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "3. Alternative Email Services:" -ForegroundColor Yellow
Write-Host "   - SendGrid: https://sendgrid.com/ (Free tier: 100 emails/day)"
Write-Host "   - Resend: https://resend.com/ (Free tier: 3,000 emails/month)"
Write-Host "   - Mailgun: https://mailgun.com/ (Free tier: 5,000 emails/month)"
Write-Host ""

# Check current .env.local content
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "ADMIN_EMAIL") {
        Write-Host "✅ ADMIN_EMAIL is already configured" -ForegroundColor Green
    } else {
        Write-Host "⚠️  ADMIN_EMAIL not found in .env.local" -ForegroundColor Yellow
    }
    
    if ($envContent -match "SMTP_USER") {
        Write-Host "✅ SMTP_USER is already configured" -ForegroundColor Green
    } else {
        Write-Host "⚠️  SMTP_USER not found in .env.local" -ForegroundColor Yellow
    }
    
    if ($envContent -match "SMTP_PASS") {
        Write-Host "✅ SMTP_PASS is already configured" -ForegroundColor Green
    } else {
        Write-Host "⚠️  SMTP_PASS not found in .env.local" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🧪 TESTING YOUR SETUP:" -ForegroundColor Cyan
Write-Host ""
Write-Host "After configuring your email settings:" -ForegroundColor Yellow
Write-Host "1. Run: npm run dev" -ForegroundColor White
Write-Host "2. Go to: http://localhost:3000/dashboard" -ForegroundColor White
Write-Host "3. Scroll to 'Priority Support' section" -ForegroundColor White
Write-Host "4. Click 'Contact Support' and create a test ticket" -ForegroundColor White
Write-Host "5. Check your email for the notification!" -ForegroundColor White
Write-Host ""
Write-Host "📋 SUPPORT TICKET FEATURES:" -ForegroundColor Cyan
Write-Host "✅ Create tickets with priority levels" -ForegroundColor Green
Write-Host "✅ Email notifications to admin" -ForegroundColor Green
Write-Host "✅ Real-time ticket tracking" -ForegroundColor Green
Write-Host "✅ Ticket status management" -ForegroundColor Green
Write-Host "✅ Rating system for resolved tickets" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 You can manage tickets by:" -ForegroundColor Cyan
Write-Host "• Replying to the email notification" -ForegroundColor White
Write-Host "• Updating ticket status in the database" -ForegroundColor White
Write-Host "• Using the admin dashboard (if you build one)" -ForegroundColor White
Write-Host ""
Write-Host "Ready to test!" -ForegroundColor Green
