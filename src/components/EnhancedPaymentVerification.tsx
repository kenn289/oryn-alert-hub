'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  User, 
  CreditCard,
  Activity,
  BarChart3,
  RefreshCw,
  Eye,
  Trash2,
  Download
} from 'lucide-react'

interface PaymentVerificationRequest {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  userId: string
  userEmail: string
  userAgent?: string
  ipAddress?: string
  deviceFingerprint?: string
}

interface VerificationResult {
  success: boolean
  message: string
  subscription?: {
    plan: string
    status: string
    endDate: string
    daysRemaining: number
    paymentId: string
    orderId: string
  }
  verification?: {
    signatureVerified: boolean
    userVerified: boolean
    orderVerified: boolean
    subscriptionActivated: boolean
    riskScore: number
    fraudChecks: string[]
  }
  error?: string
  code?: string
  processingTime?: number
}

interface FraudAnalytics {
  total_attempts: number
  high_risk_attempts: number
  avg_risk_score: number
  top_violation_types: string[]
  recent_attempts_24h: number
}

interface VerificationStats {
  total_verifications: number
  successful_verifications: number
  failed_verifications: number
  fraud_detected: number
  avg_processing_time: number
  success_rate: number
}

interface SecurityDashboard {
  metric_type: string
  count: number
  last_24h: number
  last_7d: number
  avg_risk_score: number | null
}

interface EnhancedPaymentVerificationProps {
  userId: string
  userEmail: string
  orderId?: string
  paymentId?: string
  signature?: string
  onVerificationComplete?: (result: VerificationResult) => void
  showAnalytics?: boolean
  autoRefresh?: boolean
}

