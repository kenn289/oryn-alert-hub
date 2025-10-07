@echo off
echo 🤖 Deploying Backend API with Real AI Service...

REM Navigate to backend-api
cd backend-api

REM Verify real AI service files exist
echo 🔍 Verifying real AI service files...

if not exist "ai\real-ai-analysis-service.js" (
    echo ❌ Real AI service file missing!
    cd ..
    pause
    exit /b 1
)

echo ✅ Real AI service files present

REM Test the real AI service locally
echo 🧪 Testing real AI service...
node -e "const RealAI = require('./ai/real-ai-analysis-service'); const ai = RealAI.getInstance(); console.log('✅ Real AI service loads successfully');"
if %errorlevel% neq 0 (
    echo ❌ Real AI service test failed
    cd ..
    pause
    exit /b 1
)

echo ✅ Real AI service test passed

REM Deploy to Vercel
echo 🚀 Deploying to Vercel...
vercel --prod --yes
if %errorlevel% neq 0 (
    echo ❌ Deployment failed
    cd ..
    pause
    exit /b 1
)

cd ..

echo 🎉 Real AI Backend Deployment Complete!
echo 🧪 Test your Real AI endpoints:
echo - Root: https://your-backend-url.vercel.app/
echo - Real AI Prediction: https://your-backend-url.vercel.app/api/stock/AAPL/predictions
echo - Real AI Insights: https://your-backend-url.vercel.app/api/ai/insights?symbols=AAPL,TSLA,MSFT
echo - Health: https://your-backend-url.vercel.app/api/health
pause
