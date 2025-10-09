"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../src/contexts/AuthContext"
import { Button } from "../../src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../src/components/ui/card"
import { Activity, TrendingUp, AlertCircle, Zap, LogOut, Plus, Bell, Info, X, RefreshCw, Shield } from "lucide-react"
import { toast } from "sonner"
import { WatchlistModal } from "../../src/components/WatchlistModal"
import { WatchlistService, WatchlistItem, PLANS } from "../../src/lib/watchlist"
import { DatabaseWatchlistService } from "../../src/lib/database-watchlist-service"
import { UserInitializationService } from "../../src/lib/user-initialization-service"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../src/components/ui/tooltip"
import { FeatureManager } from "../../src/components/FeatureManager"
import { SubscriptionManager } from "../../src/components/SubscriptionManager"
import { ProFeatures } from "../../src/components/ProFeatures"
import { AnalyticsDashboard } from "../../src/components/AnalyticsDashboard"
import { AIInsights } from "../../src/components/AIInsights"
import { OptionsFlow } from "../../src/components/OptionsFlow"
import { PrioritySupport } from "../../src/components/PrioritySupport"
import { TeamCollaboration } from "../../src/components/TeamCollaboration"
import { RateLimitBanner } from "../../src/components/RateLimitBanner"
// Removed MarketStatus in favor of GlobalMarketStatus at top
import { useFeatures } from "../../src/hooks/use-features"
import { subscriptionService } from "../../src/lib/subscription-service"
import { PortfolioTracker } from "../../src/components/PortfolioTracker"
import { AlertManager } from "../../src/components/AlertManager"
import { GlobalMarketStatus } from "../../src/components/GlobalMarketStatus"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../src/components/ui/dialog"
import { useAutoRefresh } from "../../src/hooks/use-auto-refresh"
import { GlobalStockSelector } from "../../src/components/GlobalStockSelector"
import { AlertService, Alert } from "../../src/lib/alert-service"
import { realAlertsService } from "../../src/lib/real-alerts-service"
import { ErrorHandler, handleAsyncError } from "../../src/lib/error-handler"
import { useCurrency } from "../../src/contexts/CurrencyContext"
import { LoadingStates } from "../../src/components/LoadingStates"
import { ErrorFallback } from "../../src/components/ErrorFallback"
import { NetworkStatus } from "../../src/components/NetworkStatus"

// Real-time data only - no mock data

