# Frontend-Only Deployment Guide

## Problem Solved
The original issue was that Vercel was trying to run `npm install` in the `/backend` directory, causing the deployment to fail with:
```
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open '/vercel/path0/backend/package.json'
```

## Solution Applied

### 1. Updated `.vercelignore`
- Completely excludes the `backend/` directory
- Excludes `backend-temp/` directory
- Excludes all backend-related files that might cause conflicts
- Excludes documentation and test files

### 2. Updated `vercel.json`
- Added explicit framework specification: `"framework": "nextjs"`
- Added builds configuration to use `@vercel/next`
- Set production install command: `"installCommand": "npm install --production"`
- Added ignore command for clarity

### 3. Created Deployment Script
- `deploy-frontend-only.ps1` - PowerShell script for easy deployment
- Includes verification steps
- Provides clear feedback during deployment

## How to Deploy

### Option 1: Use the PowerShell Script
```powershell
.\deploy-frontend-only.ps1
```

### Option 2: Manual Vercel CLI Deployment
```bash
vercel --prod
```

### Option 3: Git Push (if connected to Vercel)
```bash
git add .
git commit -m "Fix Vercel deployment configuration"
git push origin main
```

## What This Fixes

1. **Backend Directory Exclusion**: Vercel will no longer try to install dependencies in the backend directory
2. **Frontend-Only Build**: Only the Next.js frontend will be built and deployed
3. **API Routing**: Backend API calls will be properly routed to your separate backend deployment
4. **Clean Deployment**: No more npm install errors in backend directory

## Verification

After deployment, verify:
1. Frontend loads correctly
2. API routes are properly proxied to your backend
3. No backend-related build errors
4. All frontend functionality works

## Backend Deployment

Your backend should be deployed separately to `https://oryn-backend.vercel.app` as configured in the rewrites section of `vercel.json`.
