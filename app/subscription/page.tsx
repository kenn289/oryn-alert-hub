"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../src/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Loader2, CreditCard, Crown, Zap, Shield, Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../src/components/ui/card'
import { Button } from '../../src/components/ui/button'
import { Badge } from '../../src/components/ui/badge'
import { toast } from 'sonner'
import { paymentService } from '../../src/lib/payment-service'
// import { useCurrency } from '../../src/contexts/CurrencyContext'

export default function SubscriptionPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [loadingSubscription, setLoadingSubscription] = useState(true)

  // Simple currency formatter
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const loadSubscriptionStatus = async () => {
    if (!user) return
    
    try {
      setLoadingSubscription(true)
      const response = await fetch(`/api/subscription/status?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error('Error loading subscription status:', error)
    } finally {
      setLoadingSubscription(false)
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    } else if (user) {
      loadSubscriptionStatus()
    }
  }, [user, loading, router])

  const handleStartProTrial = async () => {
    if (!user) {
      toast.error('Please sign in to subscribe to Pro')
      router.push('/auth')
      return
    }

    if (paymentProcessing) {
      toast.info('Payment is already being processed. Please wait...')
      return
    }

    setPaymentProcessing(true)
    try {
      const paymentOrder = await paymentService.createPaymentOrder(
        'pro',
        user.id,
        user.email || ''
      )

      const options = {
        key: paymentOrder.key,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'Oryn Pro Subscription',
        description: 'Pro subscription for advanced features',
        order_id: paymentOrder.orderId,
        prefill: {
          name: user.user_metadata?.name || '',
          email: user.email || '',
        },
        theme: {
          color: '#3B82F6'
        },
        handler: async (response: any) => {
          try {
            console.log('Payment completed, verifying...', response)
            const verification = await paymentService.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              user.id,
              user.email || ''
            )
            
            if (verification.success) {
              toast.success('Payment successful! Your Pro subscription is now active.')
              // Refresh subscription status
              await loadSubscriptionStatus()
            } else {
              toast.error(verification.message || 'Payment verification failed')
            }
          } catch (error) {
            console.error('Payment verification error:', error)
            toast.error('Payment verification failed. Please contact support.')
          }
        },
        modal: {
          ondismiss: async () => {
            console.log('Payment modal dismissed by user')
            toast.info('Payment cancelled. You can try again anytime.')
            
            // Clean up the pending payment from database
            try {
              await fetch('/api/razorpay/clear-pending-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
              })
            } catch (cleanupError) {
              console.error('Error cleaning up pending payment:', cleanupError)
            }
          }
        }
      }

      const rzp = new (window as any).Razorpay(options)
      
      // Add timeout handler for payment modal
      rzp.on('payment.failed', function (response: any) {
        console.log('Payment failed:', response.error)
        toast.error('Payment failed. Please try again or contact support.')
        
        // Clean up pending payment on failure
        fetch('/api/razorpay/clear-pending-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        }).catch(cleanupError => {
          console.error('Error cleaning up failed payment:', cleanupError)
        })
      })
      
      rzp.open()

    } catch (error: unknown) {
      console.error('Payment initialization error:', error)
      const errorMessage = (error as Error).message
      
      if (errorMessage.includes('Authentication required') || errorMessage.includes('Invalid user credentials')) {
        toast.error('Please sign in to make payments')
        router.push('/auth')
      } else if (errorMessage.includes('pending payment')) {
        toast.error('You already have a pending payment. Please complete or cancel it first.')
      } else if (errorMessage.includes('Invalid payment request')) {
        toast.error('Invalid payment request. Please check your details and try again.')
      } else {
        toast.error(errorMessage || 'Failed to initialize payment. Please try again.')
      }
    } finally {
      setPaymentProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading subscription details...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
            <p className="text-muted-foreground mt-2">
              Choose your plan and start your Pro subscription today.
            </p>
          </div>
          
          {/* Current Status */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Current Status
              </CardTitle>
              <CardDescription>
                {loadingSubscription ? (
                  "Loading subscription status..."
                ) : subscription && subscription.status === 'active' ? (
                  `You're currently on the ${subscription.plan.toUpperCase()} plan. Enjoy all advanced features!`
                ) : (
                  "You're currently on the Free plan. Upgrade to Pro for advanced features."
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {loadingSubscription ? (
                    <Badge variant="outline">Loading...</Badge>
                  ) : subscription && subscription.status === 'active' ? (
                    <>
                      <Badge variant="default" className="bg-green-500">PRO Plan</Badge>
                      <span className="text-sm text-green-600">
                        Active until {new Date(subscription.endDate).toLocaleDateString()}
                      </span>
                    </>
                  ) : (
                    <>
                      <Badge variant="outline">Free Plan</Badge>
                      <span className="text-sm text-muted-foreground">Limited features</span>
                    </>
                  )}
                </div>
                {subscription && subscription.status === 'active' ? (
                  <Button variant="outline" disabled>Pro Active</Button>
                ) : (
                  <Button onClick={handleStartProTrial} disabled={subscriptionLoading}>
                    {subscriptionLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Crown className="mr-2 h-4 w-4" />
                        Upgrade to Pro
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pro Plan Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Crown className="h-5 w-5 text-yellow-500" />
                Pro Plan Features
              </CardTitle>
              <CardDescription className="text-gray-600">
                Unlock all advanced features with our Pro subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900">Advanced Analytics</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">Portfolio Performance Analysis</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">Risk Metrics & Sharpe Ratio</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">Max Drawdown Analysis</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">Advanced Charting</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900">AI & Insights</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">AI-Powered Market Predictions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">Options Flow Analysis</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">Insider Trading Alerts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-gray-700">Custom Webhooks</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Pro Subscription</h3>
                    <p className="text-blue-100">Only {formatCurrency(12, 'USD')}/month</p>
                  </div>
                  <Button 
                    size="lg" 
                    onClick={handleStartProTrial}
                    disabled={paymentProcessing}
                    className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
                  >
                    {paymentProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Subscribe to Pro
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}