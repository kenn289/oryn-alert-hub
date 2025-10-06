# Final Working Startup Script
Write-Host "🚀 Starting Oryn Alert Hub Development Environment..." -ForegroundColor Green

# Start Backend
Write-Host "📡 Starting Backend Server (Port 3002)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node simple-backend.js"

# Wait for backend to start
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "🌐 Starting Frontend Server (Port 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "✅ Development environment started!" -ForegroundColor Green
Write-Host "📡 Backend: http://localhost:3002" -ForegroundColor Cyan
Write-Host "🌐 Frontend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "📊 Health Check: http://localhost:3002/api/health" -ForegroundColor Cyan
Write-Host "📈 Support Stats: http://localhost:3002/api/support/stats" -ForegroundColor Cyan
