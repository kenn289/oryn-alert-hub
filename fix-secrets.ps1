# Fix Secrets in Git History
Write-Host "🔒 Fixing secrets in Git history..." -ForegroundColor Red

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Not in a git repository!" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Current git status:" -ForegroundColor Yellow
git status

Write-Host "🔍 Checking for secrets in recent commits..." -ForegroundColor Yellow
git log --oneline -5

Write-Host "⚠️  SECURITY WARNING:" -ForegroundColor Red
Write-Host "GitHub detected secrets in your commit history!" -ForegroundColor Red
Write-Host "This includes your OpenAI API key and other sensitive data." -ForegroundColor Red

Write-Host "🛠️  SOLUTION OPTIONS:" -ForegroundColor Cyan
Write-Host "1. Remove secrets from git history (RECOMMENDED)" -ForegroundColor Green
Write-Host "2. Allow the secret in GitHub (NOT RECOMMENDED)" -ForegroundColor Yellow
Write-Host "3. Reset to a clean commit" -ForegroundColor Yellow

Write-Host "`n🔧 RECOMMENDED FIX:" -ForegroundColor Green
Write-Host "1. Remove .env.local from git tracking" -ForegroundColor White
Write-Host "2. Add .env.local to .gitignore" -ForegroundColor White
Write-Host "3. Remove secrets from git history" -ForegroundColor White
Write-Host "4. Force push clean history" -ForegroundColor White

Write-Host "`n⚠️  WARNING: This will rewrite git history!" -ForegroundColor Red
Write-Host "Make sure you have backups before proceeding." -ForegroundColor Red
