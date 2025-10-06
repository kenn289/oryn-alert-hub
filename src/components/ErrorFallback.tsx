"use client"

import { Alert, AlertDescription } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { 
  AlertTriangle, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Server, 
  Shield, 
  Clock,
  HelpCircle
} from 'lucide-react'

interface ErrorFallbackProps {
  error?: Error
  context?: string
  onRetry?: () => void
  onGoHome?: () => void
  showDetails?: boolean
  className?: string
}

export function ErrorFallback({
  error,
  context,
  onRetry,
  onGoHome,
  showDetails = false,
  className = ''
}: ErrorFallbackProps) {
  const getErrorIcon = () => {
    if (!error) return <AlertTriangle className="w-6 h-6" />
    
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch')) {
      return <WifiOff className="w-6 h-6" />
    }
    
    if (message.includes('server') || message.includes('500')) {
      return <Server className="w-6 h-6" />
    }
    
    if (message.includes('auth') || message.includes('401') || message.includes('403')) {
      return <Shield className="w-6 h-6" />
    }
    
    if (message.includes('rate limit') || message.includes('429')) {
      return <Clock className="w-6 h-6" />
    }
    
    return <AlertTriangle className="w-6 h-6" />
  }

  const getErrorType = () => {
    if (!error) return 'Unknown Error'
    
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network Error'
    }
    
    if (message.includes('server') || message.includes('500')) {
      return 'Server Error'
    }
    
    if (message.includes('auth') || message.includes('401')) {
      return 'Authentication Error'
    }
    
    if (message.includes('forbidden') || message.includes('403')) {
      return 'Access Denied'
    }
    
    if (message.includes('rate limit') || message.includes('429')) {
      return 'Rate Limit Exceeded'
    }
    
    if (message.includes('not found') || message.includes('404')) {
      return 'Not Found'
    }
    
    return 'Application Error'
  }

  const getErrorSeverity = () => {
    if (!error) return 'error'
    
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'warning'
    }
    
    if (message.includes('auth') || message.includes('401')) {
      return 'error'
    }
    
    if (message.includes('rate limit') || message.includes('429')) {
      return 'warning'
    }
    
    return 'error'
  }

  const getErrorMessage = () => {
    if (!error) return 'An unexpected error occurred'
    
    // Return user-friendly messages for common errors
    if (error.message.includes('Failed to fetch')) {
      return 'Unable to connect to the server. Please check your internet connection.'
    }
    
    if (error.message.includes('401')) {
      return 'Please sign in to continue. Your session may have expired.'
    }
    
    if (error.message.includes('403')) {
      return 'You don\'t have permission to perform this action.'
    }
    
    if (error.message.includes('404')) {
      return 'The requested information could not be found.'
    }
    
    if (error.message.includes('429')) {
      return 'Too many requests. Please wait a moment and try again.'
    }
    
    if (error.message.includes('500')) {
      return 'Our servers are experiencing issues. Please try again later.'
    }
    
    return error.message
  }

  const getSuggestions = () => {
    if (!error) return []
    
    const message = error.message.toLowerCase()
    const suggestions: string[] = []
    
    if (message.includes('network') || message.includes('fetch')) {
      suggestions.push('Check your internet connection')
      suggestions.push('Try refreshing the page')
      suggestions.push('Disable VPN if you\'re using one')
    }
    
    if (message.includes('auth') || message.includes('401')) {
      suggestions.push('Sign out and sign in again')
      suggestions.push('Clear your browser cache')
    }
    
    if (message.includes('rate limit') || message.includes('429')) {
      suggestions.push('Wait a few minutes before trying again')
      suggestions.push('Reduce the frequency of your requests')
    }
    
    if (message.includes('server') || message.includes('500')) {
      suggestions.push('Try again in a few minutes')
      suggestions.push('Contact support if the problem persists')
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Try refreshing the page')
      suggestions.push('Contact support if the problem persists')
    }
    
    return suggestions
  }

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            {getErrorIcon()}
          </div>
          <CardTitle className="text-xl font-semibold">
            {getErrorType()}
          </CardTitle>
          <CardDescription>
            {context ? `Error occurred while ${context}` : 'Something went wrong'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert className={`border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10`}>
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {getErrorMessage()}
            </AlertDescription>
          </Alert>

          {showDetails && error && (
            <div className="space-y-2">
              <Badge variant="outline" className="text-xs">
                Error ID: {Date.now().toString(36)}
              </Badge>
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer hover:text-foreground">
                  Technical Details
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {error.stack || error.message}
                </pre>
              </details>
            </div>
          )}

          {getSuggestions().length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Suggestions:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {getSuggestions().map((suggestion, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <HelpCircle className="w-3 h-3" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            {onRetry && (
              <Button 
                onClick={onRetry}
                className="flex items-center gap-2"
                variant="default"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            )}
            
            {onGoHome && (
              <Button 
                onClick={onGoHome}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Wifi className="w-4 h-4" />
                Go Home
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Specialized error fallbacks for different contexts
export function NetworkErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorFallback
      error={new Error('Network connection failed')}
      context="connecting to the server"
      onRetry={onRetry}
      showDetails={false}
    />
  )
}

export function AuthErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorFallback
      error={new Error('Authentication required')}
      context="verifying your identity"
      onRetry={onRetry}
      showDetails={false}
    />
  )
}

export function ServerErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorFallback
      error={new Error('Server temporarily unavailable')}
      context="processing your request"
      onRetry={onRetry}
      showDetails={false}
    />
  )
}
