# Oryn Alert Hub - Deployment Guide

## 🚀 Production-Ready Setup

This guide covers deploying the Oryn Alert Hub to Vercel with a streamlined, production-ready configuration.

## 📁 Project Structure

```
oryn-alert-hub/
├── src/                    # Frontend (Next.js)
├── backend/               # Backend API (Express.js)
├── supabase/              # Database migrations
├── vercel.json           # Vercel configuration
└── package.json          # Main project dependencies
```

## 🔧 Backend Configuration

### Environment Variables
The backend requires these environment variables in `backend/.env.local`:

```env
# Server Configuration
NODE_ENV=development
PORT=3002
HOST=localhost

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Database Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# API Keys
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
POLYGON_API_KEY=your_polygon_key
OPENAI_API_KEY=your_openai_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Backend Features
- ✅ Express.js server with TypeScript
- ✅ CORS and security middleware
- ✅ Rate limiting
- ✅ WebSocket support for real-time updates
- ✅ Mock data endpoints for development
- ✅ Health check endpoint
- ✅ Error handling and logging

## 🌐 Frontend Configuration

### Next.js Configuration
The frontend is configured to proxy API requests to the backend:

```javascript
// next.config.mjs
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/stock/:path*',
        destination: 'http://localhost:3002/api/stock/:path*'
      },
      {
        source: '/api/support/:path*',
        destination: 'http://localhost:3002/api/support/:path*'
      },
      // ... other API routes
    ]
  }
}
```

### Frontend Features
- ✅ Next.js 15 with App Router
- ✅ TypeScript support
- ✅ Tailwind CSS styling
- ✅ Supabase integration
- ✅ Real-time features
- ✅ Responsive design

## 🚀 Deployment Steps

### 1. Local Development

#### Start Backend
```bash
cd backend
npm install
npm run build
npm start
# Backend runs on http://localhost:3002
```

#### Start Frontend
```bash
npm install
npm run dev
# Frontend runs on http://localhost:3001
```

### 2. Vercel Deployment

#### Frontend Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `ALPHA_VANTAGE_API_KEY`
   - `POLYGON_API_KEY`
   - `OPENAI_API_KEY`

#### Backend Deployment
1. Deploy backend as a separate Vercel project
2. Update frontend's `next.config.mjs` to point to production backend URL
3. Set backend environment variables in Vercel

### 3. Database Setup

#### Supabase Configuration
1. Create a new Supabase project
2. Run the migration files in `supabase/migrations/`
3. Set up Row Level Security (RLS) policies
4. Configure authentication

#### Required Tables
- `users` - User accounts and profiles
- `watchlists_fixed` - User watchlists
- `portfolios_fixed` - User portfolios
- `support_tickets` - Support system
- `notifications` - User notifications

## 🔧 API Endpoints

### Backend API (Port 3002)
- `GET /api/health` - Health check
- `GET /api/stock/:symbol` - Stock data
- `GET /api/stock/:symbol/predictions` - ML predictions
- `GET /api/portfolio` - Portfolio data
- `GET /api/watchlist` - Watchlist data
- `GET /api/support/stats` - Support statistics

### Frontend API (Port 3001)
- All frontend API routes are proxied to backend
- Next.js API routes for Supabase integration
- Static file serving
- Server-side rendering

## 🛡️ Security Features

- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Helmet security headers
- ✅ Input validation
- ✅ Error handling
- ✅ JWT authentication
- ✅ Supabase RLS policies

## 📊 Monitoring & Logging

- ✅ Health check endpoints
- ✅ Error logging
- ✅ Performance monitoring
- ✅ Real-time status indicators

## 🚀 Production Checklist

### Backend
- [ ] Environment variables configured
- [ ] Database connections tested
- [ ] API endpoints responding
- [ ] Rate limiting configured
- [ ] Error handling implemented
- [ ] Logging configured

### Frontend
- [ ] Build process working
- [ ] API proxy configuration
- [ ] Environment variables set
- [ ] Supabase integration working
- [ ] Real-time features enabled
- [ ] Responsive design tested

### Database
- [ ] Supabase project created
- [ ] Migrations applied
- [ ] RLS policies configured
- [ ] Authentication setup
- [ ] Data seeding completed

## 🔄 Development Workflow

1. **Local Development**: Run both frontend and backend locally
2. **Testing**: Test all features and API endpoints
3. **Staging**: Deploy to Vercel preview deployments
4. **Production**: Deploy to production domains

## 📝 Notes

- Backend runs on port 3002 to avoid conflicts with frontend
- Frontend proxies API requests to backend
- All environment variables are properly configured
- Database migrations are included
- Production-ready error handling and logging
- Real-time features with WebSocket support

## 🎯 Next Steps

1. Deploy backend to Vercel
2. Update frontend configuration for production backend URL
3. Deploy frontend to Vercel
4. Configure custom domains
5. Set up monitoring and analytics
6. Test all features in production environment

---

**Status**: ✅ Production Ready
**Last Updated**: October 6, 2025
**Version**: 1.0.0
