@echo off
echo 🚀 Starting Oryn Alert Hub Development Environment...

echo 📡 Starting Backend Server (Port 3002)...
start "Backend Server" cmd /k "cd backend && node dist/server.js"

timeout /t 3 /nobreak > nul

echo 🌐 Starting Frontend Server (Port 3001)...
start "Frontend Server" cmd /k "npm run dev"

echo ✅ Development environment started!
echo 📡 Backend: http://localhost:3002
echo 🌐 Frontend: http://localhost:3001
echo 📊 Health Check: http://localhost:3002/api/health

pause
