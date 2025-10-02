# Setup GitHub Repository and Push to Main Branch
# Run this script after creating your GitHub repository

Write-Host "🚀 Setting up GitHub Repository" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

# Get GitHub repository URL from user
$githubUrl = Read-Host "Enter your GitHub repository URL (e.g., https://github.com/yourusername/oryn-alert-hub.git)"

if (-not $githubUrl) {
    Write-Host "❌ No URL provided. Please create a repository on GitHub first:" -ForegroundColor Red
    Write-Host "1. Go to https://github.com/new" -ForegroundColor Yellow
    Write-Host "2. Repository name: oryn-alert-hub" -ForegroundColor Yellow
    Write-Host "3. Description: Oryn Alert Hub - Stock Intelligence Platform" -ForegroundColor Yellow
    Write-Host "4. Make it Public" -ForegroundColor Yellow
    Write-Host "5. DON'T initialize with README" -ForegroundColor Yellow
    Write-Host "6. Click Create repository" -ForegroundColor Yellow
    Write-Host "7. Copy the repository URL and run this script again" -ForegroundColor Yellow
    exit 1
}

Write-Host "Setting up remote repository..." -ForegroundColor Yellow

# Add remote origin
git remote add origin $githubUrl

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to add remote. The URL might be incorrect." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Remote added successfully" -ForegroundColor Green

# Push to main branch
Write-Host "Pushing to main branch..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "Your repository is now available at: $githubUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Go to Vercel dashboard" -ForegroundColor White
    Write-Host "2. Import your GitHub repository" -ForegroundColor White
    Write-Host "3. Add environment variables" -ForegroundColor White
    Write-Host "4. Deploy!" -ForegroundColor White
} else {
    Write-Host "❌ Failed to push to GitHub. Check your internet connection and try again." -ForegroundColor Red
}