export default function DashboardPage() {
  const router = useRouter()
  const { user, signOut, loading } = useAuth()
  const { formatCurrency, selectedCurrency, setSelectedCurrency } = useCurrency()
  
  // Auto-refresh hook for background data updates
  const { data: refreshData, isRefreshing, lastUpdated, forceRefresh } = useAutoRefresh()
  
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [liveStats, setLiveStats] = useState({
    activeAlerts: 0,
    watchlistCount: 0,
    optionsFlowCount: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [watchlistLoading, setWatchlistLoading] = useState(false)
  const [rateLimitWarning, setRateLimitWarning] = useState(false)
  const [dataFreshness, setDataFreshness] = useState<{
    source: 'fresh' | 'cached' | 'fallback'
    rateLimited: boolean
    age?: string
  } | null>(null)
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false)
  const [isMarketSelectorOpen, setIsMarketSelectorOpen] = useState(false)
  const [selectedMarket, setSelectedMarket] = useState<'US' | 'IN' | 'UK' | 'JP' | 'AU' | 'CA' | 'DE' | 'FR'>('US')
  const [userPlan, setUserPlan] = useState(PLANS.free)
      const [subscriptionStatus, setSubscriptionStatus] = useState({
        hasActiveSubscription: false,
        plan: 'free' as string | null,
        isTrial: false,
        trialEndsAt: null as string | null,
        isExpired: false,
        daysRemaining: null as number | null,
        isMasterAccount: false
      })
  
  // Check if user is master account
  const isMasterAccount = user?.email === 'kennethoswin289@gmail.com'
  const features = useFeatures(userPlan)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth")
    }
  }, [user, loading, router])

  // Load watchlist and subscription status on mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return

      setIsLoading(true)
      setHasError(false)
      setErrorMessage('')

      try {
        // Check if user needs initialization (for new users) - only on client side
        if (typeof window !== 'undefined') {
          try {
            // Skip user initialization for master account to avoid issues
            if (user.email === 'kennethoswin289@gmail.com') {
              console.log('🛡️ Master account detected, skipping user initialization')
            } else {
              const userExists = await UserInitializationService.userExists(user.id)
              if (!userExists) {
                console.log('🆕 New user detected, initializing...')
                await UserInitializationService.initializeNewUser(user.id, user.email || '')
              }
            }
          } catch (error) {
            console.warn('User initialization failed, continuing with dashboard load:', error)
            console.warn('This is normal if database tables are not set up yet')
            // Don't block dashboard loading if user initialization fails
            // The user can still use the dashboard with default settings
          }
        }

        // Get secure subscription status (force refresh from database)
        const status = await handleAsyncError(
          () => subscriptionService.getSubscriptionStatus(user.id, user.email || ''),
          'loading subscription status'
        )
        if (status) {
          setSubscriptionStatus(status)
          console.log('📊 Current subscription status:', status)
        }
        
        // Get user plan based on subscription
        const plan = await handleAsyncError(
          () => subscriptionService.getUserPlan(user.id, user.email),
          'loading user plan'
        )
        if (plan) setUserPlan(plan)
        
        // Validate data integrity first (with error handling)
        try {
          const integrityCheck = WatchlistService.validateDataIntegrity()
          if (!integrityCheck.valid) {
            console.warn('Data integrity check failed:', integrityCheck.message)
            // Don't block the dashboard, just log the warning
            console.log('Continuing with dashboard load despite integrity check failure')
          }
        } catch (error) {
          console.warn('Data integrity validation failed:', error)
          // Don't block the dashboard, just log the warning
          console.log('Continuing with dashboard load despite validation error')
        }
        
        // Validate and sanitize watchlist data
        try {
          const validation = WatchlistService.validateWatchlistData()
          if (!validation.valid) {
            console.warn('Watchlist validation failed:', validation.message)
            // Don't block dashboard loading
          }
        } catch (error) {
          console.warn('Watchlist validation error:', error)
          // Don't block dashboard loading
        }
        
        // Enforce limits on existing data
        const limitEnforcement = WatchlistService.enforceLimits()
        if (limitEnforcement.removed > 0) {
          toast.warning(limitEnforcement.message)
        }
        
        // Use DatabaseFirstService to ensure database is source of truth
        console.log('🔄 Loading user data from database (source of truth)...')
        const { DatabaseFirstService } = await import('../../src/lib/database-first-service')
        await DatabaseFirstService.syncAllData(user.id)
        
        // Load watchlist from database first, then fetch real-time data
        const dbWatchlist = await DatabaseFirstService.getWatchlist(user.id)
        
        // Fetch real-time prices and update local for UI display
        const savedWatchlist = await WatchlistService.getWatchlistWithData()
        setWatchlist(savedWatchlist)
        console.log('✅ Watchlist and portfolio synced and refreshed with real-time data')
        
        // Trigger analytics dashboard refresh
        window.dispatchEvent(new CustomEvent('portfolioUpdated'))
        window.dispatchEvent(new CustomEvent('watchlistUpdated'))
        
        // Load portfolio data
        try {
          const savedPortfolio = localStorage.getItem('oryn_portfolio')
          if (savedPortfolio) {
            // Portfolio data loaded successfully
            console.log('Portfolio data loaded from localStorage')
          }
        } catch (error) {
          ErrorHandler.handleError(error, 'loading portfolio data')
        }

        // Generate real-time alerts based on watchlist
      const generateAlerts = async () => {
          try {
            const watchlistTickers = savedWatchlist ? savedWatchlist.map(item => item.ticker) : []
          const realTimeAlerts = await AlertService.generateAlerts(watchlistTickers)
            setAlerts(realTimeAlerts)
          } catch (error) {
            console.error('Alert generation failed:', error)
            // Set error alert instead of sample data
            setAlerts([{
              id: 'dashboard_error_alert',
            type: 'news_alert',
            symbol: 'SYSTEM',
            condition: 'error',
            value: 0,
            isActive: true,
            createdAt: new Date().toISOString(),
            ticker: 'SYSTEM',
            message: 'Unable to load alerts. Please check your connection and try again.',
            time: 'Just now',
            severity: 'high' as any,
            data: { isError: true, errorType: 'dashboard_error' }
            }])
          }
        }

        await generateAlerts()
        
        // No fallback to sample data - show empty state or error messages
        
      } catch (error) {
        console.error('Dashboard loadUserData error:', error)
        const errorMsg = ErrorHandler.handleError(error, 'loading dashboard data')
        setHasError(true)
        setErrorMessage(errorMsg)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [user])

  // Real-time stats updates based on actual data
  useEffect(() => {
    const updateStats = () => {
      const optionsFlowAlerts = alerts.filter(alert => alert.type === 'options_flow')
      
      setLiveStats({
        activeAlerts: alerts.length,
        watchlistCount: watchlist.length,
        optionsFlowCount: optionsFlowAlerts.length
      })
    }

    // Update stats immediately
    updateStats()

    // Set up interval for real-time updates
    const interval = setInterval(async () => {
      try {
        // Generate new alerts based on current watchlist
        const watchlistTickers = watchlist ? watchlist.map(item => item.ticker) : []
        const newAlerts = await AlertService.generateAlerts(watchlistTickers)
        setAlerts(newAlerts)
        
        // Update stats with new data
        updateStats()
      } catch (error) {
        console.error('Error updating alerts:', error)
      }
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [watchlist, alerts])

  // Handle auto-refresh data updates
  useEffect(() => {
    if (refreshData) {
      console.log('🔄 Auto-refresh data received:', {
        portfolio: refreshData.portfolio.length,
        watchlist: refreshData.watchlist.length,
        lastUpdated: refreshData.lastUpdated
      })

      // Update watchlist if we have new data
      if (refreshData.watchlist.length > 0) {
        setWatchlist(refreshData.watchlist)
        console.log('✅ Watchlist updated from auto-refresh')
      }

      // Update data freshness indicator
      setDataFreshness({
        source: 'fresh',
        rateLimited: false,
        age: 'Live'
      })

      // Dispatch events for other components to update
      window.dispatchEvent(new CustomEvent('watchlistUpdated'))
      window.dispatchEvent(new CustomEvent('portfolioUpdated'))
    }
  }, [refreshData])

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }


  const handleCreateWatchlist = () => {
    setIsWatchlistModalOpen(true)
  }

  const handleAddToWatchlist = async (ticker: string, market?: string) => {
    try {
      // Use database-first approach
      const { DatabaseFirstService } = await import('../../src/lib/database-first-service')
      const added = await DatabaseFirstService.addWatchlistItem(user!.id, ticker, ticker, market)
      
      if (!added.success) {
        toast.error(added.message)
        return
      }
      
      // Reload watchlist from database to get updated data
      const updated = await DatabaseFirstService.getWatchlist(user!.id)
      setWatchlist(updated)
      setLiveStats(prev => ({ ...prev, watchlistCount: updated.length }))
      
      // Dispatch event to notify analytics dashboard
      window.dispatchEvent(new CustomEvent('watchlistUpdated'))
      
      toast.success(added.message)
    } catch (e) {
      toast.error('Failed to add to watchlist')
    }
  }

  const handleOpenMarketSelector = (market: string) => {
    setSelectedMarket((market as any) || 'US')
    setIsMarketSelectorOpen(true)
  }

  const handleGlobalStockSelect = async (stock: any) => {
    try {
      const res = await DatabaseWatchlistService.addToWatchlist(user!.id, stock.symbol, stock.name, stock.market)
      if (!res.success) {
        toast.error(res.message)
        return
      }
      await DatabaseWatchlistService.syncDatabaseToLocal(user!.id)
      const updated = await WatchlistService.getWatchlistWithData()
      setWatchlist(updated)
      setLiveStats(prev => ({ ...prev, watchlistCount: updated.length }))
      toast.success(res.message)
    } catch (e) {
      toast.error('Failed to add stock')
    }
  }


  const handleRemoveFromWatchlist = async (ticker: string) => {
    try {
      const res = await DatabaseWatchlistService.removeFromWatchlist(user!.id, ticker)
      if (!res.success) {
        toast.error(res.message)
        return
      }
      await DatabaseWatchlistService.syncDatabaseToLocal(user!.id)
      const updated = await WatchlistService.getWatchlistWithData()
      setWatchlist(updated)
      setLiveStats(prev => ({ ...prev, watchlistCount: updated.length }))
      
      // Dispatch event to notify analytics dashboard
      window.dispatchEvent(new CustomEvent('watchlistUpdated'))
      
      toast.success(res.message)
    } catch (e) {
      toast.error('Failed to remove from watchlist')
    }
  }

  const handleConfigureAlerts = () => {
    toast.info('Alert configuration coming soon! Set up email alerts for your portfolio and watchlist.')
  }

  const handleUpgradeToPro = () => {
    // Navigate to pricing section on homepage
    window.location.href = '/#pricing'
  }

  const handleNavigation = (section: string) => {
    // Navigate to homepage with section anchor
    window.location.href = `/#${section}`
  }

  const handleRefreshWatchlist = async () => {
    try {
      setWatchlistLoading(true)
      console.log('🔄 Refreshing watchlist prices with fresh Yahoo Finance data...')
      
      // Update prices for existing watchlist items
      const freshWatchlist = await WatchlistService.getWatchlistWithData()
      setWatchlist(freshWatchlist)
      
      toast.success('Watchlist prices refreshed with fresh Yahoo Finance data')
    } catch (error) {
      console.error('Error refreshing watchlist:', error)
      toast.error('Failed to refresh watchlist')
    } finally {
      setWatchlistLoading(false)
    }
  }

  const handleRefreshAlerts = async () => {
    try {
      console.log('🔄 Generating real-time alerts from live market data...')
      
      // Generate real-time alerts based on current watchlist
      const watchlistTickers = watchlist ? watchlist.map(item => item.ticker) : []
      
      if (watchlistTickers.length === 0) {
        toast.info('Add stocks to your watchlist to generate alerts')
        return
      }

      console.log(`📊 Generating real alerts for ${watchlistTickers.length} watchlist stocks...`)
      const newAlerts = await realAlertsService.generateRealAlerts(watchlistTickers)
      setAlerts(newAlerts)
      
      // Update live stats with real data
      const priceMovementAlerts = realAlertsService.getPriceMovementAlerts()
      const optionsFlowAlerts = realAlertsService.getOptionsFlowAlerts()
      
      setLiveStats(prev => ({
        ...prev,
        activeAlerts: priceMovementAlerts.length,
        optionsFlowCount: optionsFlowAlerts.length
      }))
      
      console.log(`✅ Generated ${newAlerts.length} real alerts (${priceMovementAlerts.length} price movements, ${optionsFlowAlerts.length} options flow)`)
      toast.success(`Generated ${newAlerts.length} real alerts from live market data`)
    } catch (error) {
      console.error('Error refreshing alerts:', error)
      toast.error('Failed to refresh alerts')
    }
  }

  const handleRefreshOptionsFlow = async () => {
    try {
      // Generate real-time options flow alerts
      const watchlistTickers = watchlist ? watchlist.map(item => item.ticker) : []
      
      if (watchlistTickers.length === 0) {
        toast.info('Add stocks to your watchlist to generate options flow alerts')
        return
      }

      console.log(`📊 Generating real options flow alerts for ${watchlistTickers.length} stocks...`)
      await realAlertsService.generateRealAlerts(watchlistTickers)
      const optionsFlowAlerts = realAlertsService.getOptionsFlowAlerts()
      
      // Update stats
      setLiveStats(prev => ({
        ...prev,
        optionsFlowCount: optionsFlowAlerts.length
      }))
      
      console.log(`✅ Generated ${optionsFlowAlerts.length} real options flow alerts`)
      toast.success(`Generated ${optionsFlowAlerts.length} real options flow alerts`)
    } catch (error) {
      console.error('Error refreshing options flow:', error)
      toast.error('Failed to refresh options flow')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-7xl">
          <LoadingStates type="dashboard" message="Loading your dashboard..." />
        </div>
      </div>
    )
  }

  if (!user) return null

  // Show error state if there's an error
  if (hasError) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-7xl">
          <ErrorFallback
            error={new Error(errorMessage)}
            context="loading dashboard data"
            onRetry={() => {
              setHasError(false)
              setErrorMessage('')
              // Trigger reload by updating a dependency
              window.location.reload()
            }}
            showDetails={process.env.NODE_ENV === 'development'}
          />
        </div>
      </div>
    )
  }

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-7xl p-4">
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  Setting up your dashboard
                </h2>
                <p className="text-muted-foreground">
                  Please wait while we fetch the latest data
                </p>
              </div>
            </div>
            
            {/* Loading skeleton for dashboard */}
            <div className="w-full max-w-4xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-card border rounded-lg p-4 animate-pulse">
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-4 w-20 bg-muted rounded"></div>
                      <div className="h-4 w-4 bg-muted rounded"></div>
                    </div>
                    <div className="h-8 w-24 bg-muted rounded mb-2"></div>
                    <div className="h-3 w-16 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="bg-card border rounded-lg p-6 animate-pulse">
                    <div className="h-6 w-32 bg-muted rounded mb-4"></div>
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, j) => (
                        <div key={j} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 bg-muted rounded"></div>
                            <div>
                              <div className="h-4 w-16 bg-muted rounded mb-1"></div>
                              <div className="h-3 w-12 bg-muted rounded"></div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="h-4 w-20 bg-muted rounded mb-1"></div>
                            <div className="h-3 w-16 bg-muted rounded"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <NetworkStatus showWhenOffline={true} showWhenOnline={false} />
      <div className="page-background">
      {/* Navigation is now handled by the root layout */}
      
      {/* Floating elements */}
      <div className="floating-element-1"></div>
      <div className="floating-element-2"></div>
      <div className="floating-element-3"></div>

      <div className="container mx-auto px-4 py-8 max-w-7xl pt-20 relative z-10">
        {/* Rate Limit Warning */}
        {rateLimitWarning && (
          <div className="mb-6">
            <RateLimitBanner 
              onDismiss={() => setRateLimitWarning(false)}
              onRetry={() => {
                setRateLimitWarning(false)
                window.location.reload()
              }}
            />
          </div>
        )}



        {/* Master Dashboard Access */}
        {isMasterAccount && (
          <div className="mb-6">
            <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-yellow-800">Master Account Access</h3>
                      <p className="text-yellow-700">You have master privileges. Access the master dashboard to manage users, tickets, and system operations.</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => router.push('/master-dashboard')}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Master Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Global Market Overview at Top */}
        <div className="mb-6">
          <GlobalMarketStatus 
            selectedMarket={selectedMarket}
            onMarketChange={handleOpenMarketSelector}
          />
          
          {/* Auto-refresh status indicator */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isRefreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                  <span>Refreshing data...</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Live data • Auto-refresh every 2s</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* Currency Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Currency:</span>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="px-3 py-1 text-sm border border-border rounded-md bg-background text-foreground focus:border-primary focus:ring-primary/20"
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="CAD">CAD (C$)</option>
                </select>
              </div>
              {lastUpdated && (
                <div className="text-xs text-muted-foreground">
                  Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">

          <Card className="card-hover animate-scale-in bg-gradient-to-br from-success/10 to-success/5 border-success/20 group" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      <strong>Active Alerts:</strong> Currently active price, volume, and options flow alerts monitoring your watchlist. 
                      Free plan allows up to 5 active alerts. Pro plan has unlimited alerts.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <AlertCircle className="h-4 w-4 text-success animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{liveStats.activeAlerts}</div>
              <p className="text-xs text-muted-foreground">Live alerts monitoring</p>
              <div className="mt-2 text-xs text-success/70">
                Price, volume & options alerts
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover animate-scale-in bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 group" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Watchlist</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      <strong>Watchlist:</strong> Number of stocks currently in your watchlist. 
                      Free plan allows up to 15 stocks. Pro plan has unlimited watchlist items.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <TrendingUp className="h-4 w-4 text-accent animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{liveStats.watchlistCount}</div>
              <p className="text-xs text-muted-foreground">Stocks being tracked</p>
              <div className="mt-2 text-xs text-accent/70">
                Monitor your favorite stocks
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover animate-scale-in bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 group" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Options Flow</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      <strong>Options Flow:</strong> Unusual options activity detected today. Shows big money moves and institutional trading patterns. 
                      Free plan allows up to 3 options flow alerts. Pro plan has unlimited options flow monitoring.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Zap className="h-4 w-4 text-secondary animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{liveStats.optionsFlowCount}</div>
              <p className="text-xs text-muted-foreground">Unusual activities today</p>
              <div className="mt-2 text-xs text-secondary/70">
                Big money moves detected
              </div>
            </CardContent>
          </Card>
        </div>

            {/* Welcome Section - Full Width */}
            <Card className="p-8 mb-8 card-hover animate-slide-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Welcome to Oryn!</CardTitle>
                    <CardDescription>
                      Your comprehensive stock intelligence platform for real-time alerts and portfolio tracking.
                    </CardDescription>
                  </div>
                  {subscriptionStatus.hasActiveSubscription && (
                    <div className={`flex items-center justify-between gap-2 px-4 py-2 rounded-lg border ${
                      subscriptionStatus.isMasterAccount 
                        ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20'
                        : 'bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Zap className={`h-4 w-4 ${
                          subscriptionStatus.isMasterAccount ? 'text-yellow-500' : 'text-primary'
                        }`} />
                        <span className={`text-sm font-medium ${
                          subscriptionStatus.isMasterAccount 
                            ? 'text-yellow-600 dark:text-yellow-400' 
                            : ''
                        }`}>
                          {subscriptionStatus.isMasterAccount 
                            ? 'Master Account' 
                            : subscriptionStatus.isTrial 
                              ? 'Pro Plan' 
                              : 'Pro Plan'
                          }
                          {!subscriptionStatus.isMasterAccount && subscriptionStatus.daysRemaining !== null && subscriptionStatus.daysRemaining > 0 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({subscriptionStatus.daysRemaining} days left)
                            </span>
                          )}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.location.reload()}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Refresh
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-6 bg-muted card-hover animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <div className="text-lg font-semibold mb-2">1. Track Portfolio</div>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your investments to get personalized AI analysis
                </p>
                <Button size="sm" className="w-full" onClick={() => document.getElementById('portfolio-tracker-section')?.scrollIntoView({ behavior: 'smooth' })}>
                  Track Portfolio
                </Button>
              </Card>

              <Card className="p-6 bg-muted card-hover animate-slide-up" style={{ animationDelay: '0.5s' }}>
                <div className="text-lg font-semibold mb-2">2. Create Watchlist</div>
                <p className="text-sm text-muted-foreground mb-4">
                  Add tickers you want to monitor for alerts
                </p>
                <Button size="sm" variant="outline" className="w-full" onClick={handleCreateWatchlist}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Watchlist
                </Button>
              </Card>

              <Card className="p-6 bg-muted card-hover animate-slide-up" style={{ animationDelay: '0.6s' }}>
                <div className="text-lg font-semibold mb-2">3. Configure Alerts</div>
                <p className="text-sm text-muted-foreground mb-4">
                  Set up price, volume, and options alerts
                </p>
                <Button size="sm" variant="outline" className="w-full" onClick={handleConfigureAlerts}>
                  <Bell className="h-4 w-4 mr-2" />
                  Setup Alerts
                </Button>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Tracker Section */}
        <div id="portfolio-tracker-section" className="mb-8">
          <PortfolioTracker />
        </div>

        {/* Alert Manager Section */}
        <div id="alert-manager-section" className="mb-8">
          <AlertManager />
        </div>

        {/* Removed duplicate GlobalMarketStatus below; it's now at top */}

        {/* Active Alerts and Options Flow - Below Welcome */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Active Alerts */}
          <Card className="card-hover animate-slide-in" style={{ animationDelay: '0.7s' }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-success" />
                    Active Alerts
                  </CardTitle>
                  <CardDescription>
                    Currently monitoring {liveStats.activeAlerts} alerts across your watchlist
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={handleRefreshAlerts}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts && realAlertsService.getPriceMovementAlerts().slice(0, 3).map((alert) => {
                const severityColors = {
                  low: 'from-blue-500/10 to-blue-500/5 border-blue-500/20',
                  medium: 'from-yellow-500/10 to-yellow-500/5 border-yellow-500/20',
                  high: 'from-red-500/10 to-red-500/5 border-red-500/20'
                }
                
                const severityIcons = {
                  low: '🔵',
                  medium: '🟡', 
                  high: '🔴'
                }

                return (
                  <div key={alert.id} className={`p-4 bg-gradient-to-r ${severityColors[alert.severity as keyof typeof severityColors]} border rounded-lg`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${
                          alert.severity === 'high' ? 'bg-red-500' : 
                          alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}></div>
                        <span className="font-medium">{alert.ticker}</span>
                        <span className="text-xs">{severityIcons[alert.severity as keyof typeof severityIcons]}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{alert.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <div className="mt-2 text-xs opacity-70">
                      {alert.type === 'price_spike' && <span>📈 Price Movement Alert</span>}
                      {alert.type === 'volume_spike' && <span>📊 Volume Alert</span>}
                      {alert.type === 'earnings' && <span>📋 Earnings Alert</span>}
                      {alert.type === 'options_flow' && <span>💰 Options Flow Alert</span>}
                      {alert.type === 'news_alert' && <span>📰 News Alert</span>}
                      {alert.type === 'technical_breakout' && <span>📊 Technical Alert</span>}
                    </div>
                  </div>
                )
              })}
              {(!alerts || realAlertsService.getPriceMovementAlerts().length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium mb-2">No active alerts</p>
                  <p className="text-sm">Set up alerts to start monitoring your stocks</p>
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      💡 <strong>Tip:</strong> Add stocks to your watchlist to start receiving real-time alerts
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Options Flow */}
          <Card className="card-hover animate-slide-in" style={{ animationDelay: '0.8s' }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-secondary" />
                    Options Flow
                  </CardTitle>
                  <CardDescription>
                    {liveStats.optionsFlowCount} unusual activities detected today
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={handleRefreshOptionsFlow}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts && realAlertsService.getOptionsFlowAlerts().slice(0, 3).map((alert) => {
                return (
                  <div key={alert.id} className="p-4 bg-gradient-to-r from-secondary/10 to-secondary/5 border-secondary/20 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                        <span className="font-medium text-secondary">{alert.ticker}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{alert.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <div className="mt-2 text-xs text-secondary/70">
                      💰 Unusual Options Activity
                    </div>
                  </div>
                )
              })}
              {(!alerts || realAlertsService.getOptionsFlowAlerts().length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium mb-2">No options flow detected</p>
                  <p className="text-sm">Monitor for unusual options activity</p>
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      💡 <strong>Tip:</strong> Options flow alerts require Pro plan for full functionality
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

            {/* Subscription Management Section */}
            <div className="mb-8">
              <SubscriptionManager />
            </div>

            {/* Pro Features Section - Only show for Pro/Master users */}
            {(userPlan.name === 'pro' || userPlan.name === 'master') && (
              <div className="mb-8">
                <ProFeatures />
              </div>
            )}

            {/* Analytics Dashboard - Only show for Pro/Master users */}
            {(userPlan.name === 'pro' || userPlan.name === 'master') && (
              <div className="mb-8">
                <AnalyticsDashboard />
              </div>
            )}

            {/* AI Insights - Only show for Pro/Master users */}
            {(userPlan.name === 'pro' || userPlan.name === 'master') && (
              <div className="mb-8">
                <AIInsights />
              </div>
            )}

            {/* Options Flow - Only show for Pro/Master users */}
            {(userPlan.name === 'pro' || userPlan.name === 'master') && (
              <div className="mb-8">
                <OptionsFlow />
              </div>
            )}

            {/* Priority Support - Available for all users */}
            <div className="mb-8">
              <PrioritySupport userPlan={userPlan} subscriptionStatus={subscriptionStatus} />
            </div>

            {/* Team Collaboration - Only show for Pro/Master users */}
            {(userPlan.name === 'pro' || userPlan.name === 'master') && (
              <div className="mb-8">
                <TeamCollaboration />
              </div>
            )}

            {/* Features Section */}
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Available Features</CardTitle>
                  <CardDescription>
                    Manage your features and see what&apos;s available with your current plan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FeatureManager 
                    userPlan={userPlan} 
                    onUpgrade={handleUpgradeToPro}
                  />
                </CardContent>
              </Card>
            </div>

        {/* Main Content - Watchlist */}
        <div className="max-w-4xl mx-auto">
          {/* Watchlist - Centered */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Watchlist</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {watchlist.length}/{features.getLimit('watchlist') === -1 ? '∞' : features.getLimit('watchlist')} stocks tracked
                          {userPlan.name === 'master' && (
                            <span className="text-yellow-600 dark:text-yellow-400 ml-2">(Master Account)</span>
                          )}
                          {userPlan.name === 'free' && (
                            <span className="text-warning ml-2">(Free Plan)</span>
                          )}
                          {watchlistLoading && (
                            <span className="text-blue-600 ml-2">(Fetching real-time data...)</span>
                          )}
                        </p>
                    {userPlan.name === 'free' && features.getLimit('watchlist') !== -1 && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Usage</span>
                          <span>{Math.round((watchlist.length / features.getLimit('watchlist')) * 100)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              watchlist.length >= features.getLimit('watchlist') 
                                ? 'bg-destructive' 
                                : watchlist.length >= features.getLimit('watchlist') * 0.8 
                                ? 'bg-warning' 
                                : 'bg-success'
                            }`}
                            style={{ width: `${Math.min((watchlist.length / features.getLimit('watchlist')) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {userPlan.name === 'free' && features.getLimit('watchlist') !== -1 && watchlist.length >= features.getLimit('watchlist') && (
                      <Button size="sm" variant="outline" className="text-primary" onClick={handleUpgradeToPro}>
                        Upgrade to Pro
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleRefreshWatchlist}
                      disabled={watchlistLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${watchlistLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCreateWatchlist}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {watchlist.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-lg font-medium mb-2">No stocks in your watchlist</p>
                    <p className="text-sm">Add stocks to start tracking their performance</p>
                  </div>
                ) : (
                  watchlist && watchlist.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{item.ticker}</div>
                          <div className="text-sm text-muted-foreground">{item.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(item.price, item.currency || 'USD')}</div>
                      <div className={`text-sm ${((item.changePercent ?? 0) >= 0) ? 'text-success' : 'text-destructive'}`}>
                        {((Number(item.changePercent) || 0) >= 0 ? '+' : '')}{(Number(item.changePercent) || 0).toFixed(2)}%
                      </div>
                          <div className="text-xs text-muted-foreground">
                            {item.market || 'US'}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveFromWatchlist(item.ticker)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Watchlist Modal */}
      <WatchlistModal
        isOpen={isWatchlistModalOpen}
        onClose={() => setIsWatchlistModalOpen(false)}
        onAdd={(ticker, name, market) => handleAddToWatchlist(ticker, (market as any) || selectedMarket)}
        defaultMarket={selectedMarket}
      />

      {/* Market-aware Global Stock Selector Dialog */}
      <Dialog open={isMarketSelectorOpen} onOpenChange={setIsMarketSelectorOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select stocks from {selectedMarket}</DialogTitle>
          </DialogHeader>
          <GlobalStockSelector 
            selectedMarket={selectedMarket}
            onMarketChange={(m) => setSelectedMarket(m as any)}
            onStockSelect={(stock) => {
              handleGlobalStockSelect(stock)
              setIsMarketSelectorOpen(false)
            }}
          />
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  )
}

