// Configuration helper to check if services are available
export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    isAvailable: Boolean(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
    ),
  },
  // Discord removed - not needed
  razorpay: {
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
    isAvailable: Boolean(
      (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID) &&
      process.env.RAZORPAY_KEY_SECRET
    ),
  },
  stockData: {
    alphaVantageKey: process.env.ALPHA_VANTAGE_API_KEY,
    openAiKey: process.env.OPENAI_API_KEY,
    isAvailable: Boolean(process.env.ALPHA_VANTAGE_API_KEY),
  },
  redis: {
    url: process.env.REDIS_URL,
    isAvailable: Boolean(process.env.REDIS_URL),
  },
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  // Security settings
  security: {
    jwtSecret: process.env.JWT_SECRET,
    encryptionKey: process.env.ENCRYPTION_KEY,
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60') * 1000, // 60 seconds
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '60'), // 60 requests per window
  },
  // Worker settings
  worker: {
    webhookSecret: process.env.WORKER_WEBHOOK_SECRET,
    queueUrl: process.env.QUEUE_URL,
  },
  // Feature flags
  features: {
    optionsFlow: process.env.FEATURE_OPTIONS_FLOW === 'true',
    insiderTracking: process.env.FEATURE_INSIDER_TRACKING === 'true',
    earningsSummaries: process.env.FEATURE_EARNINGS_SUMMARIES === 'true',
    highFrequencyData: process.env.FEATURE_HIGH_FREQUENCY_DATA === 'true',
  },
}

// Service status messages
export const serviceMessages = {
  payment: config.razorpay.isAvailable 
    ? 'Payment processing available' 
    : 'Payment unavailable - Please contact support',
  stockData: config.stockData.isAvailable 
    ? 'Stock data available' 
    : 'Stock data unavailable - API key required',
  // Discord removed - not needed
  database: config.supabase.isAvailable 
    ? 'Database available' 
    : 'Database unavailable - Configuration required',
}
