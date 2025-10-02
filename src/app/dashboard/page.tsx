"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, TrendingUp, AlertCircle, Zap, LogOut, Plus, Settings, Bell, Info, X, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { WatchlistModal } from "@/components/WatchlistModal"
import { WatchlistService, WatchlistItem, PLANS } from "@/lib/watchlist"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FeatureManager } from "@/components/FeatureManager"
import { SubscriptionManager } from "@/components/SubscriptionManager"
import { ProFeatures } from "@/components/ProFeatures"
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard"
import { AIInsights } from "@/components/AIInsights"
import { OptionsFlow } from "@/components/OptionsFlow"
import { PrioritySupport } from "@/components/PrioritySupport"
import { TeamCollaboration } from "@/components/TeamCollaboration"
import { useFeatures } from "@/hooks/use-features"
import { subscriptionService } from "@/lib/subscription-service"
import { stockDataService, StockAlert, OptionsActivity } from "@/lib/stock-data-service"
import { PortfolioTracker } from "@/components/PortfolioTracker"

// Mock data for demonstration
const mockWatchlist = [
  { id: '1', ticker: 'AAPL', name: 'Apple Inc.', price: 175.43, change: 2.4 },
  { id: '2', ticker: 'MSFT', name: 'Microsoft Corp.', price: 378.85, change: -1.2 },
  { id: '3', ticker: 'GOOGL', name: 'Alphabet Inc.', price: 142.56, change: 0.8 },
]

const mockAlerts = [
  { id: '1', type: 'price_spike', ticker: 'AAPL', message: 'AAPL price surged 3.2%', time: '2 minutes ago' },
  { id: '2', type: 'options_flow', ticker: 'TSLA', message: 'TSLA: Unusual call activity detected', time: '15 minutes ago' },
  { id: '3', type: 'earnings', ticker: 'NVDA', message: 'NVDA earnings call summary', time: '1 hour ago' },
  { id: '4', type: 'volume_spike', ticker: 'MSFT', message: 'MSFT volume increased 180%', time: '2 hours ago' },
  { id: '5', type: 'options_flow', ticker: 'GOOGL', message: 'GOOGL: Large block trade detected', time: '3 hours ago' },
  { id: '6', type: 'technical_breakout', ticker: 'META', message: 'META technical breakout', time: '4 hours ago' },
  { id: '7', type: 'news_alert', ticker: 'AMZN', message: 'AMZN breaking news', time: '5 hours ago' },
]

