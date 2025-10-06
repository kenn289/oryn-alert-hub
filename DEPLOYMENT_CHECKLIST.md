# 🚀 Deployment Checklist - Oryn Alert Hub

## 📋 **Your Deployment URLs**
- **Frontend**: `https://oryn-pi.vercel.app`
- **Backend**: `https://oryn-backend.vercel.app` (to be created)
- **Database**: Supabase (already configured)

## ✅ **Step 1: Deploy Backend First**

### **Backend Vercel Project Setup**
1. **Create New Vercel Project**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import from GitHub (select your repo)
   - Set **Root Directory** to `backend/`
   - Project name: `oryn-backend`

2. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all variables from `BACKEND_ENV_VARS.md`
   - **Important**: `CORS_ORIGINS=https://oryn-pi.vercel.app/`

3. **Deploy Backend**
   ```bash
   cd backend
   vercel --prod
   ```

4. **Test Backend**
   ```bash
   curl https://oryn-backend.vercel.app/api/health
   ```

## ✅ **Step 2: Deploy Frontend**

### **Frontend Vercel Project Setup**
1. **Create New Vercel Project**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import from GitHub (select your repo)
   - Set **Root Directory** to `/` (root)
   - Project name: `oryn-pi`

2. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all variables from `FRONTEND_ENV_VARS.md`
   - **Important**: `BACKEND_URL=https://oryn-backend.vercel.app`

3. **Deploy Frontend**
   ```bash
   vercel --prod
   ```

4. **Test Frontend**
   - Visit `https://oryn-pi.vercel.app`
   - Test API calls to backend

## 🔧 **Environment Variables Summary**

### **Backend Environment Variables**
```
SUPABASE_URL=https://bwrurebhoxyozdjbokhe.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=2Lk9Vf8qT5XhY7bM1aPzN4vR3eJ6dK8q
ENCRYPTION_KEY=Xm7Fj2Lp8KdN5VzQqRw4YeP1GtZbS9Hu
OPENAI_API_KEY=sk-proj-oFBsmXq0NswG12Lql1biHHWAvgK0Psl6f...
DISCORD_BOT_TOKEN=MTQyMzE1NzUzOTA0MTgzNzA2Nw...
RAZORPAY_KEY_SECRET=Et0LtoI8QtpdDvYUkBgGfAlC
REDIS_URL=redis://default:AUMDAAIncDI5MDVmNDRiMWMwYzQ0YTI5OGQyYTYxNzJmNDI3Nzg4YXAyMTcxNTU@glorious-honeybee-17155.upstash.io:6379
CORS_ORIGINS=https://oryn-pi.vercel.app/
NODE_ENV=production
```

### **Frontend Environment Variables**
```
NEXT_PUBLIC_SUPABASE_URL=https://bwrurebhoxyozdjbokhe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_DISCORD_CLIENT_ID=1423157539041837067
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_ROUVLcLuL7BfUs
NEXT_PUBLIC_BASE_URL=https://oryn-pi.vercel.app
NEXT_PUBLIC_APP_URL=https://oryn-pi.vercel.app
BACKEND_URL=https://oryn-backend.vercel.app
NODE_ENV=production
```

## 🧪 **Testing Checklist**

### **Backend Testing**
- [ ] `GET https://oryn-backend.vercel.app/api/health`
- [ ] `GET https://oryn-backend.vercel.app/api/support/stats`
- [ ] `GET https://oryn-backend.vercel.app/api/stock/AAPL`
- [ ] `GET https://oryn-backend.vercel.app/api/portfolio`
- [ ] `GET https://oryn-backend.vercel.app/api/watchlist`

### **Frontend Testing**
- [ ] Homepage loads: `https://oryn-pi.vercel.app`
- [ ] Authentication works
- [ ] API calls to backend succeed
- [ ] Real-time features work
- [ ] All components render properly

### **Integration Testing**
- [ ] Frontend can communicate with backend
- [ ] CORS is properly configured
- [ ] Database operations work
- [ ] Real-time updates function

## 🚨 **Common Issues & Solutions**

### **Issue 1: CORS Errors**
**Solution**: Ensure `CORS_ORIGINS=https://oryn-pi.vercel.app/` in backend

### **Issue 2: API Calls Failing**
**Solution**: Verify `BACKEND_URL=https://oryn-backend.vercel.app` in frontend

### **Issue 3: Environment Variables Not Loading**
**Solution**: Check variable names and values in Vercel dashboard

### **Issue 4: Build Failures**
**Solution**: Check dependencies and build scripts

## 🎯 **Deployment Order**

1. **✅ Backend First** - Required for frontend
2. **✅ Frontend Second** - Uses backend URL
3. **✅ Test Integration** - Verify communication
4. **✅ Monitor Performance** - Check logs and metrics

## 🚀 **Ready to Deploy!**

Your configuration is now ready for deployment with the correct URLs:
- **Frontend**: `https://oryn-pi.vercel.app`
- **Backend**: `https://oryn-backend.vercel.app`

**Status**: 🎉 **Ready for Deployment!**
