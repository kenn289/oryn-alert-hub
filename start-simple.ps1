# Simple Development Startup
Write-Host "🚀 Starting Oryn Alert Hub..." -ForegroundColor Green

# Start Backend in new window
Write-Host "📡 Starting Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Kenneth Oswin\Oryn\oryn-alert-hub\backend'; node dist/server.js"

# Wait for backend
Start-Sleep -Seconds 5

# Start Frontend in new window  
Write-Host "🌐 Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Kenneth Oswin\Oryn\oryn-alert-hub'; npm run dev"

Write-Host "✅ Both servers starting in separate windows!" -ForegroundColor Green
Write-Host "📡 Backend: http://localhost:3002" -ForegroundColor Cyan
Write-Host "🌐 Frontend: http://localhost:3001" -ForegroundColor Cyan
