// import { toast } from "sonner"
import { multiApiStockService } from './multi-api-stock-service'

export interface WatchlistItem {
  id: string
  ticker: string
  name: string
  price: number
  change: number
  // Currency of the price as returned by the data source (e.g., USD, INR)
  currency?: string
  // Market code for correct routing (e.g., US, IN, UK)
  market?: string
  addedAt: string
}

export interface FeatureAccess {
  enabled: boolean
  unlimited?: boolean
  max?: number
  description?: string
}

export interface UserPlan {
  name: 'free' | 'pro' | 'master'
  maxWatchlistItems: number
  maxAlerts: number
  maxOptionsFlow: number
  maxPortfolioAnalytics: number
  maxCustomWebhooks: number
  maxTeamMembers: number
  features: {
    // Free features
    watchlist: FeatureAccess
    priceAlerts: FeatureAccess
    emailNotifications: FeatureAccess
    basicOptionsFlow: FeatureAccess
    earningsSummaries: FeatureAccess
    communitySupport: FeatureAccess
    
    // Pro features
    advancedOptionsFlow: FeatureAccess
    aiInsights: FeatureAccess
    insiderTrading: FeatureAccess
    portfolioAnalytics: FeatureAccess
    customWebhooks: FeatureAccess
    teamCollaboration: FeatureAccess
    advancedAnalytics: FeatureAccess
    whiteLabel: FeatureAccess
    prioritySupport: FeatureAccess
  }
}

export const PLANS: Record<string, UserPlan> = {
  free: {
    name: 'free',
    maxWatchlistItems: 15, // limited to 15 for free
    maxAlerts: 5,
    maxOptionsFlow: 3,
    maxPortfolioAnalytics: 0,
    maxCustomWebhooks: 0,
    maxTeamMembers: 1,
    features: {
      watchlist: { enabled: true, max: 15, description: 'Up to 15 watchlist items' },
      priceAlerts: { enabled: true, max: 5, description: 'Up to 5 real-time price alerts' },
      emailNotifications: { enabled: true, description: 'Email notifications' },
      basicOptionsFlow: { enabled: true, max: 3, description: 'Basic options flow (up to 3)' },
      earningsSummaries: { enabled: true, description: 'Earnings summaries' },
      communitySupport: { enabled: true, description: 'Community support' },
      advancedOptionsFlow: { enabled: false, description: 'Advanced options flow' },
      aiInsights: { enabled: false, description: 'AI-powered insights' },
      insiderTrading: { enabled: false, description: 'Insider trading alerts' },
      portfolioAnalytics: { enabled: false, description: 'Portfolio analytics' },
      customWebhooks: { enabled: false, description: 'Custom webhooks' },
      teamCollaboration: { enabled: false, description: 'Team collaboration' },
      advancedAnalytics: { enabled: false, description: 'Advanced analytics' },
      whiteLabel: { enabled: false, description: 'White-label options' },
      prioritySupport: { enabled: false, description: 'Priority support' }
    }
  },
  pro: {
    name: 'pro',
    maxWatchlistItems: -1, // unlimited
    maxAlerts: -1, // unlimited
    maxOptionsFlow: -1, // unlimited
    maxPortfolioAnalytics: -1, // unlimited
    maxCustomWebhooks: -1, // unlimited
    maxTeamMembers: -1, // unlimited
    features: {
      watchlist: { enabled: true, unlimited: true, description: 'Unlimited watchlist items' },
      priceAlerts: { enabled: true, unlimited: true, description: 'Unlimited real-time price alerts' },
      emailNotifications: { enabled: true, description: 'Email notifications' },
      basicOptionsFlow: { enabled: true, unlimited: true, description: 'Unlimited basic options flow' },
      earningsSummaries: { enabled: true, description: 'Earnings summaries' },
      communitySupport: { enabled: true, description: 'Community support' },
      advancedOptionsFlow: { enabled: true, unlimited: true, description: 'Advanced options flow' },
      aiInsights: { enabled: true, description: 'AI-powered insights' },
      insiderTrading: { enabled: true, description: 'Insider trading alerts' },
      portfolioAnalytics: { enabled: true, unlimited: true, description: 'Portfolio analytics' },
      customWebhooks: { enabled: true, unlimited: true, description: 'Custom webhooks' },
      teamCollaboration: { enabled: true, unlimited: true, description: 'Team collaboration' },
      advancedAnalytics: { enabled: true, description: 'Advanced analytics' },
      whiteLabel: { enabled: true, description: 'White-label options' },
      prioritySupport: { enabled: true, description: 'Priority support' }
    }
  },
  master: {
    name: 'master',
    maxWatchlistItems: -1, // unlimited
    maxAlerts: -1, // unlimited
    maxOptionsFlow: -1, // unlimited
    maxPortfolioAnalytics: -1, // unlimited
    maxCustomWebhooks: -1, // unlimited
    maxTeamMembers: -1, // unlimited
    features: {
      watchlist: { enabled: true, unlimited: true, description: 'Unlimited watchlist items' },
      priceAlerts: { enabled: true, unlimited: true, description: 'Unlimited real-time price alerts' },
      emailNotifications: { enabled: true, description: 'Email notifications' },
      basicOptionsFlow: { enabled: true, unlimited: true, description: 'Unlimited basic options flow' },
      earningsSummaries: { enabled: true, description: 'Earnings summaries' },
      communitySupport: { enabled: true, description: 'Community support' },
      advancedOptionsFlow: { enabled: true, unlimited: true, description: 'Advanced options flow' },
      aiInsights: { enabled: true, description: 'AI-powered insights' },
      insiderTrading: { enabled: true, description: 'Insider trading alerts' },
      portfolioAnalytics: { enabled: true, unlimited: true, description: 'Portfolio analytics' },
      customWebhooks: { enabled: true, unlimited: true, description: 'Custom webhooks' },
      teamCollaboration: { enabled: true, unlimited: true, description: 'Team collaboration' },
      advancedAnalytics: { enabled: true, description: 'Advanced analytics' },
      whiteLabel: { enabled: true, description: 'White-label options' },
      prioritySupport: { enabled: true, description: 'Priority support' }
    }
  }
}

