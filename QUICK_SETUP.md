# 🚀 Quick Setup - Real-Time Stock Data

## ⚠️ 500 Error Fix

The 500 error occurs because the Alpha Vantage API key is not configured. Follow these steps:

## 📋 Step 1: Get FREE API Key

1. **Go to**: https://www.alphavantage.co/support/#api-key
2. **Sign up** for free account
3. **Copy** your API key

## 📋 Step 2: Configure API Key

### Option A: Use Setup Script (Recommended)
```powershell
.\setup-api-key.ps1
```

### Option B: Manual Setup
1. Create `.env.local` file in project root
2. Add your API key:
```bash
ALPHA_VANTAGE_API_KEY=your_actual_api_key_here
```

## 📋 Step 3: Restart Server
```bash
npm run dev
```

## ✅ Verification

Test the API endpoint:
```bash
curl http://localhost:3000/api/stock/GOOGL
```

Should return real stock data, not 500 error.

## 🎯 What You Get

- ✅ **Real-time stock prices**
- ✅ **Live volume data** 
- ✅ **Actual market movements**
- ✅ **Real alerts** based on genuine data
- ❌ **NO mock data** anywhere

## 🔧 Troubleshooting

### Still getting 500 error?
1. Check `.env.local` file exists
2. Verify API key is correct
3. Restart development server
4. Check Alpha Vantage service status

### API key not working?
1. Verify key is active at Alpha Vantage
2. Check rate limits (500 requests/day free)
3. Ensure no extra spaces in .env.local

## 📚 Full Documentation

See `REAL_TIME_SETUP.md` for complete setup guide.

## 🆓 Free Tier Limits

- **500 requests/day** (free tier)
- **5 requests/minute** rate limit
- **Perfect for development** and small usage

## 🚨 Important

This app uses **ONLY REAL-TIME DATA**:
- No mock data anywhere
- No fake prices
- No simulated alerts
- Only genuine market data
