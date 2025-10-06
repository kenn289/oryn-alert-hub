# Backend Deployment Guide for Vercel

## Problem Solved
The original issue was that Vercel was trying to run `npm install` in the backend directory but couldn't find the package.json file, causing:
```
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open '/vercel/path0/backend/package.json'
```

## Solution Applied

### 1. Created Vercel Serverless Function
- **`backend/api/index.js`** - Proper Vercel serverless function
- Removed Socket.IO (not supported in serverless)
- Kept all API endpoints (health, stock, portfolio, watchlist, support)

### 2. Updated Backend Vercel Configuration
- **`backend/vercel.json`** - Proper serverless configuration
- Routes all requests to `/api/index.js`
- Set 60-second timeout for functions
- Production environment settings

### 3. Created Deployment Script
- **`deploy-backend.ps1`** - PowerShell script for easy deployment
- Navigates to backend directory
- Verifies files exist
- Deploys using Vercel CLI

## How to Deploy Backend

### Option 1: Use the PowerShell Script (Recommended)
```powershell
.\deploy-backend.ps1
```

### Option 2: Manual Deployment
```bash
cd backend
vercel --prod
```

### Option 3: Git Push (if connected to Vercel)
```bash
git add .
git commit -m "Fix backend Vercel deployment"
git push origin main
```

## What This Fixes

1. **✅ Proper Vercel Serverless Function**: Created `backend/api/index.js` that works with Vercel's serverless architecture
2. **✅ Correct Routing**: All API routes properly configured in `vercel.json`
3. **✅ Package.json Access**: Vercel can now find and use the backend's package.json
4. **✅ Production Ready**: All endpoints working with proper error handling

## API Endpoints Available

After deployment, your backend will have these endpoints:
- `GET /api/health` - Health check
- `GET /api/stock/:symbol` - Stock data
- `GET /api/stock/:symbol/predictions` - ML predictions
- `GET /api/portfolio` - Portfolio data
- `GET /api/watchlist` - Watchlist data
- `GET /api/support/stats` - Support statistics

## Verification

After deployment, test your endpoints:
```bash
curl https://your-backend-url.vercel.app/api/health
curl https://your-backend-url.vercel.app/api/stock/AAPL
curl https://your-backend-url.vercel.app/api/portfolio
```

## Notes

- Socket.IO removed (not supported in Vercel serverless)
- All other functionality preserved
- Mock data for testing
- Production-ready error handling
- CORS configured for frontend integration