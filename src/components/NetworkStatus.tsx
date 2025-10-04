"use client"

import { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface NetworkStatusProps {
  showWhenOnline?: boolean
  showWhenOffline?: boolean
  position?: 'top' | 'bottom'
  className?: string
}

export function NetworkStatus({ 
  showWhenOnline = false,
  showWhenOffline = true,
  position = 'top',
  className = ''
}: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'unknown'>('unknown')

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)
    
    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline) {
        toast.success('Connection restored', {
          description: 'You\'re back online',
          duration: 3000
        })
        setWasOffline(false)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
      toast.error('Connection lost', {
        description: 'Please check your internet connection',
        duration: 5000
      })
    }

    // Test connection quality
    const testConnectionQuality = async () => {
      if (!navigator.onLine) return

      try {
        const start = Date.now()
        const response = await fetch('/api/health', { 
          method: 'HEAD',
          cache: 'no-cache'
        })
        const duration = Date.now() - start

        if (response.ok) {
          setConnectionQuality(duration < 1000 ? 'good' : 'poor')
        } else {
          setConnectionQuality('poor')
        }
      } catch (error) {
        setConnectionQuality('poor')
      }
    }

    // Test connection quality periodically
    const qualityInterval = setInterval(testConnectionQuality, 30000) // Every 30 seconds
    testConnectionQuality() // Test immediately

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(qualityInterval)
    }
  }, [wasOffline])

  const handleRetry = async () => {
    try {
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      })
      
      if (response.ok) {
        setIsOnline(true)
        setWasOffline(false)
        toast.success('Connection restored')
      } else {
        throw new Error('Server not responding')
      }
    } catch (error) {
      toast.error('Still offline', {
        description: 'Please check your internet connection'
      })
    }
  }

  // Don't show anything if online and showWhenOnline is false
  if (isOnline && !showWhenOnline) {
    return null
  }

  // Don't show anything if offline and showWhenOffline is false
  if (!isOnline && !showWhenOffline) {
    return null
  }

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4" />
    if (connectionQuality === 'poor') return <AlertTriangle className="w-4 h-4" />
    return <Wifi className="w-4 h-4" />
  }

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-600 dark:text-red-400'
    if (connectionQuality === 'poor') return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  const getStatusMessage = () => {
    if (!isOnline) return 'You\'re offline'
    if (connectionQuality === 'poor') return 'Poor connection'
    return 'Connected'
  }

  const getStatusDescription = () => {
    if (!isOnline) return 'Please check your internet connection'
    if (connectionQuality === 'poor') return 'Connection is slow or unstable'
    return 'All systems operational'
  }

  const positionClasses = position === 'top' ? 'top-4' : 'bottom-4'

  return (
    <div className={`fixed left-4 right-4 z-50 ${positionClasses} ${className}`}>
      <Alert className={`border-l-4 ${
        !isOnline 
          ? 'border-red-500 bg-red-50 dark:bg-red-900/10' 
          : connectionQuality === 'poor'
          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
          : 'border-green-500 bg-green-50 dark:bg-green-900/10'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={getStatusColor()}>
              {getStatusIcon()}
            </div>
            <div>
              <AlertDescription className="font-medium">
                {getStatusMessage()}
              </AlertDescription>
              <AlertDescription className="text-sm">
                {getStatusDescription()}
              </AlertDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isOnline && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleRetry}
                className="flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </Button>
            )}
            
            <Badge 
              variant={!isOnline ? 'destructive' : connectionQuality === 'poor' ? 'secondary' : 'default'}
              className="text-xs"
            >
              {!isOnline ? 'Offline' : connectionQuality === 'poor' ? 'Poor' : 'Good'}
            </Badge>
          </div>
        </div>
      </Alert>
    </div>
  )
}

// Hook for checking network status
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'unknown'>('unknown')

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // Test connection quality
    const testConnection = async () => {
      if (!navigator.onLine) return

      try {
        const start = Date.now()
        const response = await fetch('/api/health', { 
          method: 'HEAD',
          cache: 'no-cache'
        })
        const duration = Date.now() - start

        if (response.ok) {
          setConnectionQuality(duration < 1000 ? 'good' : 'poor')
        } else {
          setConnectionQuality('poor')
        }
      } catch (error) {
        setConnectionQuality('poor')
      }
    }

    // Test immediately and then every 30 seconds
    testConnection()
    const interval = setInterval(testConnection, 30000)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  return { isOnline, connectionQuality }
}

// Simple online indicator component
export function OnlineIndicator({ className = '' }: { className?: string }) {
  const { isOnline, connectionQuality } = useNetworkStatus()

  if (isOnline) {
    return (
      <div className={`flex items-center gap-1 text-green-600 dark:text-green-400 ${className}`}>
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm">Online</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-1 text-red-600 dark:text-red-400 ${className}`}>
      <XCircle className="w-4 h-4" />
      <span className="text-sm">Offline</span>
    </div>
  )
}
