"use client"

import { useState, useEffect } from 'react'
import { Badge } from '../components/ui/badge'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { realtimeSupportService } from '../lib/realtime-support-service'

export function RealtimeStatus() {
  const [isConnected, setIsConnected] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    setIsConnected(realtimeSupportService.getConnectionStatus())
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    realtimeSupportService.refresh()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <div className="flex items-center gap-2">
      {isConnected ? (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <Wifi className="h-3 w-3 mr-1" />
          Live Updates
        </Badge>
      ) : (
        <Badge variant="outline" className="text-red-600">
          <WifiOff className="h-3 w-3 mr-1" />
          Offline
        </Badge>
      )}
      
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        title="Refresh data"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  )
}


