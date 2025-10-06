# Complete Deployment Guide - Frontend & Backend

## Project Structure
- **Frontend**: Next.js app in root directory (`./`)
- **Backend**: Express.js app in `./backend` directory

## Frontend Deployment (Root `./`)

### Files:
- `vercel.json` - Frontend Vercel configuration
- `.vercelignore` - Excludes backend files
- `deploy-frontend.ps1` - Frontend deployment script

### Deploy Frontend:
```powershell
.\deploy-frontend.ps1
```

### Manual Frontend Deployment:
```bash
vercel --prod
```

## Backend Deployment (Root `./backend`)

### Files:
- `backend/vercel.json` - Backend Vercel configuration
- `backend/api/index.js` - Vercel serverless function
- `deploy-backend.ps1` - Backend deployment script

### Deploy Backend:
```powershell
.\deploy-backend.ps1
```

### Manual Backend Deployment:
```bash
cd backend
vercel --prod
```

## What Each Deployment Does

### Frontend Deployment:
- ✅ Deploys Next.js app from root directory
- ✅ Excludes backend files via `.vercelignore`
- ✅ Routes API calls to backend URL
- ✅ Handles frontend routing and pages

### Backend Deployment:
- ✅ Deploys Express.js backend from `./backend`
- ✅ Creates serverless functions from `backend/api/index.js`
- ✅ Handles all API endpoints
- ✅ Provides backend services for frontend

## API Endpoints (Backend)
- `GET /api/health` - Health check
- `GET /api/stock/:symbol` - Stock data
- `GET /api/stock/:symbol/predictions` - ML predictions
- `GET /api/portfolio` - Portfolio data
- `GET /api/watchlist` - Watchlist data
- `GET /api/support/stats` - Support statistics

## Deployment Order
1. **Deploy Backend First** - Get the backend URL
2. **Update Frontend** - Update backend URL in frontend config
3. **Deploy Frontend** - Deploy frontend with correct backend URL

## Environment Variables
- Frontend: `BACKEND_URL` - URL of deployed backend
- Backend: Standard Node.js environment variables

## Verification
After deployment, test:
- Frontend loads correctly
- API calls are routed to backend
- All endpoints respond properly
- No CORS issues

## Troubleshooting
- If backend deployment fails: Check `backend/package.json` exists
- If frontend deployment fails: Check Next.js configuration
- If API calls fail: Verify backend URL in frontend config
