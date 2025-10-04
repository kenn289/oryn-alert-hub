# Real-Time Data Setup

## ⚠️ IMPORTANT: NO MOCK DATA

This application uses **ONLY REAL-TIME DATA** from live APIs. No mock data is used anywhere.

## Required API Keys

### 1. Alpha Vantage API (REQUIRED)
- **Purpose**: Real-time stock prices, volume, and market data
- **Cost**: FREE (500 requests/day)
- **Get API Key**: https://www.alphavantage.co/support/#api-key
- **Environment Variable**: `ALPHA_VANTAGE_API_KEY`

### 2. Setup Steps

1. **Get Alpha Vantage API Key**:
   - Go to https://www.alphavantage.co/support/#api-key
   - Sign up for free account
   - Copy your API key

2. **Set Environment Variable**:
   ```bash
   # Create .env.local file
   echo "ALPHA_VANTAGE_API_KEY=your_actual_api_key_here" > .env.local
   ```

3. **Restart Development Server**:
   ```bash
   npm run dev
   ```

## Real-Time Data Sources

### Stock Data
- **API**: Alpha Vantage Global Quote
- **Update Frequency**: Real-time (cached for 5 minutes)
- **Data**: Price, volume, change, high/low, open/close

### Alert Generation
- **Price Alerts**: Triggered by actual price movements (3%+ threshold)
- **Volume Alerts**: Based on real volume vs average (150%+ threshold)
- **Options Flow**: Real-time unusual activity detection

### No Mock Data
- ❌ No fake prices
- ❌ No simulated data
- ❌ No mock alerts
- ✅ Only real market data
- ✅ Only actual price movements
- ✅ Only genuine volume spikes

## Error Handling

If API calls fail:
- **No fallback to mock data**
- **Clear error messages** shown to user
- **Graceful degradation** (empty alerts instead of fake ones)

## API Rate Limits

- **Alpha Vantage**: 500 requests/day (free tier)
- **Caching**: 5-minute cache to reduce API calls
- **Optimization**: Batch requests when possible

## Troubleshooting

### "API key not configured" error
- Make sure `ALPHA_VANTAGE_API_KEY` is set in `.env.local`
- Restart the development server
- Check the API key is valid

### "No quote data available" error
- Check if the stock symbol is valid
- Verify API key has remaining requests
- Check Alpha Vantage service status

### No alerts appearing
- This is normal if there are no significant price movements
- Alerts only appear for real market activity
- Check your watchlist has stocks added

## Real-Time Features

✅ **Live Stock Prices**: Real-time from Alpha Vantage
✅ **Volume Analysis**: Actual trading volume data
✅ **Price Alerts**: Based on real price movements
✅ **Market Status**: Real market hours and timezone
✅ **Portfolio Tracking**: Real investment data
✅ **Analytics**: Based on actual performance

## No Mock Data Policy

This application is designed for **real financial data only**:
- All prices are live market data
- All alerts are based on actual movements
- All analytics use real performance metrics
- No simulated or fake data anywhere

If you see mock data, it means the API key is not configured properly.
