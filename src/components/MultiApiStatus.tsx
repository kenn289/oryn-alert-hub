"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
  Database
} from "lucide-react"

interface ApiStatus {
  name: string
  enabled: boolean
  rateLimited: boolean
  priority: number
}

interface ApiStatusResponse {
  apis: ApiStatus[]
  totalApis: number
  enabledApis: number
  rateLimitedApis: number
  availableApis: number
  timestamp: string
}

export function MultiApiStatus() {
  const [status, setStatus] = useState<ApiStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadApiStatus = async () => {
    try {
      const response = await fetch('/api/stock/status')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Error loading API status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadApiStatus()
    setRefreshing(false)
  }

  useEffect(() => {
    loadApiStatus()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadApiStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getApiIcon = (api: ApiStatus) => {
    if (!api.enabled) return <XCircle className="h-4 w-4 text-gray-400" />
    if (api.rateLimited) return <Clock className="h-4 w-4 text-yellow-500" />
    return <CheckCircle className="h-4 w-4 text-green-500" />
  }

  const getApiColor = (api: ApiStatus) => {
    if (!api.enabled) return 'bg-gray-100 text-gray-600'
    if (api.rateLimited) return 'bg-yellow-100 text-yellow-700'
    return 'bg-green-100 text-green-700'
  }

  const getApiName = (name: string) => {
    const names: Record<string, string> = {
      'alpha_vantage': 'Alpha Vantage',
      'iex_cloud': 'IEX Cloud',
      'polygon': 'Polygon.io',
      'yahoo': 'Yahoo Finance'
    }
    return names[name] || name
  }

  const getApiDescription = (name: string) => {
    const descriptions: Record<string, string> = {
      'yahoo': '1000+ req/min • Primary source (FREE)',
      'iex_cloud': '100 req/min • Secondary source',
      'polygon': '5 req/min • Tertiary source'
    }
    return descriptions[name] || ''
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Multi-API Status
          </CardTitle>
          <CardDescription>Loading API status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-4 w-4 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Multi-API Status
            </CardTitle>
            <CardDescription>
              {status?.availableApis || 0} of {status?.enabledApis || 0} APIs available
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {status?.availableApis || 0}
              </div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {status?.rateLimitedApis || 0}
              </div>
              <div className="text-sm text-muted-foreground">Rate Limited</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {status?.enabledApis || 0}
              </div>
              <div className="text-sm text-muted-foreground">Enabled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {status?.totalApis || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>

          {/* API List */}
          <div className="space-y-2">
            {status?.apis.map((api) => (
              <div
                key={api.name}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getApiIcon(api)}
                  <div>
                    <div className="font-medium">{getApiName(api.name)}</div>
                    <div className="text-sm text-muted-foreground">
                      {getApiDescription(api.name)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getApiColor(api)}>
                    {!api.enabled ? 'Disabled' : 
                     api.rateLimited ? 'Rate Limited' : 'Active'}
                  </Badge>
                  <Badge variant="outline">
                    Priority {api.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Last Updated */}
          {status?.timestamp && (
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              Last updated: {new Date(status.timestamp).toLocaleString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
