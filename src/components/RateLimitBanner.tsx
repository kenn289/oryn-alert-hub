"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { X, RefreshCw } from "lucide-react"

interface RateLimitBannerProps {
  onDismiss: () => void
  onRetry: () => void
}

export function RateLimitBanner({ onDismiss, onRetry }: RateLimitBannerProps) {
  return (
    <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <RefreshCw className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
              Rate Limit Reached
            </h3>
            <AlertDescription className="text-orange-700 dark:text-orange-300">
              You&apos;ve reached the API rate limit. Some features may be temporarily unavailable.
            </AlertDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-800"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-orange-600 hover:bg-orange-100 dark:text-orange-400 dark:hover:bg-orange-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  )
}
