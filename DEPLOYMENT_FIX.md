# Deployment Fix Guide

## Problem
The deployment is failing because Vercel is looking for a "backend-api" root directory that doesn't exist. You have a monorepo structure with:
- Frontend (Next.js) in the root directory
- Backend API (Express.js) in the `backend-api/` subdirectory

## Solution Options

### Option 1: Deploy as Two Separate Vercel Projects (Recommended)

#### Frontend Deployment:
1. Go to Vercel Dashboard
2. Create a new project
3. Connect your GitHub repository
4. Set the following settings:
   - **Root Directory**: Leave empty (deploy from root)
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### Backend API Deployment:
1. Go to Vercel Dashboard
2. Create a new project
3. Connect your GitHub repository
4. Set the following settings:
   - **Root Directory**: `backend-api`
   - **Framework Preset**: Other
   - **Build Command**: `npm install`
   - **Output Directory**: Leave empty

### Option 2: Fix Current Configuration

If you want to keep the current setup, update your Vercel project settings:

1. Go to your Vercel project settings
2. In the "General" tab, find "Root Directory"
3. Set it to the correct path:
   - For frontend: Leave empty or set to `.`
   - For backend: Set to `backend-api`

### Option 3: Restructure Project (Alternative)

Move the backend-api to be a separate repository or restructure the project.

## Environment Variables

Make sure to set these environment variables in Vercel:

### Frontend (.env.local):
```
NEXT_PUBLIC_BASE_URL=https://your-frontend-domain.vercel.app
NEXT_PUBLIC_APP_URL=https://your-frontend-domain.vercel.app
BACKEND_URL=https://your-backend-domain.vercel.app
```

### Backend:
```
NODE_ENV=production
CORS_ORIGINS=https://your-frontend-domain.vercel.app
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## Quick Fix Commands

If you want to deploy immediately:

1. **Deploy Frontend** (from root directory):
   ```bash
   vercel --prod
   ```

2. **Deploy Backend** (from backend-api directory):
   ```bash
   cd backend-api
   vercel --prod
   ```

## Verification

After deployment, test these endpoints:
- Frontend: `https://your-frontend-domain.vercel.app`
- Backend Health: `https://your-backend-domain.vercel.app/api/health`
- Backend Stock: `https://your-backend-domain.vercel.app/api/stock/AAPL`
