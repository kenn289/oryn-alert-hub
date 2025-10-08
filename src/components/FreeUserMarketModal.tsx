"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Clock, Lock, TrendingUp, Star } from "lucide-react"
import { useCurrency } from "../contexts/CurrencyContext"

interface FreeUserMarketModalProps {
  market: string
  isOpen: boolean
  onClose: () => void
  onUpgrade: () => void
}

export function FreeUserMarketModal({ market, isOpen, onClose, onUpgrade }: FreeUserMarketModalProps) {
  const { formatCurrency } = useCurrency()

  if (!isOpen) return null

  const getMarketInfo = (market: string) => {
    const marketInfo: { [key: string]: any } = {
      'NASDAQ': {
        name: 'NASDAQ',
        timezone: 'EST',
        openTime: '9:30 AM',
        closeTime: '4:00 PM',
        status: 'Open',
        description: 'Technology and growth stocks exchange'
      },
      'NYSE': {
        name: 'New York Stock Exchange',
        timezone: 'EST',
        openTime: '9:30 AM',
        closeTime: '4:00 PM',
        status: 'Open',
        description: 'Traditional blue-chip stocks exchange'
      },
      'NSE': {
        name: 'National Stock Exchange of India',
        timezone: 'IST',
        openTime: '9:15 AM',
        closeTime: '3:30 PM',
        status: 'Closed',
        description: 'India\'s leading stock exchange'
      },
      'LSE': {
        name: 'London Stock Exchange',
        timezone: 'GMT',
        openTime: '8:00 AM',
        closeTime: '4:30 PM',
        status: 'Closed',
        description: 'UK\'s primary stock exchange'
      },
      'TSE': {
        name: 'Tokyo Stock Exchange',
        timezone: 'JST',
        openTime: '9:00 AM',
        closeTime: '3:00 PM',
        status: 'Closed',
        description: 'Japan\'s largest stock exchange'
      }
    }

    return marketInfo[market] || {
      name: market,
      timezone: 'Local',
      openTime: '9:30 AM',
      closeTime: '4:00 PM',
      status: 'Unknown',
      description: 'Stock exchange information'
    }
  }

  const marketInfo = getMarketInfo(market)
  const isOpenStatus = marketInfo.status === 'Open'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">{marketInfo.name}</CardTitle>
          <CardDescription>{marketInfo.description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Market Status */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">Market Status</span>
              <Badge className={isOpenStatus ? "bg-green-500/20 text-green-600 border-green-500/30" : "bg-red-500/20 text-red-600 border-red-500/30"}>
                {marketInfo.status}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Open: {marketInfo.openTime} {marketInfo.timezone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Close: {marketInfo.closeTime} {marketInfo.timezone}</span>
              </div>
            </div>
          </div>

          {/* Upgrade Prompt */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-3">
              <Lock className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-900 dark:text-blue-100">AI Market Insights Locked</span>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
              Unlock AI-powered investment recommendations, buy/sell timing, and confidence scores for this market.
            </p>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>Day Trading Recommendations</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>Long-Term Investment Picks</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>AI Confidence Scores</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>Real-Time Market Analysis</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={onUpgrade}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Star className="h-4 w-4 mr-2" />
              Upgrade to Pro
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
