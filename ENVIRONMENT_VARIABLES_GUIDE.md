# Environment Variables Setup Guide

## Frontend Environment Variables (oryn-pi)

### Required Environment Variables

#### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Backend URL Configuration
```bash
BACKEND_URL=https://backend-diur0bmc7-kenneths-projects-29fb6d97.vercel.app
```

#### Base URL Configuration
```bash
NEXT_PUBLIC_BASE_URL=https://oryn-pi.vercel.app
NEXT_PUBLIC_APP_URL=https://oryn-pi.vercel.app
```

### Optional Environment Variables

#### Payment Processing (Razorpay)
```bash
NEXT_PUBLIC_RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
```

#### Stock Data APIs
```bash
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
OPENAI_API_KEY=your-openai-key
```

#### Redis Configuration
```bash
REDIS_URL=your-redis-url
```

#### Security Configuration
```bash
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX=60
```

#### Admin Configuration
```bash
ADMIN_EMAIL=admin@oryn.com
NEXT_PUBLIC_ADMIN_EMAIL=admin@oryn.com
```

#### Feature Flags
```bash
FEATURE_OPTIONS_FLOW=true
FEATURE_INSIDER_TRACKING=true
FEATURE_EARNINGS_SUMMARIES=true
FEATURE_HIGH_FREQUENCY_DATA=true
```

#### Worker Configuration
```bash
WORKER_WEBHOOK_SECRET=your-webhook-secret
QUEUE_URL=your-queue-url
```

## Backend Environment Variables (backend-api)

### Required Environment Variables

#### CORS Configuration
```bash
CORS_ORIGINS=https://oryn-pi.vercel.app,https://oryn-pi.vercel.app
```

#### Rate Limiting
```bash
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Environment
```bash
NODE_ENV=production
```

## How to Set Environment Variables in Vercel

### For Frontend (oryn-pi project):
1. Go to Vercel Dashboard
2. Select `oryn-pi` project
3. Go to Settings → Environment Variables
4. Add each variable with appropriate values

### For Backend (backend-api project):
1. Go to Vercel Dashboard
2. Select `backend-api` project
3. Go to Settings → Environment Variables
4. Add each variable with appropriate values

## Environment Variables by Priority

### Critical (Must Have)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BACKEND_URL`
- `NEXT_PUBLIC_BASE_URL`

### Important (Should Have)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `CORS_ORIGINS` (backend)

### Optional (Nice to Have)
- `ALPHA_VANTAGE_API_KEY`
- `OPENAI_API_KEY`
- `REDIS_URL`
- Feature flags
- Security keys

## Current Default Values

The application has fallback values for most environment variables, but for production you should set:

### Frontend Defaults
- `BACKEND_URL`: Currently hardcoded in vercel.json
- `NEXT_PUBLIC_BASE_URL`: Defaults to localhost
- Supabase: Has fallback URLs (but you should use your own)

### Backend Defaults
- `CORS_ORIGINS`: Defaults to localhost (should be your frontend URL)
- `RATE_LIMIT_WINDOW_MS`: 60000 (1 minute)
- `RATE_LIMIT_MAX_REQUESTS`: 100

## Security Notes

- Never commit `.env` files to Git
- Use Vercel's environment variables for production
- Keep sensitive keys secure
- Use different keys for development and production
