# 🚀 Separate Deployments Guide - Option 1

## Overview
Deploy frontend and backend as separate Vercel projects for maximum reliability and scalability.

## 📋 **Deployment Steps**

### **Step 1: Deploy Backend First**

1. **Create Backend Vercel Project**
   ```bash
   cd backend
   vercel
   ```

2. **Set Environment Variables**
   - Go to backend project dashboard
   - Add all variables from `BACKEND_ENV_VARS.md`
   - Update `CORS_ORIGINS` with your frontend URL

3. **Deploy Backend**
   ```bash
   vercel --prod
   ```

4. **Test Backend**
   ```bash
   curl https://your-backend-app.vercel.app/api/health
   ```

### **Step 2: Deploy Frontend**

1. **Create Frontend Vercel Project**
   ```bash
   vercel
   ```

2. **Set Environment Variables**
   - Go to frontend project dashboard
   - Add all variables from `FRONTEND_ENV_VARS.md`
   - Update `BACKEND_URL` with your backend URL

3. **Deploy Frontend**
   ```bash
   vercel --prod
   ```

4. **Test Frontend**
   - Visit your frontend URL
   - Test API calls to backend

## 🔧 **Configuration Files**

### **Frontend Configuration**
- ✅ `next.config.mjs` - Updated with dynamic backend URL
- ✅ `vercel.json` - Frontend deployment config
- ✅ `FRONTEND_ENV_VARS.md` - Environment variables list

### **Backend Configuration**
- ✅ `backend/vercel.json` - Backend deployment config
- ✅ `backend/package.json` - Dependencies and scripts
- ✅ `BACKEND_ENV_VARS.md` - Environment variables list

## 🚀 **Quick Deployment Commands**

### **Deploy Backend**
```powershell
.\deploy-backend.ps1
```

### **Deploy Frontend**
```powershell
.\deploy-frontend.ps1
```

## 📊 **Environment Variable Management**

### **Frontend Variables (Public)**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_DISCORD_CLIENT_ID`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `BACKEND_URL`

### **Backend Variables (Private)**
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `OPENAI_API_KEY`
- `DISCORD_BOT_TOKEN`
- `RAZORPAY_KEY_SECRET`
- All Redis, ML, and monitoring variables

## 🔄 **API Communication**

### **Frontend → Backend**
- Frontend makes API calls to `/api/*`
- Next.js rewrites route to backend URL
- Backend processes requests and returns data

### **CORS Configuration**
- Backend allows frontend domain
- Frontend proxies API calls
- Secure communication between services

## ✅ **Testing Checklist**

### **Backend Testing**
- [ ] Health check: `GET /api/health`
- [ ] Support stats: `GET /api/support/stats`
- [ ] Stock data: `GET /api/stock/AAPL`
- [ ] Portfolio: `GET /api/portfolio`
- [ ] Watchlist: `GET /api/watchlist`

### **Frontend Testing**
- [ ] Homepage loads
- [ ] Authentication works
- [ ] API calls to backend
- [ ] Real-time features
- [ ] All components render

## 🚨 **Common Issues & Solutions**

### **Issue 1: CORS Errors**
**Solution**: Update `CORS_ORIGINS` in backend with frontend URL

### **Issue 2: Environment Variables Not Loading**
**Solution**: Check variable names and values in Vercel dashboard

### **Issue 3: API Calls Failing**
**Solution**: Verify `BACKEND_URL` is correct in frontend

### **Issue 4: Build Failures**
**Solution**: Check dependencies and build scripts

## 📈 **Production Optimizations**

### **Frontend Optimizations**
- ✅ Next.js production build
- ✅ Static asset optimization
- ✅ API route caching
- ✅ CDN distribution

### **Backend Optimizations**
- ✅ Serverless functions
- ✅ Connection pooling
- ✅ Caching strategies
- ✅ Rate limiting

## 🎯 **Deployment Order**

1. **Backend First** (Required for frontend)
2. **Frontend Second** (Uses backend URL)
3. **Test Integration** (Verify communication)
4. **Monitor Performance** (Check logs and metrics)

## 🚀 **Ready to Deploy!**

Follow the steps above to deploy both frontend and backend as separate Vercel projects. This approach provides:

- ✅ **Maximum Reliability**: Independent deployments
- ✅ **Easy Scaling**: Scale frontend and backend separately
- ✅ **Better Security**: Isolated environments
- ✅ **Simplified Debugging**: Clear separation of concerns

**Status**: 🎉 **Ready for Separate Deployments!**
