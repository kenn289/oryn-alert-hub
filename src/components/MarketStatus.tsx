"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Clock, TrendingUp, TrendingDown, AlertCircle } from "lucide-react"
import { useCurrency } from "../contexts/CurrencyContext"

interface MarketStatus {
  isOpen: boolean
  nextOpen?: string
  nextClose?: string
  timeRemaining?: string
  status: 'open' | 'closed' | 'pre-market' | 'after-hours'
}

export function MarketStatus() {
  const { selectedTimezone } = useCurrency()
  const [marketStatus, setMarketStatus] = useState<MarketStatus>({
    isOpen: false,
    status: 'closed'
  })
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const updateMarketStatus = () => {
      const now = new Date()
      setCurrentTime(now)
      
      // Get current time in market timezone (EST for US markets)
      const marketTimezone = "America/New_York" // US market timezone
      const estTime = new Date(now.toLocaleString("en-US", {timeZone: marketTimezone}))
      const dayOfWeek = estTime.getDay() // 0 = Sunday, 6 = Saturday
      const hours = estTime.getHours()
      const minutes = estTime.getMinutes()
      const currentMinutes = hours * 60 + minutes

      // Market hours: 9:30 AM - 4:00 PM EST, Monday-Friday
      const marketOpenMinutes = 9 * 60 + 30 // 9:30 AM
      const marketCloseMinutes = 16 * 60 // 4:00 PM
      const preMarketStart = 4 * 60 // 4:00 AM
      const afterHoursEnd = 20 * 60 // 8:00 PM

      let status: MarketStatus['status'] = 'closed'
      let isOpen = false
      let nextOpen: string | undefined
      let nextClose: string | undefined
      let timeRemaining: string | undefined

      // Check if it's a weekend
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        status = 'closed'
        isOpen = false
        // Calculate next Monday 9:30 AM
        const daysUntilMonday = dayOfWeek === 0 ? 1 : 2
        const nextMonday = new Date(estTime)
        nextMonday.setDate(estTime.getDate() + daysUntilMonday)
        nextMonday.setHours(9, 30, 0, 0)
        nextOpen = nextMonday.toLocaleString()
      } else {
        // Weekday logic
        if (currentMinutes >= marketOpenMinutes && currentMinutes < marketCloseMinutes) {
          status = 'open'
          isOpen = true
          // Calculate time until close
          const minutesUntilClose = marketCloseMinutes - currentMinutes
          const hours = Math.floor(minutesUntilClose / 60)
          const mins = minutesUntilClose % 60
          timeRemaining = `${hours}h ${mins}m`
          nextClose = new Date(estTime.getTime() + minutesUntilClose * 60000).toLocaleString()
        } else if (currentMinutes >= preMarketStart && currentMinutes < marketOpenMinutes) {
          status = 'pre-market'
          isOpen = false
          // Calculate time until open
          const minutesUntilOpen = marketOpenMinutes - currentMinutes
          const hours = Math.floor(minutesUntilOpen / 60)
          const mins = minutesUntilOpen % 60
          timeRemaining = `${hours}h ${mins}m`
          nextOpen = new Date(estTime.getTime() + minutesUntilOpen * 60000).toLocaleString()
        } else if (currentMinutes >= marketCloseMinutes && currentMinutes < afterHoursEnd) {
          status = 'after-hours'
          isOpen = false
          // Calculate time until next day open
          const nextDay = new Date(estTime)
          nextDay.setDate(estTime.getDate() + 1)
          nextDay.setHours(9, 30, 0, 0)
          nextOpen = nextDay.toLocaleString()
        } else {
          status = 'closed'
          isOpen = false
          // Calculate time until next day open
          const nextDay = new Date(estTime)
          if (currentMinutes < preMarketStart) {
            // Same day, before pre-market
            nextDay.setHours(9, 30, 0, 0)
          } else {
            // Next day
            nextDay.setDate(estTime.getDate() + 1)
            nextDay.setHours(9, 30, 0, 0)
          }
          nextOpen = nextDay.toLocaleString()
        }
      }

      setMarketStatus({
        isOpen,
        nextOpen,
        nextClose,
        timeRemaining,
        status
      })
    }

    // Update immediately
    updateMarketStatus()

    // Update every minute
    const interval = setInterval(updateMarketStatus, 60000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    switch (marketStatus.status) {
      case 'open':
        return 'text-success bg-success/10 border-success/20'
      case 'pre-market':
        return 'text-warning bg-warning/10 border-warning/20'
      case 'after-hours':
        return 'text-accent bg-accent/10 border-accent/20'
      case 'closed':
        return 'text-muted-foreground bg-muted/10 border-muted/20'
      default:
        return 'text-muted-foreground bg-muted/10 border-muted/20'
    }
  }

  const getStatusIcon = () => {
    switch (marketStatus.status) {
      case 'open':
        return <TrendingUp className="h-4 w-4" />
      case 'pre-market':
      case 'after-hours':
        return <Clock className="h-4 w-4" />
      case 'closed':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusText = () => {
    switch (marketStatus.status) {
      case 'open':
        return 'Market Open'
      case 'pre-market':
        return 'Pre-Market'
      case 'after-hours':
        return 'After Hours'
      case 'closed':
        return 'Market Closed'
      default:
        return 'Market Closed'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Market Status
        </CardTitle>
        <CardDescription>
          Real-time market hours and trading status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={`${getStatusColor()} flex items-center gap-2`}>
              {getStatusIcon()}
              {getStatusText()}
            </Badge>
            {marketStatus.timeRemaining && (
              <span className="text-sm text-muted-foreground">
                {marketStatus.status === 'open' ? 'Closes in' : 'Opens in'} {marketStatus.timeRemaining}
              </span>
            )}
          </div>
        </div>

        {/* Market Hours Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="font-medium">Regular Trading Hours</div>
            <div className="text-muted-foreground">
              Monday - Friday: 9:30 AM - 4:00 PM EST
            </div>
            <div className="text-muted-foreground">
              Pre-Market: 4:00 AM - 9:30 AM EST
            </div>
            <div className="text-muted-foreground">
              After Hours: 4:00 PM - 8:00 PM EST
            </div>
            {selectedTimezone && selectedTimezone !== 'America/New_York' && (
              <div className="text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
                <div className="text-sm font-medium">In your timezone ({selectedTimezone}):</div>
                <div className="text-sm">Regular: 7:00 PM - 1:30 AM (next day)</div>
                <div className="text-sm">Pre-Market: 1:30 PM - 7:00 PM</div>
                <div className="text-sm">After Hours: 1:30 AM - 5:30 AM (next day)</div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="font-medium">Current Time</div>
            <div className="text-muted-foreground">
              <div className="font-medium text-primary">Your Time:</div>
              {currentTime.toLocaleString("en-US", {
                timeZone: selectedTimezone,
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
              <div className="font-medium text-primary mt-2">EST (Market Time):</div>
              {currentTime.toLocaleString("en-US", {
                timeZone: "America/New_York",
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
            <div className="text-muted-foreground">
              <div className="font-medium text-primary">Your Timezone:</div>
              {currentTime.toLocaleString("en-US", {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short'
              })}
            </div>
            {marketStatus.nextOpen && (
              <div className="text-muted-foreground">
                <div className="font-medium text-primary">Next Open:</div>
                <div>EST: {new Date(marketStatus.nextOpen).toLocaleString("en-US", { timeZone: "America/New_York" })}</div>
                <div>Your Time: {new Date(marketStatus.nextOpen).toLocaleString("en-US", { timeZone: selectedTimezone })}</div>
              </div>
            )}
            {marketStatus.nextClose && (
              <div className="text-muted-foreground">
                <div className="font-medium text-primary">Closes:</div>
                <div>EST: {new Date(marketStatus.nextClose).toLocaleString("en-US", { timeZone: "America/New_York" })}</div>
                <div>Your Time: {new Date(marketStatus.nextClose).toLocaleString("en-US", { timeZone: selectedTimezone })}</div>
              </div>
            )}
          </div>
        </div>

        {/* Market Status Message */}
        {marketStatus.status === 'closed' && (
          <div className="p-3 bg-muted/50 rounded-lg border border-muted/20">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Markets are currently closed. Real-time data may be delayed or unavailable.
              </span>
            </div>
          </div>
        )}

        {marketStatus.status === 'open' && (
          <div className="p-3 bg-success/10 rounded-lg border border-success/20">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-success">
                Markets are open! Real-time data is available.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
