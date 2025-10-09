"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Badge } from "../../../components/ui/badge"
import { 
  Users, 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle,
  UserPlus,
  Shield,
  Crown
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "../../../contexts/AuthContext"

function TeamJoinContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const [teamCode, setTeamCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [userPlan, setUserPlan] = useState('free')

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      // Check user plan
      const checkUserPlan = async () => {
        try {
          const response = await fetch('/api/subscription/status')
          if (response.ok) {
            const data = await response.json()
            setUserPlan(data.plan || 'free')
          }
        } catch (error) {
          console.error('Error checking user plan:', error)
        }
      }
      checkUserPlan()
    }
  }, [user])

  const handleJoinTeam = async () => {
    if (!teamCode.trim()) {
      toast.error('Please enter a team code')
      return
    }

    if (userPlan === 'free') {
      toast.error('Pro subscription required to join teams')
      return
    }

    setIsJoining(true)
    try {
      // Simulate team joining process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('Successfully joined team!')
      router.push('/team')
    } catch (error) {
      console.error('Error joining team:', error)
      toast.error('Failed to join team. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

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
          <h1 className="text-3xl font-bold">Join Team</h1>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Users className="h-16 w-16 text-primary" />
              </div>
              <CardTitle className="text-2xl">Join a Team</CardTitle>
              <CardDescription>
                Enter your team code to join an existing team and start collaborating
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plan Check */}
              {userPlan === 'free' ? (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-800 dark:text-yellow-200">Pro Subscription Required</span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                    You need a Pro subscription to join teams. Upgrade your plan to access team collaboration features.
                  </p>
                  <Button 
                    onClick={() => router.push('/#pricing')}
                    className="w-full"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800 dark:text-green-200">Pro Account Active</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    You can join teams with your Pro subscription.
                  </p>
                </div>
              )}

              {/* Team Code Input */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="teamCode">Team Code</Label>
                  <Input
                    id="teamCode"
                    value={teamCode}
                    onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                    placeholder="Enter team code (e.g., ABC123)"
                    disabled={userPlan === 'free'}
                    className="text-center text-lg font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ask your team administrator for the team code
                  </p>
                </div>

                <Button 
                  onClick={handleJoinTeam}
                  disabled={isJoining || userPlan === 'free' || !teamCode.trim()}
                  className="w-full"
                >
                  {isJoining ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Joining Team...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Join Team
                    </>
                  )}
                </Button>
              </div>

              {/* Team Benefits */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Team Collaboration Benefits</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Shared Analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Team Watchlists</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Collaborative Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Real-time Updates</span>
                  </div>
                </div>
              </div>

              {/* Reference from URL */}
              {searchParams.get('ref') && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Reference:</strong> {searchParams.get('ref')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function TeamJoinPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeamJoinContent />
    </Suspense>
  )
}
