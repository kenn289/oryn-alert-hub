# Rate Limit Handling & Cached Data System

This document explains how the Oryn Alert Hub handles API rate limits and provides users with cached data when limits are exceeded.

## 🚀 Overview

When API rate limits are exceeded, instead of showing errors, the system:
1. **Shows the last fetched data** from cache
2. **Clearly indicates** that data is cached due to rate limits
3. **Provides visual indicators** of data freshness
4. **Allows users to retry** when limits reset

## 🏗️ System Architecture

### 1. Enhanced Data Cache (`src/lib/data-cache.ts`)
- **Purpose**: Intelligent caching with fallback mechanisms
- **Features**:
  - Automatic fallback to cached data on rate limits
  - Data freshness tracking and metadata
  - Configurable cache expiration
  - Rate limit detection and handling

### 2. Data Freshness Indicators (`src/components/DataFreshnessIndicator.tsx`)
- **Purpose**: Visual feedback about data source and age
- **Components**:
  - `DataFreshnessIndicator`: Full indicator with details
  - `InlineDataIndicator`: Compact inline version
  - `RateLimitBanner`: Prominent warning banner

### 3. Enhanced Stock Data Service
- **Purpose**: Seamless integration of caching with API calls
- **Features**:
  - Automatic rate limit detection
  - Fallback to cached data
  - Metadata attachment to responses

## 📊 Data States

### Fresh Data (Live)
- **Indicator**: 🟢 Live
- **Description**: Real-time data from API
- **Color**: Green
- **Age**: Just now

### Cached Data (Recent)
- **Indicator**: 🟡 5m ago
- **Description**: Recently cached data
- **Color**: Yellow
- **Age**: Minutes to hours old

### Fallback Data (Rate Limited)
- **Indicator**: 🔴 Rate Limited
- **Description**: Using cached data due to API limits
- **Color**: Red
- **Age**: Variable (up to 24 hours)

## 🎯 User Experience

### When Rate Limits Are Hit

1. **Immediate Fallback**: System automatically uses cached data
2. **Clear Notification**: Users see rate limit warning banner
3. **Data Indicators**: Each data point shows its freshness status
4. **Retry Options**: Users can retry when limits reset

### Visual Indicators

#### Rate Limit Banner
```
⚠️ API Rate Limit Reached
We're showing cached data to avoid exceeding API limits. 
Fresh data will resume automatically.
[Retry] [Dismiss]
```

#### Data Freshness Indicators
```
🟢 Live          - Real-time data
🟡 5m ago        - Recent cached data  
🔴 Rate Limited  - Fallback due to limits
```

## 🔧 Implementation Details

### Cache Configuration
```typescript
const config = {
  maxAge: 5 * 60 * 1000,        // 5 minutes for fresh data
  fallbackMaxAge: 24 * 60 * 60 * 1000, // 24 hours for fallback
  maxRetries: 3,
  retryDelay: 1000
}
```

### Rate Limit Detection
The system detects rate limits through:
- API response messages containing "rate limit"
- HTTP status codes (429)
- Specific error patterns from Alpha Vantage API

### Cache Key Strategy
- **Stock Quotes**: `stock_quote_AAPL`
- **Portfolio Data**: `portfolio_user123`
- **Watchlist Data**: `watchlist_user123`
- **Alerts Data**: `alerts_user123`

## 📱 Component Integration

### Dashboard
- **Rate Limit Banner**: Shows at top when limits exceeded
- **Data Freshness**: Shows for each data section
- **Retry Functionality**: Allows manual refresh attempts

### Portfolio Tracker
- **Stock Addition**: Shows cached data warnings during addition
- **Price Updates**: Indicates when prices are from cache
- **Summary Cards**: Shows data freshness for portfolio totals

### Watchlist
- **Stock Cards**: Individual freshness indicators
- **Bulk Updates**: Handles rate limits gracefully
- **Alert Generation**: Uses cached data when needed

## 🛠️ API Integration

### Alpha Vantage API
- **Rate Limit**: 5 calls per minute, 500 per day
- **Detection**: "Note" field in response
- **Fallback**: Last successful data from cache

### Error Handling
```typescript
// Rate limit detection
if (data['Note']) {
  throw new Error('API rate limit exceeded')
}

// Automatic fallback
const cachedResult = await dataCache.getWithFallback(
  cacheKey,
  fetchFunction,
  { onRateLimit: (cachedData) => cachedData?.data }
)
```

## 📈 Benefits

### For Users
1. **No Interruptions**: App continues working with cached data
2. **Clear Communication**: Users know when data is cached
3. **Transparency**: Data age and source clearly indicated
4. **Reliability**: Consistent experience despite API limits

### For Developers
1. **Automatic Handling**: No manual rate limit management needed
2. **Graceful Degradation**: System continues functioning
3. **User Feedback**: Clear indicators of system state
4. **Monitoring**: Cache statistics and performance tracking

## 🔄 Cache Management

### Automatic Cleanup
- **Expired Entries**: Removed every 5 minutes
- **Memory Management**: Prevents cache bloat
- **Statistics**: Track cache hit rates and performance

### Cache Statistics
```typescript
{
  totalEntries: 150,
  freshEntries: 45,
  cachedEntries: 80,
  fallbackEntries: 25,
  expiredEntries: 12
}
```

## 🚨 Error Scenarios

### Scenario 1: First API Call Hits Rate Limit
1. User adds stock to portfolio
2. API returns rate limit error
3. System shows "No cached data available"
4. User sees error message with retry option

### Scenario 2: Subsequent Calls Hit Rate Limit
1. User adds another stock
2. API returns rate limit error
3. System uses previously cached data
4. User sees data with "Rate Limited" indicator

### Scenario 3: Mixed Data Sources
1. Some stocks have fresh data
2. Others use cached data due to limits
3. Each stock shows its individual freshness status
4. User understands which data is current

## 🔮 Future Enhancements

1. **Smart Retry**: Exponential backoff for rate limit recovery
2. **Predictive Caching**: Pre-fetch data before limits hit
3. **User Preferences**: Allow users to choose data freshness vs speed
4. **Analytics**: Track rate limit patterns and optimize usage
5. **Multiple APIs**: Fallback to alternative data sources

## 📋 Testing Scenarios

### Test Rate Limit Handling
1. **Simulate Rate Limits**: Mock API responses with rate limit errors
2. **Verify Fallback**: Ensure cached data is shown
3. **Check Indicators**: Verify freshness indicators appear
4. **Test Retry**: Ensure retry functionality works

### Test Cache Management
1. **Cache Expiration**: Verify old data is cleaned up
2. **Memory Usage**: Monitor cache size and performance
3. **Data Integrity**: Ensure cached data remains accurate
4. **Concurrent Access**: Test multiple users hitting limits

This system ensures users always have access to data, even when API limits are exceeded, while maintaining transparency about data freshness and source.
