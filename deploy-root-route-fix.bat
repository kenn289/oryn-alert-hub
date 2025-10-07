@echo off
echo 🔧 Fixing root route issue...

REM Navigate to backend-api
cd backend-api

REM Deploy the fix
echo 🚀 Deploying root route fix...
vercel --prod --yes

cd ..

echo ✅ Root route fix deployed!
echo 🧪 Test your backend now:
echo - Root: https://your-backend-url.vercel.app/
echo - Health: https://your-backend-url.vercel.app/api/health
echo - Stock: https://your-backend-url.vercel.app/api/stock/AAPL
pause