export default function DashboardPage() {
  const router = useRouter()
  const { user, signOut, loading } = useAuth()
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [portfolio, setPortfolio] = useState<Array<{ ticker: string }>>([])
  const [alerts, setAlerts] = useState(mockAlerts)
  const [liveStats, setLiveStats] = useState({
    activeAlerts: 0,
    watchlistCount: 0,
    optionsFlowCount: 0
  })
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false)
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

          try {
            // Get secure subscription status
            const status = await subscriptionService.getSubscriptionStatus(user.id, user.email)
            setSubscriptionStatus(status)
            
            // Get user plan based on subscription
            const plan = await subscriptionService.getUserPlan(user.id, user.email)
            setUserPlan(plan)
        
        // Validate data integrity first
        const integrityCheck = WatchlistService.validateDataIntegrity()
        if (!integrityCheck.valid) {
          toast.error(integrityCheck.message)
        }
        
        // Validate and sanitize watchlist data
        const validation = WatchlistService.validateWatchlistData()
        if (!validation.valid) {
          toast.warning(validation.message)
        }
        
        // Enforce limits on existing data
        const limitEnforcement = WatchlistService.enforceLimits()
        if (limitEnforcement.removed > 0) {
          toast.warning(limitEnforcement.message)
        }
        
        const savedWatchlist = WatchlistService.getWatchlist()
        setWatchlist(savedWatchlist)
        
        // Load portfolio data
        const savedPortfolio = localStorage.getItem('oryn_portfolio')
        if (savedPortfolio) {
          setPortfolio(JSON.parse(savedPortfolio))
        }
        
      } catch (error) {
        console.error('Error loading user data:', error)
        toast.error('Failed to load subscription data')
      }
    }

    loadUserData()
  }, [user])

  // Simulate live stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      const maxAlerts = userPlan.name === 'free' ? 5 : 20
      const maxOptionsFlow = userPlan.name === 'free' ? 3 : 10
      
      setLiveStats(prev => ({
        activeAlerts: Math.min(prev.activeAlerts + (Math.random() > 0.5 ? 1 : -1), maxAlerts),
        watchlistCount: watchlist.length,
        optionsFlowCount: Math.min(prev.optionsFlowCount + (Math.random() > 0.5 ? 1 : -1), maxOptionsFlow)
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [watchlist.length, userPlan.name])

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }


  const handleCreateWatchlist = () => {
    setIsWatchlistModalOpen(true)
  }

  const handleAddToWatchlist = (ticker: string) => {
    const result = WatchlistService.addToWatchlist(ticker, "")
    if (result.success) {
      const updatedWatchlist = WatchlistService.getWatchlist()
      setWatchlist(updatedWatchlist)
      setLiveStats(prev => ({ ...prev, watchlistCount: updatedWatchlist.length }))
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  const handleRefreshWatchlist = () => {
    const updatedWatchlist = WatchlistService.getWatchlist()
    setWatchlist(updatedWatchlist)
    setLiveStats(prev => ({ ...prev, watchlistCount: updatedWatchlist.length }))
    toast.success("Watchlist refreshed")
  }

  const handleRemoveFromWatchlist = (ticker: string) => {
    const result = WatchlistService.removeFromWatchlist(ticker)
    if (result.success) {
      const updatedWatchlist = WatchlistService.getWatchlist()
      setWatchlist(updatedWatchlist)
      setLiveStats(prev => ({ ...prev, watchlistCount: updatedWatchlist.length }))
      toast.success(result.message)
    } else {
      toast.error(result.message)
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

  const handleRefreshAlerts = () => {
    // Generate varied and realistic alert data
    const tickers = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'META', 'AMZN', 'NFLX', 'AMD', 'INTC', 'CRM', 'ADBE']
    const alertTypes = ['price_spike', 'volume_spike', 'earnings', 'news_alert', 'technical_breakout']
    const messages = {
      price_spike: ['price surged', 'price jumped', 'price spiked', 'significant price movement', 'price breakout'],
      volume_spike: ['volume increased', 'unusual volume detected', 'volume surge', 'high volume activity', 'volume spike'],
      earnings: ['earnings call summary', 'earnings update', 'earnings report', 'earnings guidance', 'earnings beat'],
      news_alert: ['breaking news', 'market news', 'company announcement', 'regulatory update', 'partnership news'],
      technical_breakout: ['technical breakout', 'resistance broken', 'support level', 'chart pattern', 'momentum shift']
    }
    
    const timeOptions = ['1 minute ago', '3 minutes ago', '5 minutes ago', '8 minutes ago', '12 minutes ago', '15 minutes ago', '20 minutes ago', '25 minutes ago']
    
    // Generate alerts based on actual watchlist data
    const newAlerts = watchlist.slice(0, 3).map((item, i) => {
      const type = alertTypes[i % alertTypes.length]
      const messageVariations = messages[type as keyof typeof messages]
      const message = messageVariations[i % messageVariations.length]
      const time = timeOptions[i % timeOptions.length]
      
      return {
        id: `alert_${item.ticker}_${i}`,
        type,
        ticker: item.ticker,
        message: `${item.ticker} ${message}`,
        time
      }
    })
    
    // Keep existing options flow alerts and update only non-options alerts
    const existingOptionsFlow = alerts.filter(alert => alert.type === 'options_flow')
    const updatedAlerts = [...newAlerts, ...existingOptionsFlow]
    setAlerts(updatedAlerts)
    toast.success('Alerts refreshed with new data')
  }

  const handleRefreshOptionsFlow = () => {
    // Generate varied and realistic options flow data
    const tickers = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'META', 'AMZN', 'NFLX', 'AMD', 'INTC', 'CRM', 'ADBE', 'JPM', 'BAC', 'WFC', 'GS']
    const optionsMessages = [
      'Massive put options purchased',
      'Unusual call activity detected', 
      'Institutional options flow',
      'Large block trade detected',
      'Unusual options volume',
      'Big money options activity',
      'Institutional put buying',
      'Call options surge',
      'Options flow anomaly',
      'Unusual strike activity',
      'Block options trade',
      'Institutional call buying',
      'Options volume spike',
      'Unusual expiration activity',
      'Large options position'
    ]
    
    const timeOptions = ['1 minute ago', '2 minutes ago', '4 minutes ago', '6 minutes ago', '9 minutes ago', '11 minutes ago', '14 minutes ago', '18 minutes ago']
    
    // Generate options flow based on actual portfolio data
    const newOptionsFlow = portfolio.slice(0, 2).map((item, i) => {
      const message = optionsMessages[i % optionsMessages.length]
      const time = timeOptions[i % timeOptions.length]
      
      return {
        id: `options_${item.ticker}_${i}`,
        type: 'options_flow',
        ticker: item.ticker,
        message: `${item.ticker}: ${message}`,
        time
      }
    })
    
    // Keep existing non-options flow alerts and update only options flow alerts
    const existingNonOptionsFlow = alerts.filter(alert => alert.type !== 'options_flow')
    const updatedAlerts = [...existingNonOptionsFlow, ...newOptionsFlow]
    setAlerts(updatedAlerts)
    toast.success('Options flow refreshed with new data')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="h-16 bg-muted rounded mb-8" />
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Oryn Dashboard</span>
            </div>
            
                {/* Navigation Menu */}
                <div className="hidden md:flex items-center space-x-6">
                  <button 
                    onClick={() => handleNavigation('features')} 
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Features
                  </button>
                  <button 
                    onClick={() => handleNavigation('pricing')} 
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Pricing
                  </button>
                  <button 
                    onClick={() => handleNavigation('docs')} 
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Docs
                  </button>
                </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {user.email}
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">

          <Card className="hover-lift bg-gradient-to-br from-success/10 to-success/5 border-success/20 group">
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

          <Card className="hover-lift bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 group">
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

          <Card className="hover-lift bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 group">
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
            <Card className="p-8 mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Welcome to Oryn!</CardTitle>
                    <CardDescription>
                      Your comprehensive stock intelligence platform for real-time alerts and portfolio tracking.
                    </CardDescription>
                  </div>
                  {subscriptionStatus.hasActiveSubscription && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                      subscriptionStatus.isMasterAccount 
                        ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20'
                        : 'bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20'
                    }`}>
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
                            ? 'Pro Trial' 
                            : 'Pro Plan'
                        }
                        {!subscriptionStatus.isMasterAccount && subscriptionStatus.daysRemaining !== null && subscriptionStatus.daysRemaining > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({subscriptionStatus.daysRemaining} days left)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-6 bg-muted">
                <div className="text-lg font-semibold mb-2">1. Track Portfolio</div>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your investments to get personalized AI analysis
                </p>
                <Button size="sm" className="w-full" onClick={() => document.getElementById('portfolio-tracker-section')?.scrollIntoView({ behavior: 'smooth' })}>
                  Track Portfolio
                </Button>
              </Card>

              <Card className="p-6 bg-muted">
                <div className="text-lg font-semibold mb-2">2. Create Watchlist</div>
                <p className="text-sm text-muted-foreground mb-4">
                  Add tickers you want to monitor for alerts
                </p>
                <Button size="sm" variant="outline" className="w-full" onClick={handleCreateWatchlist}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Watchlist
                </Button>
              </Card>

              <Card className="p-6 bg-muted">
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

        {/* Active Alerts and Options Flow - Below Welcome */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Active Alerts */}
          <Card>
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
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="p-4 bg-gradient-to-r from-success/10 to-success/5 border border-success/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                      <span className="font-medium text-success">{alert.ticker}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{alert.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <div className="mt-2 text-xs text-success/70">
                    {alert.type === 'price_spike' && '📈 Price Movement Alert'}
                    {alert.type === 'volume_spike' && '📊 Volume Alert'}
                    {alert.type === 'earnings' && '📋 Earnings Alert'}
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium mb-2">No active alerts</p>
                  <p className="text-sm">Set up alerts to start monitoring your stocks</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Options Flow */}
          <Card>
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
              {alerts.filter(alert => alert.type === 'options_flow').slice(0, 3).map((alert) => (
                <div key={alert.id} className="p-4 bg-gradient-to-r from-secondary/10 to-secondary/5 border border-secondary/20 rounded-lg">
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
              ))}
              {alerts.filter(alert => alert.type === 'options_flow').length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium mb-2">No options flow detected</p>
                  <p className="text-sm">Monitor for unusual options activity</p>
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

            {/* Priority Support - Only show for Pro/Master users */}
            {(userPlan.name === 'pro' || userPlan.name === 'master') && (
              <div className="mb-8">
                <PrioritySupport />
              </div>
            )}

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
                    <Button size="sm" variant="outline" onClick={handleRefreshWatchlist}>
                      <RefreshCw className="h-4 w-4" />
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
                  watchlist.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{item.ticker}</div>
                          <div className="text-sm text-muted-foreground">{item.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium">${item.price.toFixed(2)}</div>
                          <div className={`text-sm ${item.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
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
        onAdd={handleAddToWatchlist}
      />
      </div>
    </TooltipProvider>
  )
}