// Feature access control utilities
export const hasFeatureAccess = (userPlan: UserPlan, feature: keyof UserPlan['features']): boolean => {
  const featureConfig = userPlan.features[feature]
  return featureConfig ? featureConfig.enabled : false
}

export const getFeatureLimit = (userPlan: UserPlan, feature: keyof UserPlan['features']): number => {
  const featureConfig = userPlan.features[feature]
  if (!featureConfig || !featureConfig.enabled) return 0
  if (featureConfig.unlimited) return -1
  return featureConfig.max || 0
}

export const isFeatureUnlimited = (userPlan: UserPlan, feature: keyof UserPlan['features']): boolean => {
  const featureConfig = userPlan.features[feature]
  return featureConfig ? (featureConfig.enabled && featureConfig.unlimited === true) : false
}

export const getFeatureDescription = (userPlan: UserPlan, feature: keyof UserPlan['features']): string => {
  const featureConfig = userPlan.features[feature]
  return featureConfig ? (featureConfig.description || '') : ''
}

export const checkFeatureAccess = (userPlan: UserPlan, feature: keyof UserPlan['features'], currentUsage: number = 0): { 
  hasAccess: boolean, 
  isUnlimited: boolean, 
  limit: number, 
  remaining: number,
  canUse: boolean 
} => {
  const hasAccess = hasFeatureAccess(userPlan, feature)
  const isUnlimited = isFeatureUnlimited(userPlan, feature)
  const limit = getFeatureLimit(userPlan, feature)
  const remaining = isUnlimited ? -1 : Math.max(0, limit - currentUsage)
  const canUse = hasAccess && (isUnlimited || currentUsage < limit)
  
  return { hasAccess, isUnlimited, limit, remaining, canUse }
}

