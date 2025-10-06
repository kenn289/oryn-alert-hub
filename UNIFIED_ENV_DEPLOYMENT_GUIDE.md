# 🚀 Unified Environment Configuration Guide

## 🚨 **CRITICAL ISSUE IDENTIFIED**

You currently have **TWO separate `.env.local` files** with **duplicate and conflicting variables**:

1. **Root `.env.local`** - Frontend variables
2. **Backend `.env.local`** - Backend variables

This **WILL cause deployment issues** on Vercel!

## 🔧 **SOLUTION: Unified Environment Setup**

### **Step 1: Create Unified .env.local**

Replace your current `.env.local` files with the unified template in `env-unified-template.txt`.

### **Step 2: Remove Duplicate Files**

```bash
# Remove the backend .env.local file
rm backend/.env.local

# Keep only the root .env.local (unified version)
```

### **Step 3: Update Vercel Configuration**

Create/update `vercel.json` in your root directory:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "src/app/api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

## 📊 **Environment Variable Organization**

### **Frontend Variables (NEXT_PUBLIC_*)**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_DISCORD_CLIENT_ID`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_APP_URL`

### **Backend Variables (Server-side only)**
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `OPENAI_API_KEY`
- `DISCORD_BOT_TOKEN`
- `RAZORPAY_KEY_SECRET`
- All Redis, ML, and monitoring variables

## 🚀 **Vercel Deployment Steps**

### **1. Environment Variables in Vercel Dashboard**

Go to your Vercel project → Settings → Environment Variables and add:

#### **Required Frontend Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=https://bwrurebhoxyozdjbokhe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_DISCORD_CLIENT_ID=1423157539041837067
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_ROUVLcLuL7BfUs
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

#### **Required Backend Variables:**
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=2Lk9Vf8qT5XhY7bM1aPzN4vR3eJ6dK8q
ENCRYPTION_KEY=Xm7Fj2Lp8KdN5VzQqRw4YeP1GtZbS9Hu
OPENAI_API_KEY=sk-proj-oFBsmXq0NswG12Lql1biHHWAvgK0Psl6f...
DISCORD_BOT_TOKEN=MTQyMzE1NzUzOTA0MTgzNzA2Nw...
RAZORPAY_KEY_SECRET=Et0LtoI8QtpdDvYUkBgGfAlC
REDIS_URL=redis://default:AUMDAAIncDI5MDVmNDRiMWMwYzQ0YTI5OGQyYTYxNzJmNDI3Nzg4YXAyMTcxNTU@glorious-honeybee-17155.upstash.io:6379
```

### **2. Backend Deployment (Separate Vercel Project)**

For the backend, create a **separate Vercel project**:

1. Create new Vercel project for backend
2. Set root directory to `backend/`
3. Add all backend environment variables
4. Deploy backend separately
5. Update frontend API calls to use backend URL

## ⚠️ **CRITICAL DEPLOYMENT CONSIDERATIONS**

### **1. Port Configuration**
- **Frontend**: Vercel handles automatically
- **Backend**: Use Vercel's serverless functions or separate deployment

### **2. CORS Configuration**
Update CORS origins for production:
```javascript
// In your backend
CORS_ORIGINS=https://your-app.vercel.app,https://your-backend.vercel.app
```

### **3. Database URLs**
Update database URLs for production:
```javascript
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 🎯 **RECOMMENDED DEPLOYMENT STRATEGY**

### **Option 1: Monorepo Deployment (Recommended)**
1. **Frontend**: Deploy to Vercel (main project)
2. **Backend**: Deploy as separate Vercel project
3. **Database**: Use Supabase (already configured)
4. **Environment**: Use unified `.env.local` for local development

### **Option 2: Full-Stack Single Deployment**
1. Deploy frontend to Vercel
2. Use Vercel's API routes for backend functionality
3. Move backend logic to `src/app/api/` routes
4. Use unified environment variables

## ✅ **IMMEDIATE ACTION REQUIRED**

1. **Replace your current `.env.local`** with the unified template
2. **Remove `backend/.env.local`** to avoid conflicts
3. **Update Vercel environment variables** with the unified configuration
4. **Test locally** with the unified environment
5. **Deploy to Vercel** with proper environment variable setup

## 🚨 **WARNING**

**DO NOT deploy with duplicate `.env.local` files!** This will cause:
- ❌ Environment variable conflicts
- ❌ Build failures
- ❌ Runtime errors
- ❌ Security issues
- ❌ Deployment failures

**Status**: 🚨 **CRITICAL - Fix Required Before Deployment**
