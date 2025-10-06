# Deployment URLs

## Current Deployments

### Frontend (Next.js)
- **Project Name**: oryn-pi
- **URL**: https://oryn-pi.vercel.app
- **Status**: ✅ Deployed and Working

### Backend (Express.js)
- **Project Name**: backend-api
- **URL**: https://backend-api-gray-six.vercel.app
- **Status**: ✅ Deployed and Working
- **Git Connected**: ✅ Yes (auto-deploys from repository)

## Other Projects (Kept)
- **stryde**: https://stryde-kappa.vercel.app
- **kenneth.oswin**: https://kennethoswin.vercel.app

## API Endpoints (Backend)
- `GET /api/health` - Health check
- `GET /api/stock/:symbol` - Stock data
- `GET /api/portfolio` - Portfolio data
- `GET /api/watchlist` - Watchlist data
- `GET /api/support/stats` - Support statistics

## Frontend API Routing
The frontend automatically routes API calls to the backend:
- `/api/stock/*` → Backend stock endpoints
- `/api/portfolio` → Backend portfolio endpoint
- `/api/watchlist` → Backend watchlist endpoint
- `/api/health` → Backend health endpoint
- `/api/support/*` → Backend support endpoints

## Custom Domain Setup (Optional)
To set up a custom domain like `oryn-pi.com`:

1. Go to Vercel Dashboard
2. Select the `oryn-pi` project
3. Go to Settings → Domains
4. Add your custom domain
5. Update DNS records as instructed

## Auto-Deployment Setup

Both frontend and backend are now connected to the Git repository and will auto-deploy when you push changes:

### Frontend Auto-Deployment
- **Connected to**: `oryn-pi` Vercel project
- **Triggers on**: Push to `main` branch
- **Directory**: Root of repository

### Backend Auto-Deployment  
- **Connected to**: `backend-api` Vercel project
- **Triggers on**: Push to `main` branch
- **Directory**: `backend-api/` folder

## Manual Deployment Commands

### Frontend Deployment
```bash
vercel --prod --yes
```

### Backend Deployment
```bash
cd backend-api
vercel --prod --yes
```

## Notes
- Frontend and backend are deployed as separate Vercel projects
- API routing is handled by Vercel rewrites
- Both deployments are production-ready
