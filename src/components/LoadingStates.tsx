"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { 
  TrendingUp, 
  Activity, 
  BarChart3, 
  PieChart,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

interface LoadingStatesProps {
  type?: 'dashboard' | 'portfolio' | 'watchlist' | 'alerts' | 'chart' | 'generic'
  message?: string
  showProgress?: boolean
  progress?: number
}

export function LoadingStates({ 
  type = 'generic', 
  message,
  showProgress = false,
  progress = 0
}: LoadingStatesProps) {
  const getLoadingMessage = () => {
    if (message) return message
    
    switch (type) {
      case 'dashboard':
        return 'Loading dashboard data...'
      case 'portfolio':
        return 'Loading portfolio data...'
      case 'watchlist':
        return 'Loading watchlist...'
      case 'alerts':
        return 'Loading alerts...'
      case 'chart':
        return 'Loading chart data...'
      default:
        return 'Loading...'
    }
  }

  const getLoadingIcon = () => {
    switch (type) {
      case 'dashboard':
        return <BarChart3 className="w-6 h-6 animate-pulse" />
      case 'portfolio':
        return <PieChart className="w-6 h-6 animate-pulse" />
      case 'watchlist':
        return <Activity className="w-6 h-6 animate-pulse" />
      case 'alerts':
        return <AlertCircle className="w-6 h-6 animate-pulse" />
      case 'chart':
        return <TrendingUp className="w-6 h-6 animate-pulse" />
      default:
        return <RefreshCw className="w-6 h-6 animate-spin" />
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            {getLoadingIcon()}
          </div>
          <CardTitle className="text-lg">{getLoadingMessage()}</CardTitle>
          <CardDescription>
            Please wait while we fetch the latest data
          </CardDescription>
        </CardHeader>
        
        {showProgress && (
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {type === 'dashboard' && <DashboardLoadingSkeleton />}
      {type === 'portfolio' && <PortfolioLoadingSkeleton />}
      {type === 'watchlist' && <WatchlistLoadingSkeleton />}
      {type === 'alerts' && <AlertsLoadingSkeleton />}
      {type === 'chart' && <ChartLoadingSkeleton />}
    </div>
  )
}

// Dashboard loading skeleton
function DashboardLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Portfolio loading skeleton
function PortfolioLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div>
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Watchlist loading skeleton
function WatchlistLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-6 w-20 mb-1" />
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Alerts loading skeleton
function AlertsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-20" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 border rounded-lg">
                <Skeleton className="h-4 w-4 rounded-full mt-1" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Chart loading skeleton
function ChartLoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Inline loading component
export function InlineLoading({ 
  message = 'Loading...', 
  size = 'sm' 
}: { 
  message?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <RefreshCw className={`${sizeClasses[size]} animate-spin`} />
      <span className="text-sm">{message}</span>
    </div>
  )
}

// Button loading state
export function LoadingButton({ 
  loading, 
  children, 
  loadingText = 'Loading...',
  ...props 
}: {
  loading: boolean
  children: React.ReactNode
  loadingText?: string
  [key: string]: unknown
}) {
  return (
    <button 
      {...props}
      disabled={loading}
      className={`flex items-center gap-2 ${props.className || ''}`}
    >
      {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
      {loading ? loadingText : children}
    </button>
  )
}

// Skeleton components for specific use cases
export function StockCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-6 w-20 mb-1" />
        <Skeleton className="h-3 w-14" />
      </CardContent>
    </Card>
  )
}

export function AlertCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Skeleton className="h-4 w-4 rounded-full mt-1" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </CardContent>
    </Card>
  )
}
