"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Zap, AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { subscriptionService } from "@/lib/subscription-service"
import { useAuth } from "@/contexts/AuthContext"

interface CancellationStatus {
  canCancel: boolean
  isTrial: boolean
  daysRemaining: number | null
  cancellationReason?: string
}

export function SubscriptionManager() {
  const { user } = useAuth()
  const [cancellationStatus, setCancellationStatus] = useState<CancellationStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (user) {
      loadCancellationStatus()
    }
  }, [user])

  const loadCancellationStatus = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Check if this is the master account
      if (user.email === 'kennethoswin289@gmail.com') {
        setCancellationStatus({
          canCancel: false,
          isTrial: false,
          daysRemaining: null,
          cancellationReason: 'Master account - unlimited access'
        })
        return
      }
      
      const status = await subscriptionService.getCancellationStatus(user.id)
      setCancellationStatus(status)
    } catch (error) {
      console.error('Error loading cancellation status:', error)
      toast.error('Failed to load subscription status')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!user || !cancellationStatus?.canCancel) return

    setCancelling(true)
    
    try {
      const result = await subscriptionService.cancelSubscription(user.id)
      
      if (result.success) {
        toast.success('Subscription cancelled successfully. You have been returned to the free plan.')
        
        // Update local storage to reflect free plan
        localStorage.setItem('oryn_user_plan', JSON.stringify({
          name: 'free',
          maxWatchlistItems: 15,
          maxPriceAlerts: 5,
          maxOptionsFlow: 3,
          isTrial: false,
          verified: false
        }))
        
        // Reload the page to reflect changes
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      toast.error('Failed to cancel subscription. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!cancellationStatus) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Subscription Management
        </CardTitle>
        <CardDescription>
          Manage your Pro subscription and trial status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {user?.email === 'kennethoswin289@gmail.com' ? (
          <>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="font-medium text-yellow-600 dark:text-yellow-400">
                    Master Account Active
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Unlimited access to all features
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                Master
              </Badge>
            </div>
          </>
        ) : cancellationStatus.canCancel ? (
          <>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <div className="font-medium">
                    {cancellationStatus.isTrial ? 'Pro Trial Active' : 'Pro Subscription Active'}
                  </div>
                  {cancellationStatus.isTrial && cancellationStatus.daysRemaining !== null && (
                    <div className="text-sm text-muted-foreground">
                      {cancellationStatus.daysRemaining > 0 
                        ? `${cancellationStatus.daysRemaining} days remaining`
                        : 'Trial expired'
                      }
                    </div>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                {cancellationStatus.isTrial ? 'Trial' : 'Active'}
              </Badge>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {cancellationStatus.isTrial 
                  ? 'Cancelling your trial will immediately return you to the free plan. You will lose access to all Pro features.'
                  : 'Cancelling your subscription will return you to the free plan. You will lose access to all Pro features.'
                }
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="flex-1"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Subscription
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/#pricing'}
                className="flex-1"
              >
                View Plans
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <div className="text-lg font-medium mb-2">No Active Subscription</div>
            <div className="text-sm text-muted-foreground mb-4">
              {cancellationStatus.cancellationReason || 'You are currently on the free plan.'}
            </div>
            <Button
              onClick={() => window.location.href = '/#pricing'}
              className="w-full"
            >
              Upgrade to Pro
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
