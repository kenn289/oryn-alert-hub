"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Zap, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { paymentService } from "@/lib/payment-service"

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "Unlimited watchlist items",
      "Real-time price alerts",
      "Email notifications",
      "Basic options flow",
      "Earnings summaries",
      "Community support"
    ],
    cta: "Get Started",
    variant: "outline" as const,
    popular: false
  },
  {
    name: "Pro",
    price: "₹999",
    period: "month",
    description: "For serious traders",
    features: [
      "Everything in Free",
      "Advanced options flow",
      "AI-powered insights",
      "Insider trading alerts",
      "Portfolio analytics",
      "Custom webhooks",
      "Team collaboration",
      "Advanced analytics",
      "White-label options",
      "Priority support"
    ],
    cta: "Start Pro Trial",
    variant: "gradient" as const,
    popular: true
  }
]

export function Pricing() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleGetStarted = () => {
    if (user) {
      // User is logged in, redirect to dashboard
      window.location.href = '/dashboard'
    } else {
      // User not logged in, redirect to auth
      window.location.href = '/auth'
    }
  }

  const handleStartProTrial = async () => {
    if (!user) {
      toast.error('Please sign in first to start your Pro trial')
      window.location.href = '/auth'
      return
    }

    setLoading(true)
    
    try {
      // Create secure payment order
      const paymentOrder = await paymentService.createPaymentOrder(
        'pro',
        user.id,
        user.email || ''
      )

      // Initialize Razorpay
      const options = {
        key: paymentOrder.key,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'Oryn Pro Trial',
        description: '7-day Pro trial with full access to all features',
        order_id: paymentOrder.orderId,
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          try {
            // Verify payment on server
            const verification = await paymentService.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              user.id
            )

            if (verification.success) {
              toast.success('Pro trial activated! You now have access to all Pro features for 7 days.')
              
              // Update localStorage with verified subscription
              localStorage.setItem('oryn_user_plan', JSON.stringify({
                name: 'pro',
                maxWatchlistItems: -1,
                maxPriceAlerts: -1,
                maxOptionsFlow: -1,
                trialEndsAt: verification.subscription?.trialEndsAt,
                isTrial: true,
                verified: true
              }))
              
              // Redirect to dashboard
              setTimeout(() => {
                window.location.href = '/dashboard'
              }, 1500)
            } else {
              toast.error(verification.message || 'Payment verification failed. Please contact support.')
            }
          } catch (error) {
            console.error('Payment verification error:', error)
            const errorMessage = (error as Error).message
            
            if (errorMessage.includes('Payment verification failed')) {
              toast.error('Payment verification failed. Please contact support.')
            } else if (errorMessage.includes('Missing payment details')) {
              toast.error('Payment details are missing. Please try again.')
            } else {
              toast.error('Payment verification failed. Please contact support.')
            }
          }
        },
        prefill: {
          name: user.user_metadata?.full_name || '',
          email: user.email || '',
        },
        theme: {
          color: '#8B5CF6'
        }
      }

      // Open Razorpay checkout
      const rzp = new (window as unknown as { Razorpay: new (options: unknown) => { open: () => void } }).Razorpay(options)
      rzp.open()

    } catch (error: unknown) {
      console.error('Payment initialization error:', error)
      const errorMessage = (error as Error).message
      
      // Show specific error messages based on the error type
      if (errorMessage.includes('Payment service not configured')) {
        toast.error('Payment service is not configured. Please contact support.')
      } else if (errorMessage.includes('Database service not configured')) {
        toast.error('Database service is not configured. Please contact support.')
      } else if (errorMessage.includes('User authentication required')) {
        toast.error('Please sign in to start your Pro trial.')
      } else if (errorMessage.includes('Invalid plan')) {
        toast.error('Invalid subscription plan. Please try again.')
      } else if (errorMessage.includes('Payment service is currently unavailable')) {
        toast.error('Payment service is temporarily unavailable. Please try again in a few minutes.')
      } else {
        toast.error(errorMessage || 'Failed to initialize payment. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, transparent
            <span className="block gradient-text">pricing</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the plan that fits your trading needs. 
            All plans include core features with no hidden fees.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative hover-lift ${
                plan.popular 
                  ? 'border-primary/50 bg-gradient-to-b from-primary/5 to-transparent' 
                  : 'border-border/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <Zap className="h-4 w-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                <CardDescription className="mt-2">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <Check className="h-5 w-5 text-success flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.variant} 
                  className="w-full"
                  size="lg"
                  onClick={plan.name === 'Free' ? handleGetStarted : handleStartProTrial}
                  disabled={loading}
                >
                  {loading && plan.name === 'Pro' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting Trial...
                    </>
                  ) : (
                    plan.cta
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-6">
              <h4 className="font-semibold mb-2">Can I change plans anytime?</h4>
              <p className="text-sm text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. 
                Changes take effect immediately.
              </p>
            </Card>
            <Card className="p-6">
              <h4 className="font-semibold mb-2">Is there a free trial?</h4>
              <p className="text-sm text-muted-foreground">
                Pro plan comes with a 7-day free trial. No credit card required to start.
              </p>
            </Card>
            <Card className="p-6">
              <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
              <p className="text-sm text-muted-foreground">
                We accept all major credit cards, UPI, and bank transfers through Razorpay.
              </p>
            </Card>
            <Card className="p-6">
              <h4 className="font-semibold mb-2">Can I cancel anytime?</h4>
              <p className="text-sm text-muted-foreground">
                Yes, you can cancel your subscription anytime. 
                You&apos;ll retain access until the end of your billing period.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
