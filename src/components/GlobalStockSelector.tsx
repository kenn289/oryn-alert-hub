"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Globe, 
  TrendingUp, 
  TrendingDown,
  MapPin,
  Clock,
  DollarSign,
  Loader2,
  Star,
  Building2
} from "lucide-react"
import { toast } from "sonner"

interface Market {
  code: string
  name: string
  currency: string
  exchanges: string[]
}

interface StockResult {
  symbol: string
  name: string
  sector?: string
  market: string
  currency: string
}

interface GlobalStockSelectorProps {
  onStockSelect?: (stock: StockResult) => void
  selectedMarket?: string
  onMarketChange?: (market: string) => void
}

export function GlobalStockSelector({ 
  onStockSelect, 
  selectedMarket = 'US', 
  onMarketChange 
}: GlobalStockSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<StockResult[]>([])
  const [markets, setMarkets] = useState<Market[]>([])
  const [popularStocks, setPopularStocks] = useState<{ [key: string]: StockResult[] }>({})
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('search')

  useEffect(() => {
    loadMarkets()
    loadPopularStocks()
  }, [])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchStocks()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const loadMarkets = async () => {
    try {
      const response = await fetch('/api/stock/markets')
      if (response.ok) {
        const data = await response.json()
        setMarkets(data.markets)
      }
    } catch (error) {
      console.error('Error loading markets:', error)
    }
  }

  const loadPopularStocks = async () => {
    try {
      const stocks: { [key: string]: StockResult[] } = {}
      
      // Load popular stocks for each market
      for (const market of ['US', 'IN', 'UK', 'JP']) {
        const response = await fetch(`/api/stock/popular?market=${market}`)
        if (response.ok) {
          const data = await response.json()
          // Attach market and currency to ensure accurate selection downstream
          const currencyMap: Record<string, string> = { US: 'USD', IN: 'INR', UK: 'GBP', JP: 'JPY' }
          stocks[market] = (data.stocks || []).map((s: any) => ({
            ...s,
            market,
            currency: currencyMap[market] || 'USD'
          }))
        }
      }
      
      setPopularStocks(stocks)
    } catch (error) {
      console.error('Error loading popular stocks:', error)
    }
  }

  const searchStocks = async () => {
    if (searchQuery.length < 2) return

    setLoading(true)
    try {
      const response = await fetch(`/api/stock/global-search?q=${encodeURIComponent(searchQuery)}&limit=20&market=${encodeURIComponent(selectedMarket)}`)
      if (response.ok) {
        const data = await response.json()
        // Attach market to results to drive correct data routing later
        const withMarket = data.results.map((r: any) => ({ ...r, market: r.market || selectedMarket }))
        setSearchResults(withMarket)
      } else {
        toast.error('Search failed')
      }
    } catch (error) {
      console.error('Error searching stocks:', error)
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleStockSelect = (stock: StockResult) => {
    if (onStockSelect) {
      onStockSelect(stock)
    }
    toast.success(`Selected ${stock.symbol} from ${stock.market}`)
  }

  const handleMarketChange = (market: string) => {
    if (onMarketChange) {
      onMarketChange(market)
    }
    setActiveTab('popular')
  }

  const getMarketIcon = (market: string) => {
    const icons: { [key: string]: string } = {
      'US': '🇺🇸',
      'IN': '🇮🇳',
      'UK': '🇬🇧',
      'JP': '🇯🇵',
      'AU': '🇦🇺',
      'CA': '🇨🇦',
      'DE': '🇩🇪',
      'FR': '🇫🇷'
    }
    return icons[market] || '🌍'
  }

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'INR': '₹',
      'GBP': '£',
      'JPY': '¥',
      'AUD': 'A$',
      'CAD': 'C$',
      'EUR': '€'
    }
    return symbols[currency] || currency
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Global Stock Selector
        </CardTitle>
        <CardDescription>
          Search and select stocks from global markets including US, India (NSE/BSE), UK, Japan, and more
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="markets">Markets</TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stocks globally (e.g., AAPL, RELIANCE, VOD)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {loading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Search Results</h3>
                <div className="grid gap-2 max-h-60 overflow-y-auto">
                  {searchResults.map((stock, index) => (
                    <div
                      key={`${stock.symbol}-${stock.market}-${index}`}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => handleStockSelect(stock)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-lg">{getMarketIcon(stock.market)}</div>
                        <div>
                          <div className="font-medium">{stock.symbol}</div>
                          <div className="text-sm text-muted-foreground">{stock.name}</div>
                          {stock.sector && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {stock.sector}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{stock.market}</div>
                        <div className="text-xs text-muted-foreground">
                          {getCurrencySymbol(stock.currency)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchQuery.length >= 2 && searchResults.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No stocks found for "{searchQuery}"</p>
                <p className="text-sm">Try searching for popular stocks like AAPL, RELIANCE, or VOD</p>
              </div>
            )}
          </TabsContent>

          {/* Popular Tab */}
          <TabsContent value="popular" className="space-y-4">
            <div className="grid gap-4">
              {Object.entries(popularStocks).map(([market, stocks]) => (
                <div key={market} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getMarketIcon(market)}</span>
                    <h3 className="font-semibold">
                      {markets.find(m => m.code === market)?.name || market} Stocks
                    </h3>
                    <Badge variant="outline">
                      {getCurrencySymbol(markets.find(m => m.code === market)?.currency || 'USD')}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {stocks.slice(0, 6).map((stock, index) => (
                      <div
                        key={`${stock.symbol}-${index}`}
                        className="flex items-center justify-between p-2 border rounded hover:bg-muted cursor-pointer"
                        onClick={() => handleStockSelect(stock)}
                      >
                        <div>
                          <div className="font-medium text-sm">{stock.symbol}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-32">
                            {stock.name}
                          </div>
                        </div>
                        {stock.sector && (
                          <Badge variant="outline" className="text-xs">
                            {stock.sector}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Markets Tab */}
          <TabsContent value="markets" className="space-y-4">
            <div className="grid gap-4">
              {markets.map((market) => (
                <div
                  key={market.code}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedMarket === market.code ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                  }`}
                  onClick={() => handleMarketChange(market.code)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getMarketIcon(market.code)}</span>
                      <div>
                        <div className="font-semibold">{market.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {market.exchanges.join(', ')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{getCurrencySymbol(market.currency)}</div>
                      <div className="text-sm text-muted-foreground">{market.currency}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
