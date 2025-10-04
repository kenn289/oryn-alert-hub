// Enhanced data caching system with fallback for rate limits
// Data cache types

export interface CachedData<T> {
  data: T
  timestamp: number
  source: 'fresh' | 'cached' | 'fallback'
  expiresAt: number
  metadata?: {
    apiLimitExceeded?: boolean
    lastSuccessfulFetch?: number
    errorMessage?: string
  }
}

export interface CacheConfig {
  maxAge: number // Maximum age in milliseconds
  fallbackMaxAge: number // Maximum age for fallback data
  maxRetries: number
  retryDelay: number
}

class DataCache {
  private cache = new Map<string, CachedData<unknown>>()
  private config: CacheConfig = {
    maxAge: process.env.NODE_ENV === 'development' ? 30 * 60 * 1000 : 5 * 60 * 1000, // 30 minutes in dev, 5 minutes in prod
    fallbackMaxAge: 24 * 60 * 60 * 1000, // 24 hours for fallback data
    maxRetries: 3,
    retryDelay: 1000 // 1 second
  }

  // Store data in cache
  set<T>(key: string, data: T, source: 'fresh' | 'cached' | 'fallback' = 'fresh', metadata?: Record<string, unknown>): void {
    const now = Date.now()
    const expiresAt = source === 'fallback' 
      ? now + this.config.fallbackMaxAge 
      : now + this.config.maxAge

    this.cache.set(key, {
      data,
      timestamp: now,
      source,
      expiresAt,
      metadata
    })
  }

  // Get data from cache
  get<T>(key: string): CachedData<T> | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    
    // Check if data is expired
    if (now > cached.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return cached as CachedData<T>
  }

  // Get fresh data or fallback to cached data
  async getWithFallback<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: {
      allowStale?: boolean
      maxStaleness?: number
      onRateLimit?: (cachedData: CachedData<T> | null) => T | null
    } = {}
  ): Promise<CachedData<T>> {
    const { allowStale = true, maxStaleness = 24 * 60 * 60 * 1000, onRateLimit } = options

    // Try to get fresh data first
    try {
      const freshData = await fetchFn()
      this.set(key, freshData, 'fresh')
      return this.get<T>(key)!
    } catch (error) {
      console.warn(`Failed to fetch fresh data for ${key}:`, error)
      
      // Check if it's a rate limit error
      const isRateLimit = error instanceof Error && (
        error.message.includes('rate limit') ||
        error.message.includes('API rate limit') ||
        error.message.includes('429') ||
        error.message.includes('too many requests')
      )

      if (isRateLimit) {
        console.log(`Rate limit exceeded for ${key}, using cached data`)
        
        // Get cached data
        const cachedData = this.get<T>(key)
        if (cachedData) {
          // Mark as rate limited and return cached data
          const rateLimitedData: CachedData<T> = {
            ...cachedData,
            source: 'fallback',
            metadata: {
              ...cachedData.metadata,
              apiLimitExceeded: true,
              errorMessage: error.message
            }
          }
          
          // Update cache with rate limit info
          this.cache.set(key, rateLimitedData)
          
          // Call custom rate limit handler if provided
          if (onRateLimit) {
            const customData = onRateLimit(rateLimitedData)
            if (customData) {
              this.set(key, customData, 'fallback', { apiLimitExceeded: true })
              return this.get<T>(key)!
            }
          }
          
          return rateLimitedData
        }
      }

      // If not rate limit or no cached data, try to get stale data if allowed
      if (allowStale) {
        const staleData = this.get<T>(key)
        if (staleData && (Date.now() - staleData.timestamp) < maxStaleness) {
          console.log(`Using stale data for ${key} (${Math.round((Date.now() - staleData.timestamp) / 1000 / 60)} minutes old)`)
          return {
            ...staleData,
            source: 'cached',
            metadata: {
              ...staleData.metadata,
              errorMessage: error instanceof Error ? error.message : String(error)
            }
          }
        }
      }

      // No fallback data available, re-throw error
      throw error
    }
  }

  // Check if data is fresh
  isFresh(key: string): boolean {
    const cached = this.get(key)
    return cached?.source === 'fresh' && cached.timestamp > (Date.now() - this.config.maxAge)
  }

  // Check if data is available (fresh or cached)
  isAvailable(key: string): boolean {
    return this.get(key) !== null
  }

  // Get cache statistics
  getStats(): {
    totalEntries: number
    freshEntries: number
    cachedEntries: number
    fallbackEntries: number
    expiredEntries: number
  } {
    const now = Date.now()
    let totalEntries = 0
    let freshEntries = 0
    let cachedEntries = 0
    let fallbackEntries = 0
    let expiredEntries = 0

    for (const [, data] of this.cache.entries()) {
      totalEntries++
      
      if (now > data.expiresAt) {
        expiredEntries++
      } else {
        switch (data.source) {
          case 'fresh':
            freshEntries++
            break
          case 'cached':
            cachedEntries++
            break
          case 'fallback':
            fallbackEntries++
            break
        }
      }
    }

    return {
      totalEntries,
      freshEntries,
      cachedEntries,
      fallbackEntries,
      expiredEntries
    }
  }

  // Clean up expired entries
  cleanup(): number {
    const now = Date.now()
    let cleaned = 0

    for (const [key, data] of this.cache.entries()) {
      if (now > data.expiresAt) {
        this.cache.delete(key)
        cleaned++
      }
    }

    return cleaned
  }

  // Clear all cache
  clear(): void {
    this.cache.clear()
  }

  // Update configuration
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

// Global cache instance
export const dataCache = new DataCache()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const cleaned = dataCache.cleanup()
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired cache entries`)
  }
}, 5 * 60 * 1000)

// Utility functions for common use cases
export const cacheUtils = {
  // Generate cache key for stock quote
  stockQuoteKey: (symbol: string) => `stock_quote_${symbol.toUpperCase()}`,
  
  // Generate cache key for portfolio data
  portfolioKey: (userId: string) => `portfolio_${userId}`,
  
  // Generate cache key for watchlist data
  watchlistKey: (userId: string) => `watchlist_${userId}`,
  
  // Generate cache key for alerts
  alertsKey: (userId: string) => `alerts_${userId}`,
  
  // Generate cache key for options flow
  optionsFlowKey: (symbols: string[]) => `options_flow_${symbols.sort().join('_')}`,
  
  // Format timestamp for display
  formatTimestamp: (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  },
  
  // Get data freshness indicator
  getFreshnessIndicator: (cachedData: CachedData<unknown>) => {
    const now = Date.now()
    const age = now - cachedData.timestamp
    const ageMinutes = Math.floor(age / (1000 * 60))
    
    if (cachedData.source === 'fresh') {
      return { status: 'fresh', message: 'Live data', color: 'green' }
    } else if (cachedData.source === 'cached') {
      if (ageMinutes < 30) {
        return { status: 'recent', message: `${ageMinutes}m old`, color: 'yellow' }
      } else {
        return { status: 'stale', message: `${ageMinutes}m old`, color: 'orange' }
      }
    } else {
      return { status: 'fallback', message: 'Cached data (API limit)', color: 'red' }
    }
  }
}
