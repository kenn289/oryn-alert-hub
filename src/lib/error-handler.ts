// Centralized error handling utilities
import { toast } from 'sonner'

export interface ErrorDetails {
  message: string
  code?: string
  status?: number
  timestamp: string
  context?: string
  userAgent?: string
  url?: string
}

export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

export class AppError extends Error {
  public readonly type: ErrorType
  public readonly code?: string
  public readonly status?: number
  public readonly context?: string
  public readonly userFriendlyMessage: string
  public readonly timestamp: string

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    options: {
      code?: string
      status?: number
      context?: string
      userFriendlyMessage?: string
    } = {}
  ) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.code = options.code
    this.status = options.status
    this.context = options.context
    this.userFriendlyMessage = options.userFriendlyMessage || message
    this.timestamp = new Date().toISOString()
  }
}

export class ErrorHandler {
  private static errorLog: ErrorDetails[] = []
  private static maxLogSize = 100

  // Categorize error based on error object
  static categorizeError(error: unknown): ErrorType {
    if (error instanceof AppError) {
      return error.type
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      
      if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
        return ErrorType.NETWORK
      }
      
      if (message.includes('unauthorized') || message.includes('401')) {
        return ErrorType.AUTHENTICATION
      }
      
      if (message.includes('forbidden') || message.includes('403')) {
        return ErrorType.AUTHORIZATION
      }
      
      if (message.includes('rate limit') || message.includes('429')) {
        return ErrorType.RATE_LIMIT
      }
      
      if (message.includes('validation') || message.includes('invalid')) {
        return ErrorType.VALIDATION
      }
      
      if (message.includes('server') || message.includes('500')) {
        return ErrorType.SERVER
      }
    }

