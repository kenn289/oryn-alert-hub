"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Badge } from "../components/ui/badge"
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
import { DataFreshnessIndicator, RateLimitBanner } from "../components/DataFreshnessIndicator"
import { useAuth } from "../contexts/AuthContext"
import { subscriptionService } from "../lib/subscription-service"
import { stockDataService } from "../lib/stock-data-service"
import { globalStockService } from "../lib/global-stock-service"
import { StockSuggestionsService, StockSuggestion } from "../lib/stock-suggestions"
import { GlobalStockSelector } from "../components/GlobalStockSelector"
import { localizationService } from "../lib/localization-service"
import { currencyConversionService } from "../lib/currency-conversion-service"
import { useCurrency } from "../contexts/CurrencyContext"
import { PortfolioService, PortfolioItem, PortfolioSummary } from "../lib/portfolio-service"
import { DatabasePortfolioService } from "../lib/database-portfolio-service"

// Remove duplicate interfaces as they're now imported from portfolio-service

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
  const [rateLimitWarning, setRateLimitWarning] = useState(false)
  const [lastDataFetch, setLastDataFetch] = useState<{
    source: 'fresh' | 'cached' | 'fallback'
    rateLimited: boolean
    age?: string
  } | null>(null)
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
    avgPriceUSD: '',
    avgPriceLocal: '',
    avgPriceCurrency: 'USD',
    market: 'US',
    currency: 'USD'
  })
  const [isIndianUser, setIsIndianUser] = useState(false)
  const [showGlobalSelector, setShowGlobalSelector] = useState(false)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [loadingPrice, setLoadingPrice] = useState(false)
  const [conversionRate, setConversionRate] = useState(1)
  const [isConverting, setIsConverting] = useState(false)

  // Get currency context early to avoid initialization issues
  const { formatCurrency: contextFormatCurrency, selectedCurrency, setSelectedCurrency } = useCurrency()

  useEffect(() => {
    if (user) {
      loadUserPlan()
      loadPortfolio()
    }
    detectUserLocation()
  }, [user])

  // Load conversion rate when global currency changes
  useEffect(() => {
    if (selectedCurrency) {
      loadConversionRate()
    }
  }, [selectedCurrency])


  const detectUserLocation = () => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const isIndia = timezone === 'Asia/Kolkata' || timezone === 'Asia/Calcutta'
    setIsIndianUser(isIndia)
    
    // Set default market for Indian users
    if (isIndia) {
      setNewItem(prev => ({
        ...prev,
        market: 'IN',
        currency: 'INR',
        avgPriceCurrency: 'INR'
      }))
    }
  }

  // Load conversion rate for the selected currency
  const loadConversionRate = async () => {
    if (selectedCurrency === 'USD') {
      setConversionRate(1)
      return
    }

    try {
      setIsConverting(true)
      const rate = await currencyConversionService.getConversionRate('USD', selectedCurrency)
      setConversionRate(rate)
    } catch (error) {
      console.error('Error loading conversion rate:', error)
      // Use fallback rates
      const fallbackRates: { [key: string]: number } = {
        'INR': 83.5,
        'EUR': 0.92,
        'GBP': 0.79,
        'JPY': 150,
        'AUD': 1.52,
        'CAD': 1.36
      }
      setConversionRate(fallbackRates[selectedCurrency] || 1)
    } finally {
      setIsConverting(false)
    }
  }

  // Convert USD to local currency
  const convertUSDToLocal = (usdAmount: number) => {
    return usdAmount * conversionRate
  }

  // Convert local currency to USD
  const convertLocalToUSD = (localAmount: number) => {
    return localAmount / conversionRate
  }

  // Handle USD price change
  const handleUSDPriceChange = (usdPrice: string) => {
    const usdValue = parseFloat(usdPrice) || 0
    const localValue = convertUSDToLocal(usdValue)
    
    setNewItem(prev => ({
      ...prev,
      avgPriceUSD: usdPrice,
      avgPriceLocal: localValue.toFixed(2)
    }))
  }

  // Handle local currency price change
  const handleLocalPriceChange = (localPrice: string) => {
    const localValue = parseFloat(localPrice) || 0
    const usdValue = convertLocalToUSD(localValue)
    
    setNewItem(prev => ({
      ...prev,
      avgPriceLocal: localPrice,
      avgPriceUSD: usdValue.toFixed(2)
    }))
  }

  const loadUserPlan = async () => {
    if (!user) return
    try {
      const plan = await subscriptionService.getUserPlan(user.id, user.email)
      setUserPlan(plan)
    } catch (error) {
      console.error('Error loading user plan:', error)
    }
  }

  // Fetch current stock price when ticker changes
  const fetchCurrentPrice = async (ticker: string, market: string = 'US') => {
    if (!ticker || ticker.length < 1) {
      setCurrentPrice(null)
      return
    }

    setLoadingPrice(true)
    try {
      // Determine the correct market based on symbol suffix or numeric codes
      const inferMarketFromSymbol = (symbol: string): string | undefined => {
        const upper = symbol.toUpperCase().trim()
        if (/^\d+$/.test(upper)) return 'IN' // BSE numeric codes
        if (upper.endsWith('.NS') || upper.endsWith('.BO')) return 'IN'
        if (upper.endsWith('.T')) return 'JP'
        if (upper.endsWith('.L')) return 'GB'
        if (upper.endsWith('.AX')) return 'AU'
        if (upper.endsWith('.TO')) return 'CA'
        if (upper.endsWith('.DE')) return 'DE'
        if (upper.endsWith('.PA')) return 'FR'
        return undefined
      }
      const inferred = inferMarketFromSymbol(ticker)
      let correctMarket = inferred || market
      
      console.log(`📊 Fetching current price for ${ticker} from ${correctMarket}...`)
      const response = await fetch(`/api/stock/global/${ticker}?market=${correctMarket}`)
      
      if (response.ok) {
        const stockData = await response.json()
        if (stockData && stockData.price) {
          const stockCurrency = stockData.currency || 'USD'
          console.log(`📊 Full API response:`, stockData)
          console.log(`📊 Stock data: ${stockData.symbol} = ${stockData.price} ${stockCurrency}`)
          
          // Convert to USD if the stock is in a different currency
          let priceInUSD = stockData.price
          if (stockCurrency !== 'USD') {
            try {
              priceInUSD = currencyConversionService.convertCurrency(stockData.price, stockCurrency, 'USD')
              console.log(`🔄 Converted ${stockCurrency} ${stockData.price} to USD ${priceInUSD}`)
            } catch (error) {
              console.error(`❌ Conversion failed:`, error)
              priceInUSD = stockData.price // Fallback to original price
            }
          } else {
            console.log(`✅ Already in USD: ${stockData.price}`)
          }
          
          // Always store in USD
          setNewItem(prev => ({ ...prev, currency: 'USD' }))
          setCurrentPrice(priceInUSD)
          console.log(`✅ Final price for ${ticker}: $${priceInUSD.toFixed(2)} USD`)
          
          // Auto-populate both USD and local currency fields
          const localPrice = convertUSDToLocal(priceInUSD)
          
          setNewItem(prev => ({
            ...prev,
            avgPriceUSD: priceInUSD.toFixed(2),
            avgPriceLocal: localPrice.toFixed(2)
          }))
        } else {
          setCurrentPrice(null)
        }
      } else {
        setCurrentPrice(null)
      }
    } catch (error) {
      console.error(`Failed to fetch price for ${ticker}:`, error)
      setCurrentPrice(null)
    } finally {
      setLoadingPrice(false)
    }
  }

  const loadPortfolio = async () => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      console.log('📊 Loading portfolio for user:', user.id)
      
      // First try to migrate any localStorage data to database
      await PortfolioService.migrateFromLocalStorage(user.id)
      
      // Load portfolio from database
      let portfolioData = await PortfolioService.getPortfolio(user.id)
      console.log('📊 Loaded portfolio data from database:', portfolioData)
      
      // If no data in database, try localStorage as fallback
      if (!portfolioData || portfolioData.length === 0) {
        console.log('📊 No database data, checking localStorage...')
        const localData = PortfolioService.getPortfolioFromLocalStorage()
        if (localData && localData.length > 0) {
          console.log('📊 Found localStorage data, migrating to database...')
          // Migrate localStorage data to database
          for (const item of localData) {
            await PortfolioService.addToPortfolio(
              item.ticker,
              item.name,
              item.shares,
              item.avgPrice,
              item.currentPrice,
              item.market,
              item.currency,
              user.id
            )
          }
          // Reload from database after migration
          portfolioData = await PortfolioService.getPortfolio(user.id)
          console.log('📊 Portfolio data after migration:', portfolioData)
        }
      }
      
      setPortfolio(portfolioData || [])
      
      // Only calculate summary if we have valid data
      if (portfolioData && portfolioData.length > 0) {
        calculateSummary(portfolioData)
        // Also save to localStorage for consistency
        PortfolioService.saveToLocalStorage(portfolioData)
      } else {
        console.log('📊 No portfolio data, resetting summary')
        setSummary({
          totalValue: 0,
          totalGainLoss: 0,
          totalGainLossPercent: 0,
          totalInvested: 0,
          dayChange: 0,
          dayChangePercent: 0
        })
      }
    } catch (error) {
      console.error('Error loading portfolio:', error)
      toast.error('Failed to load portfolio')
      // Reset summary on error
      setSummary({
        totalValue: 0,
        totalGainLoss: 0,
        totalGainLossPercent: 0,
        totalInvested: 0,
        dayChange: 0,
        dayChangePercent: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateSummary = (portfolioData: PortfolioItem[]) => {
    console.log('📊 Calculating portfolio summary for', portfolioData.length, 'items')
    
    // Safe calculation with proper number handling
    const totalValue = portfolioData.reduce((sum, item) => {
      const shares = Number(item.shares) || 0
      const currentPrice = Number(item.currentPrice) || 0
      const itemValue = shares * currentPrice
      console.log(`📊 Item ${item.ticker}: shares=${shares}, price=${currentPrice}, value=${itemValue}`)
      return sum + itemValue
    }, 0)
    
    const totalInvested = portfolioData.reduce((sum, item) => {
      const shares = Number(item.shares) || 0
      const avgPrice = Number(item.avgPrice) || 0
      return sum + (shares * avgPrice)
    }, 0)
    
    const totalGainLoss = totalValue - totalInvested
    const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0

    console.log('📊 Portfolio summary calculated:', { totalValue, totalInvested, totalGainLoss, totalGainLossPercent })

    setSummary({
      totalValue: totalValue || 0,
      totalGainLoss: totalGainLoss || 0,
      totalGainLossPercent: totalGainLossPercent || 0,
      totalInvested: totalInvested || 0,
      dayChange: 0, // Real-time calculation will be implemented
      dayChangePercent: 0
    })
    
    // Generate AI analysis
    generateAIAnalysis(portfolioData)
  }

  const generateAIAnalysis = async (portfolioData: PortfolioItem[]) => {
    try {
      const totalValue = portfolioData.reduce((sum, item) => {
        const shares = Number(item.shares) || 0
        const currentPrice = Number(item.currentPrice) || 0
        return sum + (shares * currentPrice)
      }, 0)
      const totalInvested = portfolioData.reduce((sum, item) => {
        const shares = Number(item.shares) || 0
        const avgPrice = Number(item.avgPrice) || 0
        return sum + (shares * avgPrice)
      }, 0)
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
      // Infer market from symbol
      const inferMarketFromSymbol = (symbol: string): string | undefined => {
        const upper = symbol.toUpperCase().trim()
        if (/^\d+$/.test(upper)) return 'IN'
        if (upper.endsWith('.NS') || upper.endsWith('.BO')) return 'IN'
        if (upper.endsWith('.T')) return 'JP'
        if (upper.endsWith('.L')) return 'GB'
        if (upper.endsWith('.AX')) return 'AU'
        if (upper.endsWith('.TO')) return 'CA'
        if (upper.endsWith('.DE')) return 'DE'
        if (upper.endsWith('.PA')) return 'FR'
        return undefined
      }
      const market = inferMarketFromSymbol(ticker) || 'US'
      const response = await fetch(`/api/stock/global/${ticker}?market=${market}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      const stockCurrency = data.currency || 'USD'
      let priceInUSD = data.price
      if (stockCurrency !== 'USD') {
        priceInUSD = currencyConversionService.convertCurrency(data.price, stockCurrency, 'USD')
      }
      return priceInUSD
    } catch (error) {
      console.error('Error fetching real-time stock price:', error)
      throw error // Don't fallback to mock data
    }
  }

  const handleTickerChange = async (value: string) => {
    setNewItem({ ...newItem, ticker: value.toUpperCase() })
    
    // Fetch current price for the ticker
    if (value.length >= 1) {
      fetchCurrentPrice(value.toUpperCase(), newItem.market)
    } else {
      setCurrentPrice(null)
    }
    
    if (value.length > 0) {
      setLoadingSuggestions(true)
      // Use global search to find stocks from all countries
      const suggestions = await StockSuggestionsService.getGlobalSuggestions(value, 8)
      // Fetch price data for suggestions
      const suggestionsWithPrices = await Promise.all(
        suggestions.map(async (suggestion) => {
          const stockWithPrice = await StockSuggestionsService.getStockWithPrice(suggestion.symbol, suggestion.market)
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
      market: suggestion.market || 'US',
      currency: suggestion.currency || 'USD',
      avgPrice: suggestion.avgPrice?.toString() || ''
    })
    setShowSuggestions(false)
    // Fetch current price for the selected ticker
    fetchCurrentPrice(suggestion.symbol, suggestion.market || 'US')
  }

  const handleGlobalStockSelect = (stock: any) => {
    setNewItem({
      ...newItem,
      ticker: stock.symbol,
      name: stock.name,
      market: stock.market,
      currency: stock.currency
    })
    setShowGlobalSelector(false)
    fetchCurrentPrice(stock.symbol, stock.market)
  }

  const handleAddStock = async () => {
    if (!user?.id) {
      toast.error('Please log in to add stocks to your portfolio')
      return
    }

    console.log('🚀 handleAddStock called with:', newItem)
    console.log('🔍 Validation check:', {
      ticker: newItem.ticker,
      shares: newItem.shares,
      avgPriceUSD: newItem.avgPriceUSD,
      avgPriceLocal: newItem.avgPriceLocal,
      avgPriceCurrency: newItem.avgPriceCurrency,
      name: newItem.name,
      market: newItem.market,
      currency: newItem.currency
    })
    
    // Check if we have either USD or local currency price
    const hasUSDPrice = newItem.avgPriceUSD && newItem.avgPriceUSD.trim() !== ''
    const hasLocalPrice = newItem.avgPriceLocal && newItem.avgPriceLocal.trim() !== ''
    
    if (!newItem.ticker || !newItem.shares || (!hasUSDPrice && !hasLocalPrice)) {
      console.log('❌ Validation failed - missing required fields')
      toast.error('Please fill in all required fields (ticker, shares, and at least one price)')
      return
    }
    
    // If we only have local price, convert it to USD
    if (!hasUSDPrice && hasLocalPrice) {
      const localAmount = parseFloat(newItem.avgPriceLocal)
      const usdAmount = convertLocalToUSD(localAmount)
      setNewItem(prev => ({
        ...prev,
        avgPriceUSD: usdAmount.toFixed(2)
      }))
      console.log('💱 Converted local price to USD:', localAmount, '→', usdAmount)
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
      // Validate numeric inputs first
      const shares = parseFloat(newItem.shares)
      const avgPriceUSD = parseFloat(newItem.avgPriceUSD)
      
      if (isNaN(shares) || isNaN(avgPriceUSD) || shares <= 0 || avgPriceUSD <= 0) {
        toast.error('Please enter valid numbers for shares and price')
        return
      }

      // Use the current price that was already fetched and converted in fetchCurrentPrice
      const fetchedCurrentPrice = currentPrice || avgPriceUSD
      
      if (!fetchedCurrentPrice) {
        toast.error('Unable to fetch current price. Please try again.')
        return
      }

      // Add to database using DatabaseFirstService (database-first approach)
      console.log('📊 Adding stock to database with params:', {
        userId: user.id,
        ticker: newItem.ticker,
        name: newItem.name,
        shares,
        avgPriceUSD,
        currentPrice: fetchedCurrentPrice,
        market: newItem.market,
        currency: newItem.currency
      })
      
      const { DatabaseFirstService } = await import('../lib/database-first-service')
      const result = await DatabaseFirstService.addPortfolioItem(
        user.id,
        newItem.ticker,
        newItem.name,
        shares,
        avgPriceUSD,
        fetchedCurrentPrice,
        newItem.market,
        newItem.currency,
        newItem.market === 'IN' ? 'NSE' : newItem.market === 'US' ? 'NASDAQ' : 'Unknown'
      )
      
      console.log('📊 Database operation result:', result)

      if (!result.success) {
        console.error('❌ Database operation failed:', result.message)
        toast.error(result.message)
        return
      }

      console.log('✅ Database operation successful, reloading portfolio...')
      
      // Reload portfolio from database to get updated data
      const updatedPortfolio = await DatabaseFirstService.getPortfolio(user.id)
      console.log('📊 Reloaded portfolio from database:', updatedPortfolio.length, 'items')
      console.log('📊 Portfolio items:', updatedPortfolio)
      
      setPortfolio(updatedPortfolio)
      calculateSummary(updatedPortfolio)
      
      // Also save to localStorage for consistency
      PortfolioService.saveToLocalStorage(updatedPortfolio)
      
      // Dispatch event to notify analytics dashboard
      window.dispatchEvent(new CustomEvent('portfolioUpdated'))
      
      // Reset form and close modal
      setNewItem({ ticker: '', name: '', shares: '', avgPriceUSD: '', avgPriceLocal: '', avgPriceCurrency: 'USD', market: 'US', currency: 'USD' })
      setShowSuggestions(false)
      setAdding(false)
      toast.success(result.message)
    } catch (error) {
      console.error('Error adding stock:', error)
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          toast.error('Stock symbol not found. Please check the ticker symbol.')
        } else if (error.message.includes('API key')) {
          toast.error('Service configuration issue. Please contact support.')
        } else if (error.message.includes('rate limit')) {
          toast.error('Too many requests. Please wait a moment and try again.')
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          toast.error('Network error. Please check your connection and try again.')
        } else {
          toast.error(`Failed to add stock: ${error.message}`)
        }
      } else {
        toast.error('Failed to add stock to portfolio. Please try again.')
      }
    } finally {
      setAddingStock(false)
    }
  }

  const handleRemoveStock = async (id: string) => {
    if (!user?.id) {
      toast.error('Please log in to manage your portfolio')
      return
    }

    try {
      const result = await PortfolioService.deletePortfolioItem(id, user.id)
      
      if (!result.success) {
        toast.error(result.message)
        return
      }

      const updatedPortfolio = portfolio.filter(item => item.id !== id)
      setPortfolio(updatedPortfolio)
      calculateSummary(updatedPortfolio)
      
      // Also update localStorage as backup
      PortfolioService.saveToLocalStorage(updatedPortfolio)
      
      toast.success(result.message)
    } catch (error) {
      console.error('Error removing stock:', error)
      toast.error('Failed to remove stock from portfolio')
    }
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
      // Persist current prices to DB for unified state
      await DatabasePortfolioService.updateCurrentPrices(user!.id, updatedPortfolio.map(i => ({ ticker: i.ticker, currentPrice: i.currentPrice })))
      await DatabasePortfolioService.syncDatabaseToLocal(user!.id)
      toast.success('Portfolio prices updated!')
    } catch (error) {
      console.error('Error refreshing prices:', error)
      toast.error('Failed to refresh prices')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency?: string, originalCurrency?: string) => {
    // Use the currency context for consistent formatting
    return contextFormatCurrency(amount, originalCurrency)
  }

  const formatPercent = (percent: number) => {
    const safePercent = Number(percent) || 0
    return `${safePercent >= 0 ? '+' : ''}${safePercent.toFixed(2)}%`
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

      {/* Rate Limit Warning */}
      {rateLimitWarning && (
        <RateLimitBanner 
          onDismiss={() => setRateLimitWarning(false)}
          onRetry={() => {
            setRateLimitWarning(false)
            // Trigger a refresh of portfolio data
            window.location.reload()
          }}
        />
      )}

      {/* Data Freshness Indicator */}
      {lastDataFetch && (
        <div className="mb-4">
          <DataFreshnessIndicator
            source={lastDataFetch.source}
            rateLimited={lastDataFetch.rateLimited}
            age={lastDataFetch.age}
            onRefresh={() => {
              setLastDataFetch(null)
              window.location.reload()
            }}
            showDetails={true}
          />
        </div>
      )}

      {/* Portfolio Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : (
                formatCurrency(summary.totalValue, 'USD')
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Calculating...' : `${formatCurrency(summary.dayChange, 'USD')} today`}
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
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : (
                formatCurrency(summary.totalGainLoss, 'USD')
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Calculating...' : formatPercent(summary.totalGainLossPercent)}
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : (
                formatCurrency(summary.totalInvested, 'USD')
              )}
            </div>
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
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : (
                formatCurrency(summary.dayChange, isIndianUser ? 'INR' : 'USD')
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Calculating...' : formatPercent(summary.dayChangePercent)}
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
                <div className="flex gap-2">
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
                    placeholder="e.g., AAPL, RELIANCE"
                    required
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowGlobalSelector(true)}
                    className="px-3"
                  >
                    🌍
                  </Button>
                </div>
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
                                {suggestion.currency === 'INR' ? `₹${suggestion.price.toLocaleString('en-IN')}` : 
                                 suggestion.currency === 'USD' ? `$${(Number(suggestion.price) || 0).toFixed(2)}` :
                                 suggestion.currency === 'EUR' ? `€${(Number(suggestion.price) || 0).toFixed(2)}` :
                                 suggestion.currency === 'GBP' ? `£${(Number(suggestion.price) || 0).toFixed(2)}` :
                                 suggestion.currency === 'JPY' ? `¥${(Number(suggestion.price) || 0).toFixed(0)}` :
                                 `$${(Number(suggestion.price) || 0).toFixed(2)}`}
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
                                {(Number(suggestion.changePercent) || 0) >= 0 ? '+' : ''}{(Number(suggestion.changePercent) || 0).toFixed(1)}%
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
                {/* Show current price */}
                {newItem.ticker && (
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                    {loadingPrice ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Fetching current price...
                      </div>
                    ) : currentPrice ? (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <button
                          onClick={() => setNewItem(prev => ({ ...prev, avgPrice: currentPrice.toString() }))}
                          className="font-medium text-green-600 hover:text-green-700 underline cursor-pointer"
                        >
                          Current Price: {formatCurrency(currentPrice, 'USD')}
                        </button>
                        <Badge variant="outline" className="text-xs">
                          Live
                        </Badge>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Unable to fetch current price
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
                <Label htmlFor="market">Market</Label>
                <select
                  id="market"
                  value={newItem.market}
                  onChange={(e) => setNewItem({ ...newItem, market: e.target.value, currency: e.target.value === 'IN' ? 'INR' : e.target.value === 'UK' ? 'GBP' : 'USD' })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:border-primary focus:ring-primary/20"
                >
                  {isIndianUser ? (
                    <>
                      <option value="IN">🇮🇳 India (INR) - Recommended</option>
                      <option value="US">🇺🇸 United States (USD)</option>
                      <option value="UK">🇬🇧 United Kingdom (GBP)</option>
                      <option value="JP">🇯🇵 Japan (JPY)</option>
                      <option value="AU">🇦🇺 Australia (AUD)</option>
                      <option value="CA">🇨🇦 Canada (CAD)</option>
                      <option value="DE">🇩🇪 Germany (EUR)</option>
                      <option value="FR">🇫🇷 France (EUR)</option>
                    </>
                  ) : (
                    <>
                      <option value="US">🇺🇸 United States (USD)</option>
                      <option value="IN">🇮🇳 India (INR)</option>
                      <option value="UK">🇬🇧 United Kingdom (GBP)</option>
                      <option value="JP">🇯🇵 Japan (JPY)</option>
                      <option value="AU">🇦🇺 Australia (AUD)</option>
                      <option value="CA">🇨🇦 Canada (CAD)</option>
                      <option value="DE">🇩🇪 Germany (EUR)</option>
                      <option value="FR">🇫🇷 France (EUR)</option>
                    </>
                  )}
                </select>
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
                <div className="grid md:grid-cols-2 gap-4 mt-2">
                  {/* USD Price Box */}
                  <div>
                    <Label htmlFor="avgPriceUSD" className="text-sm font-medium">
                      Price in USD ($)
                    </Label>
                    <Input
                      id="avgPriceUSD"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={newItem.avgPriceUSD}
                      onChange={(e) => handleUSDPriceChange(e.target.value)}
                      placeholder="e.g., 150.00"
                      required
                    />
                  </div>
                  
                  {/* Local Currency Price Box */}
                  <div>
                    <Label htmlFor="avgPriceLocal" className="text-sm font-medium">
                      Price in {selectedCurrency}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="avgPriceLocal"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={newItem.avgPriceLocal}
                        onChange={(e) => handleLocalPriceChange(e.target.value)}
                        placeholder={`e.g., ${selectedCurrency === 'INR' ? '12,500' : '150.00'}`}
                        required
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Tip */}
                <div className="mt-2 text-xs text-muted-foreground">
                  💡 Tip: Click on the stock ticker above to get the current market price, then click on "Current Price" to automatically fill both price boxes with the live market rate.
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Enter the price you bought the stock at. Both boxes will sync automatically.
                </div>
                
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
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {item.market || 'US'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {item.exchange || 'NASDAQ'}
                          </Badge>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {item.shares} shares
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Price Bought At</div>
                        <div className="font-medium">{formatCurrency(item.avgPrice, 'USD')}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Current Price</div>
                        <div className="font-medium">{formatCurrency(item.currentPrice, 'USD')}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Total Value</div>
                        <div className="font-medium">{formatCurrency(item.totalValue, 'USD')}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Gain/Loss</div>
                        <div className={`font-medium ${item.gainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatCurrency(item.gainLoss, 'USD')}
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

      {/* Global Stock Selector Modal */}
      {showGlobalSelector && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <GlobalStockSelector
              onStockSelect={handleGlobalStockSelect}
              selectedMarket={newItem.market}
              onMarketChange={(market) => setNewItem({ ...newItem, market, currency: market === 'IN' ? 'INR' : market === 'UK' ? 'GBP' : 'USD' })}
            />
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setShowGlobalSelector(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