export function EnhancedPaymentVerification({
  userId,
  userEmail,
  orderId,
  paymentId,
  signature,
  onVerificationComplete,
  showAnalytics = true,
  autoRefresh = false
}: EnhancedPaymentVerificationProps) {
  const [verificationData, setVerificationData] = useState<PaymentVerificationRequest>({
    razorpay_order_id: orderId || '',
    razorpay_payment_id: paymentId || '',
    razorpay_signature: signature || '',
    userId,
    userEmail,
    userAgent: navigator.userAgent,
    ipAddress: '',
    deviceFingerprint: ''
  })

  const [result, setResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<FraudAnalytics | null>(null)
  const [stats, setStats] = useState<VerificationStats | null>(null)
  const [dashboard, setDashboard] = useState<SecurityDashboard[]>([])
  const [recentAttempts, setRecentAttempts] = useState<any[]>([])

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/payment/enhanced-verification?action=fraud-analytics&userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Error loading fraud analytics:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch(`/api/payment/enhanced-verification?action=verification-stats&userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading verification stats:', error)
    }
  }

  const loadDashboard = async () => {
    try {
      const response = await fetch(`/api/payment/enhanced-verification?action=security-dashboard&userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setDashboard(data.dashboard)
      }
    } catch (error) {
      console.error('Error loading security dashboard:', error)
    }
  }

  const loadRecentAttempts = async () => {
    try {
      const response = await fetch(`/api/payment/enhanced-verification?action=recent-attempts&userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setRecentAttempts(data.attempts)
      }
    } catch (error) {
      console.error('Error loading recent attempts:', error)
    }
  }

  const verifyPayment = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/payment/enhanced-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(verificationData)
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        onVerificationComplete?.(data)
      } else {
        setError(data.error || 'Verification failed')
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      setError('Failed to verify payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const cleanupLogs = async () => {
    try {
      const response = await fetch('/api/payment/enhanced-verification?action=cleanup-logs', {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Cleaned up ${data.message}`)
        await loadAnalytics()
        await loadStats()
        await loadDashboard()
      }
    } catch (error) {
      console.error('Error cleaning up logs:', error)
    }
  }

  const refreshData = async () => {
    await Promise.all([
      loadAnalytics(),
      loadStats(),
      loadDashboard(),
      loadRecentAttempts()
    ])
  }

  useEffect(() => {
    if (showAnalytics) {
      refreshData()
      
      if (autoRefresh) {
        const interval = setInterval(refreshData, 30 * 1000) // 30 seconds
        return () => clearInterval(interval)
      }
    }
  }, [userId, showAnalytics, autoRefresh])

  const getRiskLevel = (riskScore: number) => {
    if (riskScore >= 0.8) return { level: 'Critical', color: 'bg-red-100 text-red-800' }
    if (riskScore >= 0.6) return { level: 'High', color: 'bg-orange-100 text-orange-800' }
    if (riskScore >= 0.4) return { level: 'Medium', color: 'bg-yellow-100 text-yellow-800' }
    if (riskScore >= 0.2) return { level: 'Low', color: 'bg-blue-100 text-blue-800' }
    return { level: 'Minimal', color: 'bg-green-100 text-green-800' }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'fraud_detected':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'security_violation':
        return <Shield className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Payment Verification Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Enhanced Payment Verification
          </CardTitle>
          <CardDescription>
            Secure payment verification with fraud detection and security monitoring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="orderId">Razorpay Order ID</Label>
              <Input
                id="orderId"
                value={verificationData.razorpay_order_id}
                onChange={(e) => setVerificationData(prev => ({ ...prev, razorpay_order_id: e.target.value }))}
                placeholder="Enter Razorpay Order ID"
              />
            </div>
            <div>
              <Label htmlFor="paymentId">Razorpay Payment ID</Label>
              <Input
                id="paymentId"
                value={verificationData.razorpay_payment_id}
                onChange={(e) => setVerificationData(prev => ({ ...prev, razorpay_payment_id: e.target.value }))}
                placeholder="Enter Razorpay Payment ID"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="signature">Razorpay Signature</Label>
              <Input
                id="signature"
                value={verificationData.razorpay_signature}
                onChange={(e) => setVerificationData(prev => ({ ...prev, razorpay_signature: e.target.value }))}
                placeholder="Enter Razorpay Signature"
              />
            </div>
          </div>

          <Button onClick={verifyPayment} disabled={loading} className="w-full">
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Verifying Payment...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Verify Payment
              </>
            )}
          </Button>

          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">{result.message}</p>
                  {result.verification && (
                    <div className="text-sm space-y-1">
                      <p>Risk Score: {result.verification.riskScore ? (result.verification.riskScore * 100).toFixed(1) + '%' : 'N/A'}</p>
                      <p>Processing Time: {result.processingTime}ms</p>
                      <div className="flex gap-2">
                        {result.verification.signatureVerified && <Badge variant="outline" className="text-green-600">Signature Verified</Badge>}
                        {result.verification.userVerified && <Badge variant="outline" className="text-green-600">User Verified</Badge>}
                        {result.verification.orderVerified && <Badge variant="outline" className="text-green-600">Order Verified</Badge>}
                        {result.verification.subscriptionActivated && <Badge variant="outline" className="text-green-600">Subscription Activated</Badge>}
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="attempts">Recent Attempts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboard.map((metric, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground capitalize">
                          {metric.metric_type.replace('_', ' ')}
                        </p>
                        <p className="text-2xl font-bold">{metric.count}</p>
                        <p className="text-xs text-muted-foreground">
                          Last 24h: {metric.last_24h} | Last 7d: {metric.last_7d}
                        </p>
                      </div>
                      <Activity className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Verification Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.total_verifications}</div>
                      <p className="text-sm text-muted-foreground">Total Verifications</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.successful_verifications}</div>
                      <p className="text-sm text-muted-foreground">Successful</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{stats.failed_verifications}</div>
                      <p className="text-sm text-muted-foreground">Failed</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{stats.fraud_detected}</div>
                      <p className="text-sm text-muted-foreground">Fraud Detected</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Success Rate</span>
                      <span className="text-sm font-medium">{stats.success_rate.toFixed(1)}%</span>
                    </div>
                    <Progress value={stats.success_rate} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            {analytics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Fraud Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{analytics.total_attempts}</div>
                      <p className="text-sm text-muted-foreground">Total Attempts</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{analytics.high_risk_attempts}</div>
                      <p className="text-sm text-muted-foreground">High Risk</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{(analytics.avg_risk_score * 100).toFixed(1)}%</div>
                      <p className="text-sm text-muted-foreground">Avg Risk Score</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Risk Level</span>
                      <Badge className={getRiskLevel(analytics.avg_risk_score).color}>
                        {getRiskLevel(analytics.avg_risk_score).level}
                      </Badge>
                    </div>
                    <Progress value={analytics.avg_risk_score * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              <Button onClick={refreshData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={cleanupLogs} variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Cleanup Logs
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="attempts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Verification Attempts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentAttempts.map((attempt, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(attempt.verification_status)}
                        <div>
                          <p className="font-medium">{attempt.order_id}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(attempt.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {attempt.verification_status.replace('_', ' ')}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {attempt.processing_time_ms}ms
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
