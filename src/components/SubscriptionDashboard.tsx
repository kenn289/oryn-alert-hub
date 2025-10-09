"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Separator } from './ui/separator'
import { 
  Calendar, 
  CreditCard, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Zap,
  Shield,
  Crown,
  Download,
  Mail,
  Phone
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { subscriptionLifecycleService, SubscriptionStatus } from '../lib/subscription-lifecycle-service'
import { toast } from 'sonner'
import { useCurrency } from '../contexts/CurrencyContext'

export function SubscriptionDashboard() {
  const { user } = useAuth()
  const { formatCurrency } = useCurrency()
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadSubscription()
    }
  }, [user])

  const loadSubscription = async () => {
    try {
      setLoading(true)
      const status = await subscriptionLifecycleService.getSubscriptionStatus(user!.id)
      setSubscription(status)
    } catch (error) {
      console.error('Error loading subscription:', error)
      toast.error('Failed to load subscription details')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!subscription) return
    
    setActionLoading('cancel')
    try {
      const result = await subscriptionLifecycleService.cancelSubscription(
        user!.id,
        'User requested cancellation',
        false // End of period cancellation
      )
      
      if (result.success) {
        toast.success(result.message)
        await loadSubscription()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      toast.error('Failed to cancel subscription')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReactivateSubscription = async () => {
    if (!subscription) return
    
    setActionLoading('reactivate')
    try {
      const result = await subscriptionLifecycleService.reactivateSubscription(user!.id)
      
      if (result.success) {
        toast.success(result.message)
        await loadSubscription()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error)
      toast.error('Failed to reactivate subscription')
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleAutoRenewal = async (enabled: boolean) => {
    setActionLoading('auto-renewal')
    try {
      const result = await subscriptionLifecycleService.setupAutoRenewal(user!.id, enabled)
      
      if (result.success) {
        toast.success(result.message)
        await loadSubscription()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error updating auto-renewal:', error)
      toast.error('Failed to update auto-renewal settings')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'cancelled': return 'bg-red-500'
      case 'expired': return 'bg-gray-500'
      case 'suspended': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      case 'expired': return <Clock className="h-4 w-4" />
      case 'suspended': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getPlanIcon = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'pro': return <Crown className="h-5 w-5 text-yellow-500" />
      case 'premium': return <Zap className="h-5 w-5 text-purple-500" />
      default: return <Shield className="h-5 w-5 text-blue-500" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            No Active Subscription
          </CardTitle>
          <CardDescription>
            You don't have an active subscription. Upgrade to Pro to unlock all features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.href = '/pricing'} className="w-full">
            View Pricing Plans
          </Button>
        </CardContent>
      </Card>
    )
  }

  const progressPercentage = Math.max(0, Math.min(100, (30 - subscription.daysRemaining) / 30 * 100))

  return (
    <div className="space-y-6">
      {/* Subscription Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getPlanIcon(subscription.plan)}
              <div>
                <CardTitle className="text-xl">
                  {subscription.plan.toUpperCase()} Subscription
                </CardTitle>
                <CardDescription>
                  {subscription.isTrial ? 'Trial Period' : 'Active Subscription'}
                </CardDescription>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={`${getStatusColor(subscription.status)} text-white border-0`}
            >
              <div className="flex items-center gap-1">
                {getStatusIcon(subscription.status)}
                {subscription.status.toUpperCase()}
              </div>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Days Remaining Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Days Remaining</span>
              <span className="font-medium">{subscription.daysRemaining} days</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            {subscription.daysRemaining <= 7 && subscription.status === 'active' && (
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                Your subscription expires soon. Consider renewing to avoid interruption.
              </div>
            )}
          </div>

          <Separator />

          {/* Subscription Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Start Date:</span>
              <p className="font-medium">
                {new Date(subscription.startDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">End Date:</span>
              <p className="font-medium">
                {new Date(subscription.endDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Auto Renewal:</span>
              <p className="font-medium">
                {subscription.autoRenew ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Payment Method:</span>
              <p className="font-medium">{subscription.paymentMethod}</p>
            </div>
          </div>

          {subscription.nextPaymentAmount && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Next Payment:</span>
                <span className="font-medium">
                  {formatCurrency(subscription.nextPaymentAmount, subscription.currency)}
                </span>
              </div>
              {subscription.nextBillingDate && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-muted-foreground">Due Date:</span>
                  <span className="text-sm">
                    {new Date(subscription.nextBillingDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manage Subscription
          </CardTitle>
          <CardDescription>
            Control your subscription settings and billing preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auto Renewal Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Auto Renewal</h4>
              <p className="text-sm text-muted-foreground">
                Automatically renew your subscription
              </p>
            </div>
            <Button
              variant={subscription.autoRenew ? "default" : "outline"}
              size="sm"
              onClick={() => handleToggleAutoRenewal(!subscription.autoRenew)}
              disabled={actionLoading === 'auto-renewal'}
            >
              {actionLoading === 'auto-renewal' ? 'Updating...' : 
               subscription.autoRenew ? 'Enabled' : 'Disabled'}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {subscription.status === 'active' && (
              <Button
                variant="destructive"
                onClick={handleCancelSubscription}
                disabled={actionLoading === 'cancel'}
                className="flex-1"
              >
                {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Subscription'}
              </Button>
            )}
            
            {subscription.status === 'cancelled' && (
              <Button
                onClick={handleReactivateSubscription}
                disabled={actionLoading === 'reactivate'}
                className="flex-1"
              >
                {actionLoading === 'reactivate' ? 'Reactivating...' : 'Reactivate Subscription'}
              </Button>
            )}
          </div>

          {/* Download Invoice */}
          <Button variant="outline" className="w-full" disabled>
            <Download className="h-4 w-4 mr-2" />
            Download Invoice
          </Button>
        </CardContent>
      </Card>

      {/* Support Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Need Help?
          </CardTitle>
          <CardDescription>
            Contact our support team for assistance with your subscription.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full" onClick={() => window.location.href = '/support'}>
            <Mail className="h-4 w-4 mr-2" />
            Contact Support
          </Button>
          <Button variant="outline" className="w-full" onClick={() => window.location.href = '/pricing'}>
            <Crown className="h-4 w-4 mr-2" />
            View All Plans
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
