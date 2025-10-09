"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../src/contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../src/components/ui/card"
import { Button } from "../../src/components/ui/button"
import { Activity, ArrowLeft, Zap, TrendingUp, DollarSign } from "lucide-react"
import { OptionsFlow } from "../../src/components/OptionsFlow"
import { useFeatures } from "../../src/hooks/use-features"
import { PLANS } from "../../src/lib/watchlist"

export default function OptionsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [userPlan, setUserPlan] = useState(PLANS.free)
  const features = useFeatures(userPlan)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      // Check if user has Pro access
      const checkProAccess = async () => {
        try {
          const response = await fetch('/api/subscription/status')
          if (response.ok) {
            const data = await response.json()
            if (data.plan === 'pro' || data.plan === 'master') {
              setUserPlan(PLANS.pro)
            }
          }
        } catch (error) {
          console.error('Error checking subscription:', error)
        }
      }
      checkProAccess()
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  // Check if user has Pro access
  if (userPlan.name === 'free') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Options Flow Analysis</h1>
          </div>

          <Card className="p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <Activity className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-2xl mb-4">Pro Feature Required</CardTitle>
            <CardDescription className="text-lg mb-6">
              Advanced options flow analysis is available with a Pro subscription. Upgrade to access:
            </CardDescription>
            
            <div className="grid md:grid-cols-2 gap-4 mb-8 text-left">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span>Unusual Options Activity</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span>Call/Put Ratio Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span>Large Block Trades</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <span>Volume Spike Detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-red-500" />
                  <span>Institutional Flow</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-500" />
                  <span>Real-time Alerts</span>
                </div>
              </div>
            </div>

            <Button 
              size="lg" 
              onClick={() => router.push('/#pricing')}
              className="w-full max-w-md"
            >
              Upgrade to Pro
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="page-background p-4">
      {/* Floating elements */}
      <div className="floating-element-1"></div>
      <div className="floating-element-2"></div>
      <div className="floating-element-3"></div>
      
      <div className="container mx-auto max-w-7xl pt-20 relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Options Flow Analysis</h1>
        </div>

        <OptionsFlow />
      </div>
    </div>
  )
}