    return ErrorType.UNKNOWN
  }

  // Get user-friendly error message
  static getUserFriendlyMessage(error: unknown, context?: string): string {
    if (error instanceof AppError) {
      return error.userFriendlyMessage
    }

    const errorType = this.categorizeError(error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    switch (errorType) {
      case ErrorType.NETWORK:
        return 'Unable to connect to the server. Please check your internet connection and try again.'
      
      case ErrorType.AUTHENTICATION:
        return 'Please sign in to continue. Your session may have expired.'
      
      case ErrorType.AUTHORIZATION:
        return 'You don\'t have permission to perform this action. Please contact support if you believe this is an error.'
      
      case ErrorType.RATE_LIMIT:
        return 'Too many requests. Please wait a moment and try again.'
      
      case ErrorType.VALIDATION:
        return `Please check your input: ${errorMessage}`
      
      case ErrorType.SERVER:
        return 'Our servers are experiencing issues. Please try again in a few minutes.'
      
      case ErrorType.API:
        if (errorMessage.includes('not found')) {
          return 'The requested information could not be found. Please check your input and try again.'
        }
        if (errorMessage.includes('API key')) {
          return 'Service configuration issue. Please contact support.'
        }
        return 'There was a problem with the service. Please try again.'
      
      default:
        return context 
          ? `Something went wrong while ${context}. Please try again.`
          : 'An unexpected error occurred. Please try again.'
    }
  }

  // Handle error with appropriate user feedback
  static handleError(error: unknown, context?: string, options: {
    showToast?: boolean
    logError?: boolean
    fallbackMessage?: string
  } = {}): string {
    const {
      showToast = true,
      logError = true,
      fallbackMessage
    } = options

    const userMessage = fallbackMessage || this.getUserFriendlyMessage(error, context)
    const errorType = this.categorizeError(error)

    // Log error for debugging
    if (logError) {
      this.logError(error, context)
    }

    // Show toast notification
    if (showToast) {
      this.showErrorToast(userMessage, errorType)
    }

    return userMessage
  }

  // Show appropriate toast based on error type
  private static showErrorToast(message: string, errorType: ErrorType): void {
    switch (errorType) {
      case ErrorType.NETWORK:
        toast.error(message, {
          description: 'Check your internet connection',
          duration: 5000
        })
        break
      
      case ErrorType.AUTHENTICATION:
        toast.error(message, {
          description: 'You may need to sign in again',
          duration: 4000
        })
        break
      
      case ErrorType.RATE_LIMIT:
        toast.warning(message, {
          description: 'Please wait before trying again',
          duration: 4000
        })
        break
      
      case ErrorType.VALIDATION:
        toast.error(message, {
          description: 'Please check your input',
          duration: 4000
        })
        break
      
      default:
        toast.error(message, {
          duration: 4000
        })
    }
  }

  // Log error for debugging and monitoring
  static logError(error: unknown, context?: string): void {
    // Skip logging if error is empty or undefined
    if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
      console.warn('Skipping empty error log:', { error, context })
      return
    }

    const errorDetails: ErrorDetails = {
      message: error instanceof Error ? error.message : String(error),
      code: error instanceof AppError ? error.code : undefined,
      status: error instanceof AppError ? error.status : undefined,
      timestamp: new Date().toISOString(),
      context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    }

    // Add to in-memory log
    this.errorLog.unshift(errorDetails)
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize)
    }

    // Log to console in development with better error details
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', {
        message: errorDetails.message,
        code: errorDetails.code,
        status: errorDetails.status,
        context: errorDetails.context,
        timestamp: errorDetails.timestamp,
        originalError: error
      })
    }

    // TODO: Send to error tracking service in production
    // Example: Sentry, LogRocket, etc.
  }

  // Get recent errors for debugging
  static getRecentErrors(limit: number = 10): ErrorDetails[] {
    return this.errorLog.slice(0, limit)
  }

  // Clear error log
  static clearErrorLog(): void {
    this.errorLog = []
  }

  // Create specific error types
  static createNetworkError(message: string = 'Network request failed'): AppError {
    return new AppError(message, ErrorType.NETWORK, {
      userFriendlyMessage: 'Unable to connect to the server. Please check your internet connection.'
    })
  }

  static createValidationError(message: string, field?: string): AppError {
    return new AppError(message, ErrorType.VALIDATION, {
      code: 'VALIDATION_ERROR',
      userFriendlyMessage: field ? `Invalid ${field}: ${message}` : message
    })
  }

  static createApiError(message: string, status?: number): AppError {
    return new AppError(message, ErrorType.API, {
      status,
      userFriendlyMessage: 'There was a problem with the service. Please try again.'
    })
  }

  static createAuthError(message: string = 'Authentication required'): AppError {
    return new AppError(message, ErrorType.AUTHENTICATION, {
      userFriendlyMessage: 'Please sign in to continue.'
    })
  }
}

// Utility function for async error handling
export async function handleAsyncError<T>(
  asyncFn: () => Promise<T>,
  context?: string,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await asyncFn()
  } catch (error) {
    ErrorHandler.handleError(error, context)
    return fallback
  }
}

// Utility function for API error handling
export function handleApiError(response: Response): never {
  const status = response.status
  const message = `API request failed with status ${status}`
  
  if (status === 401) {
    throw ErrorHandler.createAuthError('Authentication required')
  } else if (status === 403) {
    throw new AppError('Access forbidden', ErrorType.AUTHORIZATION, {
      userFriendlyMessage: 'You don\'t have permission to perform this action.'
    })
  } else if (status === 404) {
    throw new AppError('Resource not found', ErrorType.API, {
      userFriendlyMessage: 'The requested information could not be found.'
    })
  } else if (status === 429) {
    throw new AppError('Rate limit exceeded', ErrorType.RATE_LIMIT, {
      userFriendlyMessage: 'Too many requests. Please wait a moment and try again.'
    })
  } else if (status >= 500) {
    throw new AppError('Server error', ErrorType.SERVER, {
      userFriendlyMessage: 'Our servers are experiencing issues. Please try again later.'
    })
  }
  
  throw ErrorHandler.createApiError(message, status)
}
