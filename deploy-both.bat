@echo off
echo 🚀 Starting deployment of Oryn Alert Hub...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the root directory (oryn-alert-hub)
    pause
    exit /b 1
)

REM Deploy Frontend (Next.js)
echo 📦 Deploying Frontend (Next.js)...
vercel --prod --yes
if %errorlevel% equ 0 (
    echo ✅ Frontend deployed successfully!
) else (
    echo ❌ Frontend deployment failed!
)

REM Deploy Backend API
echo 🔧 Deploying Backend API...
cd backend-api
vercel --prod --yes
if %errorlevel% equ 0 (
    echo ✅ Backend API deployed successfully!
) else (
    echo ❌ Backend API deployment failed!
)
cd ..

echo 🎉 Deployment process completed!
echo 📝 Check your Vercel dashboard for deployment URLs
pause
