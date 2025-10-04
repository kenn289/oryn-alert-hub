"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, TrendingUp, DollarSign, Activity, Star, X } from "lucide-react"
import { toast } from "sonner"
import { getStockSuggestions, WatchlistService } from "@/lib/watchlist"
import { useCurrency } from "@/contexts/CurrencyContext"

interface WatchlistModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (ticker: string) => void
}

const popularStocksData = [
  { ticker: "AAPL", name: "Apple Inc.", sector: "Technology", price: 175.43, change: "+2.4%" },
  { ticker: "MSFT", name: "Microsoft Corp.", sector: "Technology", price: 378.85, change: "-1.2%" },
  { ticker: "GOOGL", name: "Alphabet Inc.", sector: "Technology", price: 142.56, change: "+0.8%" },
  { ticker: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Discretionary", price: 155.23, change: "+1.5%" },
  { ticker: "TSLA", name: "Tesla Inc.", sector: "Automotive", price: 248.50, change: "+3.2%" },
  { ticker: "NVDA", name: "NVIDIA Corp.", sector: "Technology", price: 875.30, change: "+5.1%" },
  { ticker: "META", name: "Meta Platforms Inc.", sector: "Technology", price: 485.20, change: "+2.8%" },
  { ticker: "NFLX", name: "Netflix Inc.", sector: "Communication Services", price: 425.60, change: "-0.5%" },
]

const sectors = [
  "Technology", "Healthcare", "Financial Services", "Consumer Discretionary", 
  "Communication Services", "Industrials", "Energy", "Materials"
]

export function WatchlistModal({ isOpen, onClose, onAdd }: WatchlistModalProps) {
  const { formatCurrency } = useCurrency()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSector, setSelectedSector] = useState("")
  const [suggestions, setSuggestions] = useState<Array<{ticker: string, name: string, sector: string}>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [lastAddTime, setLastAddTime] = useState(0)

  // Get suggestions when search term changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length >= 1) {
        setIsLoading(true)
        const results = await getStockSuggestions(searchTerm)
        setSuggestions(results)
        setShowSuggestions(true)
        setIsLoading(false)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }

    const timeoutId = setTimeout(fetchSuggestions, 300) // Debounce
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const filteredStocks = popularStocksData.filter(stock => 
    stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(stock => 
    selectedSector === "" || stock.sector === selectedSector
  )

  const handleAddStock = async (ticker: string, name?: string) => {
    // Prevent rapid-fire additions (rate limiting)
    const now = Date.now()
    if (now - lastAddTime < 1000) { // 1 second cooldown
      toast.error("Please wait before adding another stock")
      return
    }
    
    if (isAdding) {
      toast.error("Please wait, adding stock...")
      return
    }
    
    setIsAdding(true)
    setLastAddTime(now)
    
    try {
      const result = WatchlistService.addToWatchlist(ticker, name || "")
      if (result.success) {
        onAdd(ticker)
        toast.success(result.message)
        // Don't close modal automatically, let user add multiple stocks
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Failed to add stock. Please try again.")
    } finally {
      setIsAdding(false)
    }
  }

  const handleAddCustom = () => {
    if (searchTerm.trim()) {
      handleAddStock(searchTerm.trim().toUpperCase())
      setSearchTerm("")
    }
  }

  const handleSuggestionClick = (suggestion: {ticker: string, name: string, sector: string}) => {
    handleAddStock(suggestion.ticker, suggestion.name)
    setShowSuggestions(false)
    setSearchTerm("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text">Add to Watchlist</DialogTitle>
          <DialogDescription>
            Choose from popular stocks or add your own ticker symbol
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search stocks</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by ticker or company name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="sector">Filter by sector</Label>
              <select
                id="sector"
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md text-sm"
              >
                <option value="">All sectors</option>
                {sectors.map(sector => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Ticker Input with Autocomplete */}
          <Card className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Label htmlFor="custom-ticker">Add custom ticker</Label>
                <div className="relative">
                  <Input
                    id="custom-ticker"
                    placeholder="Type to search stocks (e.g., AAPL, TSLA)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  {isLoading && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  )}
                  
                  {/* Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 hover:bg-muted cursor-pointer border-b border-border/50 last:border-b-0"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <div className="flex items-center gap-3">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <div>
                              <div className="font-medium">{suggestion.ticker}</div>
                              <div className="text-sm text-muted-foreground">{suggestion.name}</div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {suggestion.sector}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Button onClick={handleAddCustom} disabled={!searchTerm.trim() || isAdding}>
                {isAdding ? "Adding..." : "Add"}
              </Button>
            </div>
          </Card>

          {/* Popular Stocks Grid */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-warning" />
              Popular Stocks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredStocks.map((stock) => (
                <Card 
                  key={stock.ticker} 
                  className={`hover-lift cursor-pointer border-border/50 hover:border-primary/50 transition-all ${isAdding ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !isAdding && handleAddStock(stock.ticker)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="font-bold text-lg">{stock.ticker}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {stock.sector}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{stock.name}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-success" />
                        <span className="text-sm font-medium">{formatCurrency(stock.price, 'USD')}</span>
                      </div>
                      <span className={`text-sm font-medium ${
                        stock.change.startsWith('+') ? 'text-success' : 'text-destructive'
                      }`}>
                        {stock.change}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Add Buttons */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              Quick Add
            </h3>
            <div className="flex flex-wrap gap-2">
              {["AAPL", "MSFT", "GOOGL", "TSLA", "NVDA", "META"].map(ticker => (
                <Button
                  key={ticker}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddStock(ticker)}
                  disabled={isAdding}
                  className="hover:bg-primary/10 hover:border-primary/50"
                >
                  {ticker}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
