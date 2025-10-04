"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Wifi, 
  WifiOff,
  RefreshCw,
  XCircle
} from "lucide-react"

interface ApiStatus {
  status: 'connected' | 'rate_limited' | 'error' | 'offline'
  lastUpdate: string
  rateLimitReset?: string
  errorMessage?: string
  dataAge?: string
}

interface ApiStatusIndicatorProps {
  status: ApiStatus
  onRefresh?: () => void
  refreshing?: boolean
}

export function ApiStatusIndicator({ status, onRefresh, refreshing = false }: ApiStatusIndicatorProps) {
  const getStatusIcon = () => {
    switch (status.status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rate_limited':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'offline':
        return <WifiOff className="h-4 w-4 text-gray-500" />
      default:
        return <Wifi className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (status.status) {
      case 'connected':
        return 'bg-green-500/20 text-green-600 border-green-200'
      case 'rate_limited':
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-200'
      case 'error':
        return 'bg-red-500/20 text-red-600 border-red-200'
      case 'offline':
        return 'bg-gray-500/20 text-gray-600 border-gray-200'
      default:
        return 'bg-gray-500/20 text-gray-600 border-gray-200'
    }
  }

  const getStatusMessage = () => {
    switch (status.status) {
      case 'connected':
        return 'API Connected'
      case 'rate_limited':
        return 'API Rate Limited'
      case 'error':
        return 'API Error'
      case 'offline':
        return 'API Offline'
      default:
        return 'Unknown Status'
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{getStatusMessage()}</span>
                <Badge className={getStatusColor()}>
                  {status.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {status.dataAge && (
                  <span>Data: {status.dataAge}</span>
                )}
                {status.rateLimitReset && (
                  <span className="ml-2">Resets: {status.rateLimitReset}</span>
                )}
                {status.errorMessage && (
                  <span className="ml-2 text-red-600">{status.errorMessage}</span>
                )}
              </div>
            </div>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Hook to get API status from stock data service
export function useApiStatus() {
  const [status, setStatus] = useState<ApiStatus>({
    status: 'offline',
    lastUpdate: 'Never',
    dataAge: 'No data'
  })

  useEffect(() => {
    // This would be connected to your actual API status
    // For now, we'll simulate checking the API status
    const checkApiStatus = async () => {
      try {
        // Check if we have cached data
        const hasCachedData = localStorage.getItem('api_status')
        if (hasCachedData) {
          const cachedStatus = JSON.parse(hasCachedData)
          setStatus(cachedStatus)
        } else {
          setStatus({
            status: 'offline',
            lastUpdate: 'Never',
            dataAge: 'No data'
          })
        }
      } catch (error) {
        setStatus({
          status: 'error',
          lastUpdate: 'Never',
          dataAge: 'No data',
          errorMessage: 'Failed to check API status'
        })
      }
    }

    checkApiStatus()
  }, [])

  return status
}