// Mock stock suggestions API
export const getStockSuggestions = async (query: string): Promise<Array<{ticker: string, name: string, sector: string}>> => {
  const allStocks = [
    { ticker: "AAPL", name: "Apple Inc.", sector: "Technology" },
    { ticker: "MSFT", name: "Microsoft Corp.", sector: "Technology" },
    { ticker: "GOOGL", name: "Alphabet Inc.", sector: "Technology" },
    { ticker: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Discretionary" },
    { ticker: "TSLA", name: "Tesla Inc.", sector: "Automotive" },
    { ticker: "NVDA", name: "NVIDIA Corp.", sector: "Technology" },
    { ticker: "META", name: "Meta Platforms Inc.", sector: "Technology" },
    { ticker: "NFLX", name: "Netflix Inc.", sector: "Communication Services" },
    { ticker: "AMD", name: "Advanced Micro Devices", sector: "Technology" },
    { ticker: "INTC", name: "Intel Corp.", sector: "Technology" },
    { ticker: "CRM", name: "Salesforce Inc.", sector: "Technology" },
    { ticker: "ADBE", name: "Adobe Inc.", sector: "Technology" },
    { ticker: "PYPL", name: "PayPal Holdings", sector: "Financial Services" },
    { ticker: "UBER", name: "Uber Technologies", sector: "Consumer Discretionary" },
    { ticker: "SPOT", name: "Spotify Technology", sector: "Communication Services" },
    { ticker: "SQ", name: "Block Inc.", sector: "Financial Services" },
    { ticker: "ZM", name: "Zoom Video Communications", sector: "Technology" },
    { ticker: "SHOP", name: "Shopify Inc.", sector: "Technology" },
    { ticker: "ROKU", name: "Roku Inc.", sector: "Communication Services" },
    { ticker: "PTON", name: "Peloton Interactive", sector: "Consumer Discretionary" },
    { ticker: "ACN", name: "Accenture plc", sector: "Technology" },
    { ticker: "IBM", name: "International Business Machines", sector: "Technology" },
    { ticker: "ORCL", name: "Oracle Corp.", sector: "Technology" },
    { ticker: "CSCO", name: "Cisco Systems Inc.", sector: "Technology" },
    { ticker: "JPM", name: "JPMorgan Chase & Co.", sector: "Financial Services" },
    { ticker: "BAC", name: "Bank of America Corp.", sector: "Financial Services" },
    { ticker: "WFC", name: "Wells Fargo & Co.", sector: "Financial Services" },
    { ticker: "GS", name: "Goldman Sachs Group Inc.", sector: "Financial Services" },
    { ticker: "JNJ", name: "Johnson & Johnson", sector: "Healthcare" },
    { ticker: "PFE", name: "Pfizer Inc.", sector: "Healthcare" },
    { ticker: "UNH", name: "UnitedHealth Group Inc.", sector: "Healthcare" },
    { ticker: "ABBV", name: "AbbVie Inc.", sector: "Healthcare" },
    { ticker: "MRK", name: "Merck & Co. Inc.", sector: "Healthcare" },
    { ticker: "KO", name: "Coca-Cola Co.", sector: "Consumer Staples" },
    { ticker: "PEP", name: "PepsiCo Inc.", sector: "Consumer Staples" },
    { ticker: "WMT", name: "Walmart Inc.", sector: "Consumer Staples" },
    { ticker: "PG", name: "Procter & Gamble Co.", sector: "Consumer Staples" },
    { ticker: "V", name: "Visa Inc.", sector: "Financial Services" },
    { ticker: "MA", name: "Mastercard Inc.", sector: "Financial Services" },
    { ticker: "DIS", name: "Walt Disney Co.", sector: "Communication Services" },
    { ticker: "CMCSA", name: "Comcast Corp.", sector: "Communication Services" },
    { ticker: "T", name: "AT&T Inc.", sector: "Communication Services" },
    { ticker: "VZ", name: "Verizon Communications Inc.", sector: "Communication Services" },
    { ticker: "XOM", name: "Exxon Mobil Corp.", sector: "Energy" },
    { ticker: "CVX", name: "Chevron Corp.", sector: "Energy" },
    { ticker: "COP", name: "ConocoPhillips", sector: "Energy" },
    { ticker: "SLB", name: "Schlumberger Ltd.", sector: "Energy" },
    { ticker: "BA", name: "Boeing Co.", sector: "Industrials" },
    { ticker: "CAT", name: "Caterpillar Inc.", sector: "Industrials" },
    { ticker: "GE", name: "General Electric Co.", sector: "Industrials" },
    { ticker: "MMM", name: "3M Co.", sector: "Industrials" },
    { ticker: "HD", name: "Home Depot Inc.", sector: "Consumer Discretionary" },
    { ticker: "LOW", name: "Lowe's Companies Inc.", sector: "Consumer Discretionary" },
    { ticker: "NKE", name: "Nike Inc.", sector: "Consumer Discretionary" },
    { ticker: "SBUX", name: "Starbucks Corp.", sector: "Consumer Discretionary" }
  ]

  if (!query || query.length < 1) return allStocks.slice(0, 10)
  
  return allStocks.filter(stock => 
    stock.ticker.toLowerCase().includes(query.toLowerCase()) ||
    stock.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 10)
}

// Watchlist management
export class WatchlistService {
  private static STORAGE_KEY = 'oryn_watchlist'
  private static USER_PLAN_KEY = 'oryn_user_plan'
  private static CHECKSUM_KEY = 'oryn_watchlist_checksum'

  static getUserPlan(): UserPlan {
    const stored = localStorage.getItem(this.USER_PLAN_KEY)
    return stored ? JSON.parse(stored) : PLANS.free
  }

  static setUserPlan(plan: UserPlan) {
    localStorage.setItem(this.USER_PLAN_KEY, JSON.stringify(plan))
  }

  static getWatchlist(): WatchlistItem[] {
    const stored = localStorage.getItem(this.STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  }

  static addToWatchlist(ticker: string, name: string, market?: string): { success: boolean, message: string } {
    // Input validation and sanitization
    if (!ticker || typeof ticker !== 'string') {
      return { success: false, message: 'Invalid ticker symbol' }
    }
    
    const cleanTicker = ticker.trim().toUpperCase()
    if (cleanTicker.length === 0 || cleanTicker.length > 10) {
      return { success: false, message: 'Invalid ticker symbol length' }
    }
    
    // Prevent injection attacks
    if (cleanTicker.includes('<') || cleanTicker.includes('>') || cleanTicker.includes('"') || cleanTicker.includes("'")) {
      return { success: false, message: 'Invalid characters in ticker symbol' }
    }

    const currentPlan = this.getUserPlan()
    let currentWatchlist = this.getWatchlist()
    
    // Validate watchlist data integrity
    if (!Array.isArray(currentWatchlist)) {
      currentWatchlist = []
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]))
    }
    
    // Enforce strict limit - if user somehow has more than limit, trim to limit
    if (currentPlan.maxWatchlistItems !== -1 && currentWatchlist.length > currentPlan.maxWatchlistItems) {
      currentWatchlist = currentWatchlist.slice(0, currentPlan.maxWatchlistItems)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(currentWatchlist))
    }
    
    // Check if already exists (case-insensitive)
    if (currentWatchlist.some(item => item.ticker === cleanTicker)) {
      return { success: false, message: `${cleanTicker} is already in your watchlist` }
    }

    // STRICT LIMIT ENFORCEMENT - Block if at or over limit
    if (currentPlan.maxWatchlistItems !== -1 && currentWatchlist.length >= currentPlan.maxWatchlistItems) {
      return { 
        success: false, 
        message: `Free plan limit reached (${currentPlan.maxWatchlistItems} items). Remove an item first or upgrade to Pro for unlimited watchlist.` 
      }
    }

    const newItem: WatchlistItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // More unique ID
      ticker: cleanTicker,
      name: (name && name.trim()) ? name.trim().substring(0, 100) : `${cleanTicker} Inc.`, // Limit name length
      price: 0, // Will be fetched from API
      change: 0, // Will be fetched from API
      market: market,
      addedAt: new Date().toISOString()
    }

    const updatedWatchlist = [...currentWatchlist, newItem]
    
    // Final validation before saving
    if (currentPlan.maxWatchlistItems !== -1 && updatedWatchlist.length > currentPlan.maxWatchlistItems) {
      return { 
        success: false, 
        message: `Cannot add item. Would exceed limit of ${currentPlan.maxWatchlistItems} items.` 
      }
    }
    
    this.saveWithChecksum(updatedWatchlist)
    
    return { success: true, message: `Added ${cleanTicker} to watchlist` }
  }

  static removeFromWatchlist(ticker: string): { success: boolean, message: string } {
    const currentWatchlist = this.getWatchlist()
    const updatedWatchlist = currentWatchlist.filter(item => item.ticker !== ticker.toUpperCase())
    
    if (updatedWatchlist.length === currentWatchlist.length) {
      return { success: false, message: `${ticker.toUpperCase()} not found in watchlist` }
    }

    this.saveWithChecksum(updatedWatchlist)
    return { success: true, message: `Removed ${ticker.toUpperCase()} from watchlist` }
  }

  static clearWatchlist() {
    localStorage.removeItem(this.STORAGE_KEY)
  }

  // Enforce limits on existing watchlist (call this on app load)
  static enforceLimits(): { removed: number, message: string } {
    const currentPlan = this.getUserPlan()
    const currentWatchlist = this.getWatchlist()
    
    if (currentPlan.maxWatchlistItems === -1) {
      return { removed: 0, message: 'Pro plan - no limits to enforce' }
    }
    
    if (currentWatchlist.length <= currentPlan.maxWatchlistItems) {
      return { removed: 0, message: 'Watchlist within limits' }
    }
    
    // Remove excess items (keep the most recent ones)
    const sortedWatchlist = currentWatchlist.sort((a, b) => 
      new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    )
    
    const trimmedWatchlist = sortedWatchlist.slice(0, currentPlan.maxWatchlistItems)
    this.saveWithChecksum(trimmedWatchlist)
    
    const removed = currentWatchlist.length - trimmedWatchlist.length
    return { 
      removed, 
      message: `Removed ${removed} items to comply with Free plan limit of ${currentPlan.maxWatchlistItems} items` 
    }
  }

  // Validate and sanitize existing watchlist data
  static validateWatchlistData(): { valid: boolean, message: string } {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return { valid: true, message: 'No watchlist data' }
      
      const parsed = JSON.parse(stored)
      if (!Array.isArray(parsed)) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]))
        return { valid: false, message: 'Invalid watchlist data - reset to empty' }
      }
      
      // Validate each item
      const validItems = parsed.filter(item => 
        item && 
        typeof item === 'object' &&
        typeof item.ticker === 'string' &&
        item.ticker.length > 0 &&
        item.ticker.length <= 10 &&
        typeof item.name === 'string' &&
        typeof item.price === 'number' &&
        typeof item.change === 'number' &&
        typeof item.addedAt === 'string'
      )
      
      if (validItems.length !== parsed.length) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(validItems))
        return { valid: false, message: 'Removed invalid watchlist items' }
      }
      
      return { valid: true, message: 'Watchlist data is valid' }
    } catch (error) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]))
      return { valid: false, message: 'Corrupted watchlist data - reset to empty' }
    }
  }

  // Get current usage stats
  static getUsageStats(): { current: number, max: number, percentage: number } {
    const currentPlan = this.getUserPlan()
    const currentWatchlist = this.getWatchlist()
    
    const current = currentWatchlist.length
    const max = currentPlan.maxWatchlistItems === -1 ? Infinity : currentPlan.maxWatchlistItems
    const percentage = max === Infinity ? 0 : Math.round((current / max) * 100)
    
    return { current, max, percentage }
  }

  // Generate checksum for data integrity
  private static generateChecksum(data: string): string {
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  }

  // Validate data integrity using checksum
  static validateDataIntegrity(): { valid: boolean, message: string } {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      const storedChecksum = localStorage.getItem(this.CHECKSUM_KEY)
      
      if (!stored) return { valid: true, message: 'No data to validate' }
      
      const currentChecksum = this.generateChecksum(stored)
      if (storedChecksum !== currentChecksum) {
        // Data has been tampered with, reset to empty
        localStorage.removeItem(this.STORAGE_KEY)
        localStorage.removeItem(this.CHECKSUM_KEY)
        return { valid: false, message: 'Data integrity compromised - watchlist reset' }
      }
      
      return { valid: true, message: 'Data integrity verified' }
    } catch (error) {
      localStorage.removeItem(this.STORAGE_KEY)
      localStorage.removeItem(this.CHECKSUM_KEY)
      return { valid: false, message: 'Data validation failed - watchlist reset' }
    }
  }

  // Save data with checksum
  private static saveWithChecksum(data: WatchlistItem[]): void {
    const jsonData = JSON.stringify(data)
    const checksum = this.generateChecksum(jsonData)
    localStorage.setItem(this.STORAGE_KEY, jsonData)
    localStorage.setItem(this.CHECKSUM_KEY, checksum)
  }

  // Fetch real stock data for watchlist items
  static async fetchWatchlistData(): Promise<WatchlistItem[]> {
    const watchlist = this.getWatchlist()
    const updatedItems: WatchlistItem[] = []

    console.log(`🔄 Fetching REAL-TIME Yahoo Finance data for ${watchlist.length} watchlist items...`)

    // If no items in watchlist, return empty array
    if (watchlist.length === 0) {
      console.log('📝 No items in watchlist, returning empty array')
      return []
    }

    for (const item of watchlist) {
      try {
        console.log(`📊 Fetching REAL-TIME data for ${item.ticker} from Yahoo Finance...`)
        
        // Use our API route to fetch data (handles CORS and server-side requests)
        const marketQuery = item.market ? `?market=${encodeURIComponent(item.market)}` : ''
        const response = await fetch(`/api/stock/multi/${item.ticker}${marketQuery}`)
        
        if (!response.ok) {
          throw new Error(`API HTTP error: ${response.status}`)
        }
        
        const stockData = await response.json()
        
        if (!stockData || !stockData.price) {
          throw new Error('No price data available')
        }
        
        const realTimeData = {
          symbol: stockData.symbol,
          name: stockData.name || item.name,
          price: stockData.price,
          change: stockData.change,
          changePercent: stockData.changePercent,
          volume: stockData.volume || 0,
          source: stockData.source || 'yahoo_finance',
          currency: stockData.currency || undefined
        }
        
        console.log(`✅ Got REAL-TIME data for ${item.ticker}: ${realTimeData.currency || 'USD'} ${realTimeData.price} (${realTimeData.changePercent.toFixed(2)}%)`)
        
        updatedItems.push({
          ...item,
          name: realTimeData.name,
          price: realTimeData.price,
          change: realTimeData.change,
          // @ts-expect-error keep backwards compatibility if changePercent not on type
          changePercent: realTimeData.changePercent,
          currency: realTimeData.currency,
          market: item.market
        })
      } catch (error) {
        console.warn(`❌ Failed to fetch real-time data for ${item.ticker}:`, error)
        // Keep the item with existing data if API fails
        updatedItems.push(item)
      }
    }

    // Update localStorage with fresh data
    if (updatedItems.length > 0) {
      this.saveWithChecksum(updatedItems)
      console.log(`💾 Updated watchlist with REAL-TIME data for ${updatedItems.length} items`)
    }

    return updatedItems
  }

  // Get watchlist with real-time data
  static async getWatchlistWithData(): Promise<WatchlistItem[]> {
    try {
      return await this.fetchWatchlistData()
    } catch (error) {
      console.error('Error fetching watchlist data:', error)
      // Return cached data if API fails
      return this.getWatchlist()
    }
  }

  // Force refresh watchlist with real-time data (bypass cache)
  static async forceRefreshWatchlist(): Promise<WatchlistItem[]> {
    console.log('🔄 Force refreshing watchlist with real-time Yahoo Finance data...')
    
    // Get existing watchlist items
    const watchlist = this.getWatchlist()
    const updatedItems: WatchlistItem[] = []

    // If no items in watchlist, return empty array
    if (watchlist.length === 0) {
      console.log('📝 No items in watchlist, returning empty array')
      return []
    }

    for (const item of watchlist) {
      try {
        console.log(`📊 Fetching REAL-TIME data for ${item.ticker} from Yahoo Finance...`)
        
        // Use our API route to fetch data (handles CORS and server-side requests)
        const marketQuery = item.market ? `?market=${encodeURIComponent(item.market)}` : ''
        const response = await fetch(`/api/stock/multi/${item.ticker}${marketQuery}`)
        
        if (!response.ok) {
          throw new Error(`API HTTP error: ${response.status}`)
        }
        
        const stockData = await response.json()
        
        if (!stockData || !stockData.price) {
          throw new Error('No price data available')
        }
        
        const realTimeData = {
          symbol: stockData.symbol,
          name: stockData.name || item.name,
          price: stockData.price,
          change: stockData.change,
          changePercent: stockData.changePercent,
          volume: stockData.volume || 0,
          source: stockData.source || 'yahoo_finance',
          currency: stockData.currency || undefined
        }
        
        console.log(`✅ Got REAL-TIME data for ${item.ticker}: ${realTimeData.currency || 'USD'} ${realTimeData.price} (${realTimeData.changePercent.toFixed(2)}%)`)
        
        updatedItems.push({
          ...item,
          name: realTimeData.name,
          price: realTimeData.price,
          change: realTimeData.change,
          // @ts-expect-error keep backwards compatibility if changePercent not on type
          changePercent: realTimeData.changePercent,
          currency: realTimeData.currency,
          market: item.market
        })
      } catch (error) {
        console.warn(`❌ Failed to fetch real-time data for ${item.ticker}:`, error)
        // Keep the item with existing data if API fails
        updatedItems.push(item)
      }
    }

    // Update localStorage with fresh data
    if (updatedItems.length > 0) {
      this.saveWithChecksum(updatedItems)
      console.log(`💾 Updated watchlist with REAL-TIME data for ${updatedItems.length} items`)
    }

    return updatedItems
  }

  // Clear only price cache, keep watchlist items
  static clearPriceCache(): void {
    console.log('🗑️ Clearing price cache but keeping watchlist items...')
    // Don't clear the watchlist items, just force fresh price updates
    console.log('✅ Price cache cleared - will fetch fresh prices for existing items')
  }
}
