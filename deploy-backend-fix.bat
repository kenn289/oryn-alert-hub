@echo off
echo 🚨 URGENT: Fixing Backend API Deployment...

REM Check if we're in the right directory
if not exist "backend-api" (
    echo ❌ Error: Please run from root directory (oryn-alert-hub)
    pause
    exit /b 1
)

REM Navigate to backend-api
cd backend-api

echo 🔧 Verifying backend-api structure...

REM Verify all required files exist
if not exist "index.js" (
    echo ❌ Missing required file: index.js
    pause
    exit /b 1
)
if not exist "api\index.js" (
    echo ❌ Missing required file: api\index.js
    pause
    exit /b 1
)
if not exist "package.json" (
    echo ❌ Missing required file: package.json
    pause
    exit /b 1
)
if not exist "vercel.json" (
    echo ❌ Missing required file: vercel.json
    pause
    exit /b 1
)

echo ✅ All required files present

REM Test locally first
echo 🧪 Testing backend locally...
node -e "const app = require('./index.js'); console.log('✅ Backend loads successfully'); process.exit(0);"
if %errorlevel% neq 0 (
    echo ❌ Backend test failed
    cd ..
    pause
    exit /b 1
)

echo ✅ Backend loads successfully

REM Deploy to Vercel
echo 🚀 Deploying to Vercel...
vercel --prod --yes
if %errorlevel% neq 0 (
    echo ❌ Deployment failed
    echo 💡 Try: Delete the Vercel project and recreate with Root Directory: backend-api
    cd ..
    pause
    exit /b 1
)

cd ..

echo 🎉 BACKEND DEPLOYMENT FIXED!
echo 📝 Next steps:
echo 1. Check your Vercel dashboard for the backend URL
echo 2. Test: https://your-backend-url.vercel.app/api/health
echo 3. Update frontend environment variables with backend URL
pause
