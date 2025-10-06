# Backend Startup Script
Write-Host "🚀 Starting Oryn Backend Server..." -ForegroundColor Green

# Change to backend directory
Set-Location $PSScriptRoot

# Check if dist directory exists
if (-not (Test-Path "dist/server.js")) {
    Write-Host "❌ Backend not compiled. Building..." -ForegroundColor Yellow
    npx tsc src/server.ts --outDir dist --target es2020 --module commonjs --esModuleInterop --skipLibCheck
}

# Start the server
Write-Host "📡 Starting server on port 3002..." -ForegroundColor Cyan
node dist/server.js
