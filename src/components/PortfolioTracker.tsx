"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  PieChart,
  BarChart3,
  RefreshCw,
  Loader2,
  Brain,
  Lightbulb
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { subscriptionService } from "@/lib/subscription-service"
import { stockDataService } from "@/lib/stock-data-service"
import { StockSuggestionsService, StockSuggestion } from "@/lib/stock-suggestions"

interface PortfolioItem {
  id: string
  ticker: string
  name: string
  shares: number
  avgPrice: number
  currentPrice: number
  totalValue: number
  gainLoss: number
  gainLossPercent: number
  addedAt: string
}

interface PortfolioSummary {
  totalValue: number
  totalGainLoss: number
  totalGainLossPercent: number
  totalInvested: number
  dayChange: number
  dayChangePercent: number
}

export function PortfolioTracker() {
  const { user } = useAuth()
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [summary, setSummary] = useState<PortfolioSummary>({
    totalValue: 0,
    totalGainLoss: 0,
    totalGainLossPercent: 0,
    totalInvested: 0,
    dayChange: 0,
    dayChangePercent: 0
  })
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [addingStock, setAddingStock] = useState(false)
  const [stockSuggestions, setStockSuggestions] = useState<StockSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [userPlan, setUserPlan] = useState<{ name: string; maxWatchlistItems: number } | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState({
    riskScore: 0,
    diversification: '',
    recommendations: [] as string[],
    marketOutlook: '',
    topPerformers: [] as string[],
    underPerformers: [] as string[]
  })
  const [newItem, setNewItem] = useState({
    ticker: '',
    name: '',
    shares: '',
    avgPrice: ''
  })

  useEffect(() => {
    if (user) {
      loadUserPlan()
      loadPortfolio()
    }
  }, [user])

  const loadUserPlan = async () => {
    if (!user) return
    try {
      const plan = await subscriptionService.getUserPlan(user.id, user.email)
      setUserPlan(plan)
    } catch (error) {
      console.error('Error loading user plan:', error)
    }
  }

  const loadPortfolio = async () => {
    setLoading(true)
    try {
      // Load from localStorage for now (in real app, this would be from API)
      const stored = localStorage.getItem('oryn_portfolio')
      if (stored) {
        const portfolioData = JSON.parse(stored)
        setPortfolio(portfolioData)
        calculateSummary(portfolioData)
      }
    } catch (error) {
      console.error('Error loading portfolio:', error)
      toast.error('Failed to load portfolio')
    } finally {
      setLoading(false)
    }
  }

  const calculateSummary = (portfolioData: PortfolioItem[]) => {
    const totalValue = portfolioData.reduce((sum, item) => sum + item.totalValue, 0)
    const totalInvested = portfolioData.reduce((sum, item) => sum + (item.shares * item.avgPrice), 0)
    const totalGainLoss = totalValue - totalInvested
    const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0

    setSummary({
      totalValue,
      totalGainLoss,
      totalGainLossPercent,
      totalInvested,
      dayChange: totalGainLoss * 0.02, // Mock day change
      dayChangePercent: 2.0
    })
    
    // Generate AI analysis
    generateAIAnalysis(portfolioData)
  }

  const generateAIAnalysis = async (portfolioData: PortfolioItem[]) => {
    try {
      const totalValue = portfolioData.reduce((sum, item) => sum + item.totalValue, 0)
      const totalInvested = portfolioData.reduce((sum, item) => sum + (item.shares * item.avgPrice), 0)
      const totalGainLoss = totalValue - totalInvested
      const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0
      
      // Calculate risk score based on portfolio diversity and volatility
      const concentrationRisk = portfolioData.length < 3 ? 40 : portfolioData.length < 5 ? 20 : 0
      const volatilityRisk = Math.abs(totalGainLossPercent) > 30 ? 25 : Math.abs(totalGainLossPercent) > 15 ? 15 : 0
      const downsideRisk = (portfolioData.filter(item => item.gainLossPercent < -15).length / Math.max(portfolioData.length, 1)) * 35
      const sizeRisk = portfolioData.length === 1 ? 20 : 0
      
      const riskScore = Math.min(100, Math.max(0, 
        30 + concentrationRisk + volatilityRisk + downsideRisk + sizeRisk
      ))
      
      // Generate diversification analysis
      let diversification = 'Concentrated'
      if (portfolioData.length >= 10) {
        diversification = 'Well Diversified'
      } else if (portfolioData.length >= 5) {
        diversification = 'Moderately Diversified'
      } else if (portfolioData.length >= 3) {
        diversification = 'Somewhat Diversified'
      } else {
        diversification = 'Concentrated'
      }
      
      // Generate recommendations
      const recommendations = []
      if (portfolioData.length < 5) {
        recommendations.push('Consider adding more positions for better diversification')
      }
      if (totalGainLossPercent < -10) {
        recommendations.push('Review underperforming positions and consider rebalancing')
      }
      if (riskScore > 70) {
        recommendations.push('Portfolio shows high risk - consider adding defensive positions')
      }
      if (recommendations.length === 0) {
        recommendations.push('Portfolio is well-balanced and performing well')
      }
      
      // Identify top and under performers
      const sortedByPerformance = [...portfolioData].sort((a, b) => b.gainLossPercent - a.gainLossPercent)
      
      // Only show performers if we have enough stocks to differentiate
      let topPerformers: string[] = []
      let underPerformers: string[] = []
      
      if (portfolioData.length >= 3) {
        // For 3+ stocks, show top 2 and bottom 2
        topPerformers = sortedByPerformance.slice(0, 2).map(item => item.ticker)
        underPerformers = sortedByPerformance.slice(-2).map(item => item.ticker)
      } else if (portfolioData.length === 2) {
        // For 2 stocks, show the better and worse performer
        const better = sortedByPerformance[0]
        const worse = sortedByPerformance[1]
        if (better.gainLossPercent > worse.gainLossPercent) {
          topPerformers = [better.ticker]
          underPerformers = [worse.ticker]
        } else {
          topPerformers = [worse.ticker]
          underPerformers = [better.ticker]
        }
      } else if (portfolioData.length === 1) {
        // For 1 stock, show it as top performer if positive, under performer if negative
        const stock = sortedByPerformance[0]
        if (stock.gainLossPercent >= 0) {
          topPerformers = [stock.ticker]
        } else {
          underPerformers = [stock.ticker]
        }
      }
      
      setAiAnalysis({
        riskScore: Math.round(riskScore),
        diversification,
        recommendations,
        marketOutlook: totalGainLossPercent > 5 ? 'Bullish' : totalGainLossPercent < -5 ? 'Bearish' : 'Neutral',
        topPerformers,
        underPerformers
      })
    } catch (error) {
      console.error('Error generating AI analysis:', error)
    }
  }

  const fetchStockPrice = async (ticker: string): Promise<number> => {
    try {
      const quote = await stockDataService.getStockQuote(ticker)
      return quote.price
    } catch (error) {
      console.error('Error fetching stock price:', error)
      // Fallback to mock price if API fails
      const mockPrices: Record<string, number> = {
        'AAPL': 175.43,
        'MSFT': 378.85,
        'GOOGL': 140.11,
        'AMZN': 180.50,
        'NVDA': 920.70,
        'TSLA': 250.30,
        'META': 320.15,
        'NFLX': 450.20
      }
      
      return mockPrices[ticker.toUpperCase()] || 150.00
    }
  }

  const handleTickerChange = async (value: string) => {
    setNewItem({ ...newItem, ticker: value.toUpperCase() })
    
    if (value.length > 0) {
      setLoadingSuggestions(true)
      const suggestions = StockSuggestionsService.getSuggestions(value, 8)
      // Fetch price data for suggestions
      const suggestionsWithPrices = await Promise.all(
        suggestions.map(async (suggestion) => {
          const stockWithPrice = await StockSuggestionsService.getStockWithPrice(suggestion.symbol)
          return stockWithPrice || suggestion
        })
      )
      setStockSuggestions(suggestionsWithPrices)
      setShowSuggestions(true)
      setLoadingSuggestions(false)
    } else {
      setShowSuggestions(false)
      setLoadingSuggestions(false)
    }
  }

  const handleSuggestionClick = async (suggestion: StockSuggestion) => {
    setNewItem({ 
      ...newItem, 
      ticker: suggestion.symbol,
      name: suggestion.name,
      avgPrice: suggestion.avgPrice?.toString() || ''
    })
    setShowSuggestions(false)
  }

  const handleAddStock = async () => {
    console.log('handleAddStock called with:', newItem)
    if (!newItem.ticker || !newItem.shares || !newItem.avgPrice) {
      toast.error('Please fill in all required fields')
      return
    }

    // Check plan limits
    const maxItems = userPlan?.name === 'free' ? 5 : -1
    if (maxItems !== -1 && portfolio.length >= maxItems) {
      toast.error(`Free plan allows maximum ${maxItems} portfolio items. Upgrade to Pro for unlimited tracking!`)
      return
    }

    // Prevent multiple submissions
    if (addingStock) {
      toast.error('Please wait, adding stock...')
      return
    }

    setAddingStock(true)
    try {
      const currentPrice = await fetchStockPrice(newItem.ticker)
      const shares = parseFloat(newItem.shares)
      const avgPrice = parseFloat(newItem.avgPrice)
      
      // Validate numeric inputs
      if (isNaN(shares) || isNaN(avgPrice) || shares <= 0 || avgPrice <= 0) {
        toast.error('Please enter valid numbers for shares and price')
        return
      }
      
      const totalValue = shares * currentPrice
      const gainLoss = totalValue - (shares * avgPrice)
      const gainLossPercent = (gainLoss / (shares * avgPrice)) * 100

      const newPortfolioItem: PortfolioItem = {
        id: `portfolio_${Math.floor(Math.random() * 1000000)}`,
        ticker: newItem.ticker.toUpperCase(),
        name: newItem.name || newItem.ticker.toUpperCase(),
        shares,
        avgPrice,
        currentPrice,
        totalValue,
        gainLoss,
        gainLossPercent,
        addedAt: new Date().toISOString()
      }

      const updatedPortfolio = [...portfolio, newPortfolioItem]
      setPortfolio(updatedPortfolio)
      calculateSummary(updatedPortfolio)
      
      // Save to localStorage
      localStorage.setItem('oryn_portfolio', JSON.stringify(updatedPortfolio))
      
      // Reset form and close modal
      setNewItem({ ticker: '', name: '', shares: '', avgPrice: '' })
      setShowSuggestions(false)
      setAdding(false)
      toast.success(`${newItem.ticker} added to portfolio!`)
    } catch (error) {
      console.error('Error adding stock:', error)
      toast.error('Failed to add stock to portfolio. Please try again.')
    } finally {
      setAddingStock(false)
    }
  }

  const handleRemoveStock = (id: string) => {
    const updatedPortfolio = portfolio.filter(item => item.id !== id)
    setPortfolio(updatedPortfolio)
    calculateSummary(updatedPortfolio)
    localStorage.setItem('oryn_portfolio', JSON.stringify(updatedPortfolio))
    toast.success('Stock removed from portfolio')
  }

  const handleRefreshPrices = async () => {
    setLoading(true)
    try {
      const updatedPortfolio = await Promise.all(
        portfolio.map(async (item) => {
          const newPrice = await fetchStockPrice(item.ticker)
          const newTotalValue = item.shares * newPrice
          const newGainLoss = newTotalValue - (item.shares * item.avgPrice)
          const newGainLossPercent = (newGainLoss / (item.shares * item.avgPrice)) * 100

          return {
            ...item,
            currentPrice: newPrice,
            totalValue: newTotalValue,
            gainLoss: newGainLoss,
            gainLossPercent: newGainLossPercent
          }
        })
      )
      
      setPortfolio(updatedPortfolio)
      calculateSummary(updatedPortfolio)
      localStorage.setItem('oryn_portfolio', JSON.stringify(updatedPortfolio))
      toast.success('Portfolio prices updated!')
    } catch (error) {
      console.error('Error refreshing prices:', error)
      toast.error('Failed to refresh prices')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`
  }

  if (loading) {
    return (
      <Card className="p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading portfolio...</span>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <PieChart className="h-6 w-6 text-primary" />
            Portfolio Tracker
          </h2>
          <p className="text-muted-foreground">
            Track your investments and portfolio performance
            {userPlan?.name === 'free' && (
              <span className="text-warning ml-2">(Free Plan: {portfolio.length}/5 items)</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefreshPrices} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Prices
          </Button>
          <Button onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Stock
          </Button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summary.dayChange)} today
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
            {summary.totalGainLoss >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(summary.totalGainLoss)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatPercent(summary.totalGainLossPercent)}
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalInvested)}</div>
            <p className="text-xs text-muted-foreground">Initial investment</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Day Change</CardTitle>
            {summary.dayChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.dayChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(summary.dayChange)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatPercent(summary.dayChangePercent)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Stock Modal */}
      {adding && (
        <Card>
          <CardHeader>
            <CardTitle>Add Stock to Portfolio</CardTitle>
            <CardDescription>Enter the stock details to track in your portfolio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <Label htmlFor="ticker">Stock Ticker *</Label>
                <Input
                  id="ticker"
                  value={newItem.ticker}
                  onChange={(e) => handleTickerChange(e.target.value)}
                  onFocus={async () => {
                    if (newItem.ticker.length > 0) {
                      setShowSuggestions(true)
                    } else {
                      setLoadingSuggestions(true)
                      // Show popular stocks when field is focused but empty
                      const popularStocks = StockSuggestionsService.getPopularStocks(8)
                      // Fetch price data for popular stocks
                      const popularStocksWithPrices = await Promise.all(
                        popularStocks.map(async (stock) => {
                          const stockWithPrice = await StockSuggestionsService.getStockWithPrice(stock.symbol)
                          return stockWithPrice || stock
                        })
                      )
                      setStockSuggestions(popularStocksWithPrices)
                      setShowSuggestions(true)
                      setLoadingSuggestions(false)
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding suggestions to allow clicks
                    setTimeout(() => setShowSuggestions(false), 200)
                  }}
                  placeholder="e.g., AAPL"
                  required
                />
                {showSuggestions && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {loadingSuggestions ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading stock prices...
                      </div>
                    ) : stockSuggestions.length > 0 ? (
                      stockSuggestions.map((suggestion, index) => (
                        <div
                          key={`${suggestion.symbol}-${index}`}
                          className="px-4 py-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{suggestion.symbol}</div>
                            <div className="text-xs text-muted-foreground">{suggestion.name}</div>
                            {suggestion.price && (
                              <div className="text-xs text-green-600 font-medium">
                                ${suggestion.price.toFixed(2)}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {suggestion.sector}
                            </Badge>
                            {suggestion.changePercent && (
                              <div className={`text-xs font-medium ${
                                suggestion.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {suggestion.changePercent >= 0 ? '+' : ''}{suggestion.changePercent.toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-muted-foreground">
                        No stocks found matching &quot;{newItem.ticker}&quot;
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="name">Company Name (Optional)</Label>
                <Input
                  id="name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g., Apple Inc."
                />
              </div>
              <div>
                <Label htmlFor="shares">Number of Shares *</Label>
                <Input
                  id="shares"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={newItem.shares}
                  onChange={(e) => setNewItem({ ...newItem, shares: e.target.value })}
                  placeholder="e.g., 10"
                  required
                />
              </div>
              <div>
                <Label htmlFor="avgPrice">Average Price per Share *</Label>
                <Input
                  id="avgPrice"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={newItem.avgPrice}
                  onChange={(e) => setNewItem({ ...newItem, avgPrice: e.target.value })}
                  placeholder="e.g., 150.00"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddStock} disabled={addingStock}>
                {addingStock ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stock
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setAdding(false)} disabled={addingStock}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Holdings */}
      <Card>
        <CardHeader>
          <CardTitle>Your Holdings</CardTitle>
          <CardDescription>
            {portfolio.length === 0 
              ? "No stocks in your portfolio yet. Add some stocks to get started!"
              : `${portfolio.length} stock${portfolio.length === 1 ? '' : 's'} in your portfolio`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {portfolio.length === 0 ? (
            <div className="text-center py-8">
              <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Start building your portfolio by adding stocks</p>
            </div>
          ) : (
            <div className="space-y-4">
              {portfolio.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/70 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <div className="font-medium">{item.ticker}</div>
                        <div className="text-sm text-muted-foreground">{item.name}</div>
                      </div>
                      <Badge variant="outline">
                        {item.shares} shares
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Current Price</div>
                        <div className="font-medium">{formatCurrency(item.currentPrice)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Total Value</div>
                        <div className="font-medium">{formatCurrency(item.totalValue)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Gain/Loss</div>
                        <div className={`font-medium ${item.gainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatCurrency(item.gainLoss)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Gain/Loss %</div>
                        <div className={`font-medium ${item.gainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatPercent(item.gainLossPercent)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleRemoveStock(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Analysis Section */}
      {portfolio.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Portfolio Analysis
            </CardTitle>
            <CardDescription>
              Intelligent insights and recommendations for your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Risk Score */}
              <Card className="p-4">
                <CardHeader className="p-0 pb-2">
                  <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex items-center gap-2">
                    <div className={`text-2xl font-bold ${
                      aiAnalysis.riskScore < 40 ? 'text-green-500' : 
                      aiAnalysis.riskScore < 70 ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {aiAnalysis.riskScore}/100
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {aiAnalysis.riskScore < 40 ? 'Low Risk' : 
                       aiAnalysis.riskScore < 70 ? 'Medium Risk' : 'High Risk'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Diversification */}
              <Card className="p-4">
                <CardHeader className="p-0 pb-2">
                  <CardTitle className="text-sm font-medium">Diversification</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="text-lg font-semibold text-primary">
                    {aiAnalysis.diversification}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {portfolio.length} position{portfolio.length === 1 ? '' : 's'}
                  </div>
                </CardContent>
              </Card>

              {/* Market Outlook */}
              <Card className="p-4">
                <CardHeader className="p-0 pb-2">
                  <CardTitle className="text-sm font-medium">Market Outlook</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className={`text-lg font-semibold ${
                    aiAnalysis.marketOutlook === 'Bullish' ? 'text-green-500' :
                    aiAnalysis.marketOutlook === 'Bearish' ? 'text-red-500' : 'text-yellow-500'
                  }`}>
                    {aiAnalysis.marketOutlook}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Based on portfolio performance
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            <div className="mt-6">
              <h4 className="font-semibold mb-3">AI Recommendations</h4>
              <div className="space-y-2">
                {aiAnalysis.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                    <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top & Under Performers */}
            {(aiAnalysis.topPerformers.length > 0 || aiAnalysis.underPerformers.length > 0) && (
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                {/* Top Performers */}
                {aiAnalysis.topPerformers.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-green-600 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Top Performers
                    </h4>
                    <div className="space-y-2">
                      {aiAnalysis.topPerformers.map((ticker, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-medium">{ticker}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Under Performers */}
                {aiAnalysis.underPerformers.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-red-600 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Under Performers
                    </h4>
                    <div className="space-y-2">
                      {aiAnalysis.underPerformers.map((ticker, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="font-medium">{ticker}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
