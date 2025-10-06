"use client"

import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { 
  Clock, 
  AlertTriangle, 
  RefreshCw,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useState } from 'react'
import { useCurrency } from "../contexts/CurrencyContext"

interface DataFreshnessIndicatorProps {
  source: 'fresh' | 'cached' | 'fallback'
  age?: string
  rateLimited?: boolean
  lastUpdated?: string
  onRefresh?: () => void
  className?: string
  showDetails?: boolean
}

export function DataFreshnessIndicator({
  source,
  age,
  rateLimited = false,
  lastUpdated,
  onRefresh,
  className = '',
  showDetails = false
}: DataFreshnessIndicatorProps) {
  const { selectedTimezone } = useCurrency()
  const [showFullDetails, setShowFullDetails] = useState(false)

  const getIndicatorConfig = () => {
    if (rateLimited) {
      return {
        icon: <XCircle className="w-4 h-4" />,
        color: 'destructive',
        text: 'Rate Limited',
        description: 'Using cached data due to API limits',
        bgColor: 'bg-red-50 dark:bg-red-900/10',
        borderColor: 'border-red-200 dark:border-red-800'
      }
    }

    switch (source) {
      case 'fresh':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'default',
          text: 'Live',
          description: 'Real-time data',
          bgColor: 'bg-green-50 dark:bg-green-900/10',
          borderColor: 'border-green-200 dark:border-green-800'
        }
      case 'cached':
        return {
          icon: <Clock className="w-4 h-4" />,
          color: 'secondary',
          text: age || 'Cached',
          description: 'Recently cached data',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/10',
          borderColor: 'border-yellow-200 dark:border-yellow-800'
        }
      case 'fallback':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          color: 'destructive',
          text: 'Fallback',
          description: 'Using backup data',
          bgColor: 'bg-orange-50 dark:bg-orange-900/10',
          borderColor: 'border-orange-200 dark:border-orange-800'
        }
      default:
        return {
          icon: <Info className="w-4 h-4" />,
          color: 'secondary',
          text: 'Unknown',
          description: 'Data source unknown',
          bgColor: 'bg-gray-50 dark:bg-gray-900/10',
          borderColor: 'border-gray-200 dark:border-gray-800'
        }
    }
  }

  const config = getIndicatorConfig()

  if (rateLimited) {
    return (
      <Alert className={`${config.bgColor} ${config.borderColor} ${className}`}>
        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <span className="font-medium text-red-800 dark:text-red-200">
              API Rate Limit Exceeded
            </span>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              Showing last available data from {age || 'previous session'}
            </p>
            {showDetails && lastUpdated && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                Last updated: {new Date(lastUpdated).toLocaleString('en-US', { timeZone: selectedTimezone })}
              </p>
            )}
          </div>
          {onRefresh && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onRefresh}
              className="ml-2 text-red-600 border-red-300 hover:bg-red-100"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge 
        variant={config.color as "default" | "secondary" | "destructive" | "outline"}
        className={`flex items-center gap-1 ${config.bgColor} ${config.borderColor}`}
      >
        {config.icon}
        <span className="text-xs">{config.text}</span>
      </Badge>
      
      {showDetails && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowFullDetails(!showFullDetails)}
          className="h-6 px-2 text-xs"
        >
          <Info className="w-3 h-3" />
        </Button>
      )}
      
      {showFullDetails && (
        <div className="text-xs text-muted-foreground">
          <p>{config.description}</p>
          {age && <p>Age: {age}</p>}
          {lastUpdated && <p>Updated: {new Date(lastUpdated).toLocaleString('en-US', { timeZone: selectedTimezone })}</p>}
        </div>
      )}
      
      {onRefresh && source !== 'fresh' && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onRefresh}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className="w-3 h-3" />
        </Button>
      )}
    </div>
  )
}

// Compact version for inline use
export function InlineDataIndicator({ 
  source, 
  rateLimited, 
  age,
  className = '' 
}: {
  source: 'fresh' | 'cached' | 'fallback'
  rateLimited?: boolean
  age?: string
  className?: string
}) {
  const getIndicator = () => {
    if (rateLimited) {
      return <span className="text-red-500 text-xs">⚠️ Rate Limited</span>
    }
    
    switch (source) {
      case 'fresh':
        return <span className="text-green-500 text-xs">🟢 Live</span>
      case 'cached':
        return <span className="text-yellow-500 text-xs">🟡 {age || 'Cached'}</span>
      case 'fallback':
        return <span className="text-orange-500 text-xs">🟠 Fallback</span>
      default:
        return <span className="text-gray-500 text-xs">⚪ Unknown</span>
    }
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      {getIndicator()}
    </div>
  )
}

// Rate limit warning banner
export function RateLimitBanner({ 
  onDismiss,
  onRetry,
  className = ''
}: {
  onDismiss?: () => void
  onRetry?: () => void
  className?: string
}) {
  return (
    <Alert className={`bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <span className="font-medium text-yellow-800 dark:text-yellow-200">
            API Rate Limit Reached
          </span>
          <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
            We&apos;re showing cached data to avoid exceeding API limits. Fresh data will resume automatically.
          </p>
        </div>
        <div className="flex gap-2">
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
