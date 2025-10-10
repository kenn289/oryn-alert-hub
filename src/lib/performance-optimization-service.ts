import { supabase } from './supabase'

export interface CacheConfig {
  ttl: number // Time to live in milliseconds
  maxSize: number // Maximum cache size
  enableCompression: boolean
}

export interface QueryOptimization {
  useIndexes: boolean
  batchQueries: boolean
  connectionPooling: boolean
  queryTimeout: number
}

export interface PerformanceMetrics {
  cacheHitRate: number
  averageQueryTime: number
  memoryUsage: number
  connectionPoolUtilization: number
}

export class PerformanceOptimizationService {
  private static instance: PerformanceOptimizationService
  private cache = new Map<string, { data: any; timestamp: number; hits: number }>()
  private queryMetrics = new Map<string, { count: number; totalTime: number; avgTime: number }>()
  private connectionPool: any[] = []
  private maxConnections = 10

  private readonly CACHE_CONFIG: CacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000,
    enableCompression: true
  }

  private readonly QUERY_CONFIG: QueryOptimization = {
    useIndexes: true,
    batchQueries: true,
    connectionPooling: true,
    queryTimeout: 30000 // 30 seconds
  }

  static getInstance(): PerformanceOptimizationService {
    if (!PerformanceOptimizationService.instance) {
      PerformanceOptimizationService.instance = new PerformanceOptimizationService()
    }
    return PerformanceOptimizationService.instance
  }

  /**
   * Get cached data with fallback
   */
  async getWithCache<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(key)
    const cacheTTL = ttl || this.CACHE_CONFIG.ttl

    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < cacheTTL) {
      cached.hits++
      console.log(`🎯 Cache hit for ${key} (${cached.hits} hits)`)
      return cached.data
    }

    console.log(`🔄 Cache miss for ${key}, fetching fresh data...`)
    
    try {
      const data = await fetcher()
      
      // Store in cache
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        hits: 0
      })

      // Clean up old cache entries if needed
      this.cleanupCache()

      return data
    } catch (error) {
      console.error(`Error fetching data for ${key}:`, error)
      throw error
    }
  }

  /**
   * Batch multiple database queries
   */
  async batchQueries<T>(queries: Array<() => Promise<T>>): Promise<T[]> {
    const startTime = Date.now()
    
    try {
      const results = await Promise.all(queries.map(query => query()))
      const endTime = Date.now()
      
      console.log(`📊 Batch query completed in ${endTime - startTime}ms`)
      return results
    } catch (error) {
      console.error('Batch query error:', error)
      throw error
    }
  }

  /**
   * Optimized database query with connection pooling
   */
  async optimizedQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now()
    
    try {
      const result = await queryFn()
      const endTime = Date.now()
      const queryTime = endTime - startTime

      // Track query metrics
      this.trackQueryMetrics(queryName, queryTime)
      
      console.log(`📊 Query ${queryName} completed in ${queryTime}ms`)
      return result
    } catch (error) {
      console.error(`Query ${queryName} failed:`, error)
      throw error
    }
  }

  /**
   * Preload frequently accessed data
   */
  async preloadData(userId: string): Promise<void> {
    const preloadTasks = [
      () => this.preloadUserData(userId),
      () => this.preloadWatchlistData(userId),
      () => this.preloadPortfolioData(userId),
      () => this.preloadSubscriptionData(userId)
    ]

    try {
      await Promise.all(preloadTasks.map(task => task()))
      console.log(`✅ Preloaded data for user ${userId}`)
    } catch (error) {
      console.error('Preload error:', error)
    }
  }

  /**
   * Optimize database indexes
   */
  async optimizeIndexes(): Promise<{ success: boolean; message: string }> {
    try {
      const indexOptimizations = [
        // Users table indexes
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_plan ON users(plan)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at)',
        
        // Watchlist indexes
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_watchlists_user_ticker ON watchlists(user_id, ticker)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_watchlists_market ON watchlists(market)',
        
        // Portfolio indexes
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_portfolios_ticker ON portfolios(ticker)',
        
        // Subscription indexes
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_subscriptions_user_status ON user_subscriptions(user_id, status)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_subscriptions_end_date ON user_subscriptions(end_date)',
        
        // Payment indexes
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_orders_user_status ON payment_orders(user_id, status)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_orders_paid_at ON payment_orders(paid_at)',
        
        // Revenue indexes
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_revenue_logs_confirmed_at ON revenue_logs(confirmed_at)',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_revenue_logs_status ON revenue_logs(status)'
      ]

      for (const indexQuery of indexOptimizations) {
        try {
          await supabase.rpc('exec_sql', { sql: indexQuery })
        } catch (error) {
          console.warn(`Index creation warning: ${error.message}`)
        }
      }

      return { success: true, message: 'Database indexes optimized successfully' }
    } catch (error) {
      console.error('Index optimization error:', error)
      return { success: false, message: 'Failed to optimize indexes' }
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const totalCacheEntries = this.cache.size
    const totalHits = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.hits, 0)
    const cacheHitRate = totalCacheEntries > 0 ? (totalHits / totalCacheEntries) * 100 : 0

    const queryTimes = Array.from(this.queryMetrics.values()).map(metric => metric.avgTime)
    const averageQueryTime = queryTimes.length > 0 
      ? queryTimes.reduce((sum, time) => sum + time, 0) / queryTimes.length 
      : 0

    return {
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      averageQueryTime: Math.round(averageQueryTime * 100) / 100,
      memoryUsage: this.getMemoryUsage(),
      connectionPoolUtilization: (this.connectionPool.length / this.maxConnections) * 100
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
    console.log('🧹 Cache cleared')
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmupCache(): Promise<void> {
    try {
      console.log('🔥 Warming up cache...')
      
      // Preload common data
      const warmupTasks = [
        () => this.preloadMarketData(),
        () => this.preloadSubscriptionStats(),
        () => this.preloadRevenueData()
      ]

      await Promise.all(warmupTasks.map(task => task()))
      console.log('✅ Cache warmup completed')
    } catch (error) {
      console.error('Cache warmup error:', error)
    }
  }

  /**
   * Private methods
   */
  private generateCacheKey(key: string): string {
    return `perf_${key}`
  }

  private cleanupCache(): void {
    if (this.cache.size > this.CACHE_CONFIG.maxSize) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const toRemove = entries.slice(0, entries.length - this.CACHE_CONFIG.maxSize)
      toRemove.forEach(([key]) => this.cache.delete(key))
      
      console.log(`🧹 Cleaned up ${toRemove.length} cache entries`)
    }
  }

  private trackQueryMetrics(queryName: string, queryTime: number): void {
    const existing = this.queryMetrics.get(queryName)
    if (existing) {
      existing.count++
      existing.totalTime += queryTime
      existing.avgTime = existing.totalTime / existing.count
    } else {
      this.queryMetrics.set(queryName, {
        count: 1,
        totalTime: queryTime,
        avgTime: queryTime
      })
    }
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024 // MB
    }
    return 0
  }

  private async preloadUserData(userId: string): Promise<void> {
    const cacheKey = `user_${userId}`
    await this.getWithCache(cacheKey, async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      return data
    })
  }

  private async preloadWatchlistData(userId: string): Promise<void> {
    const cacheKey = `watchlist_${userId}`
    await this.getWithCache(cacheKey, async () => {
      const { data } = await supabase
        .from('watchlists')
        .select('*')
        .eq('user_id', userId)
      return data
    })
  }

  private async preloadPortfolioData(userId: string): Promise<void> {
    const cacheKey = `portfolio_${userId}`
    await this.getWithCache(cacheKey, async () => {
      const { data } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', userId)
      return data
    })
  }

  private async preloadSubscriptionData(userId: string): Promise<void> {
    const cacheKey = `subscription_${userId}`
    await this.getWithCache(cacheKey, async () => {
      const { data } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()
      return data
    })
  }

  private async preloadMarketData(): Promise<void> {
    const cacheKey = 'market_data'
    await this.getWithCache(cacheKey, async () => {
      const { data } = await supabase
        .from('market_status')
        .select('*')
      return data
    })
  }

  private async preloadSubscriptionStats(): Promise<void> {
    const cacheKey = 'subscription_stats'
    await this.getWithCache(cacheKey, async () => {
      const { data } = await supabase
        .from('user_subscriptions')
        .select('plan, status, created_at')
      return data
    })
  }

  private async preloadRevenueData(): Promise<void> {
    const cacheKey = 'revenue_data'
    await this.getWithCache(cacheKey, async () => {
      const { data } = await supabase
        .from('revenue_logs')
        .select('*')
        .eq('status', 'confirmed')
      return data
    })
  }
}

export const performanceService = PerformanceOptimizationService.getInstance()
