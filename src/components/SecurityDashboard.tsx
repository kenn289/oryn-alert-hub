'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Activity, 
  Eye, 
  Lock, 
  Unlock,
  RefreshCw,
  Download,
  Settings,
  BarChart3,
  Users,
  Globe,
  Smartphone
} from 'lucide-react'

interface SecurityEvent {
  id: string
  type: string
  user_id?: string
  user_email?: string
  ip_address: string
  user_agent: string
  device_fingerprint?: string
  geolocation?: any
  risk_score: number
  details: string
  metadata?: any
  created_at: string
}

interface SecurityAnalytics {
  total_events: number
  high_risk_events: number
  avg_risk_score: number
  top_event_types: string[]
  recent_events_24h: number
  blocked_ips: number
  active_sessions: number
}

interface SecurityDashboardProps {
  showAdvancedMetrics?: boolean
  showRealTimeUpdates?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export function SecurityDashboard({
  showAdvancedMetrics = true,
  showRealTimeUpdates = true,
  autoRefresh = true,
  refreshInterval = 30000
}: SecurityDashboardProps) {
  const [analytics, setAnalytics] = useState<SecurityAnalytics | null>(null)
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([])
  const [rateLimits, setRateLimits] = useState<any[]>([])
  const [securityViolations, setSecurityViolations] = useState<any[]>([])
  const [fraudAttempts, setFraudAttempts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const loadSecurityData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/security/dashboard')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      setAnalytics(data.analytics)
      setRecentEvents(data.recentEvents || [])
      setRateLimits(data.rateLimits || [])
      setSecurityViolations(data.securityViolations || [])
      setFraudAttempts(data.fraudAttempts || [])
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error loading security data:', error)
      setError('Failed to load security data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    await loadSecurityData()
  }

  const exportSecurityData = async () => {
    try {
      const response = await fetch('/api/security/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `security-report-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting security data:', error)
    }
  }

  const cleanupOldData = async () => {
    try {
      const response = await fetch('/api/security/cleanup', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        alert(`Cleaned up ${data.deletedCount} old security records`)
        await refreshData()
      }
    } catch (error) {
      console.error('Error cleaning up data:', error)
    }
  }

  useEffect(() => {
    loadSecurityData()
    
    if (autoRefresh) {
      const interval = setInterval(loadSecurityData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  const getRiskLevel = (riskScore: number) => {
    if (riskScore >= 0.8) return { level: 'Critical', color: 'bg-red-100 text-red-800' }
    if (riskScore >= 0.6) return { level: 'High', color: 'bg-orange-100 text-orange-800' }
    if (riskScore >= 0.4) return { level: 'Medium', color: 'bg-yellow-100 text-yellow-800' }
    if (riskScore >= 0.2) return { level: 'Low', color: 'bg-blue-100 text-blue-800' }
    return { level: 'Minimal', color: 'bg-green-100 text-green-800' }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login_success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'login_failure':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'suspicious_activity':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'security_violation':
        return <Shield className="h-4 w-4 text-red-600" />
      case 'rate_limit_exceeded':
        return <Lock className="h-4 w-4 text-yellow-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading && !analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading security data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Dashboard
              </CardTitle>
              <CardDescription>
                Comprehensive security monitoring and threat detection
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={refreshData} disabled={loading} size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={exportSecurityData} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={cleanupOldData} variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Cleanup
              </Button>
            </div>
          </div>
          {lastRefresh && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Security Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold">{analytics.total_events}</p>
                </div>
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">High Risk Events</p>
                  <p className="text-2xl font-bold text-red-600">{analytics.high_risk_events}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Risk Score</p>
                  <p className="text-2xl font-bold">{(analytics.avg_risk_score * 100).toFixed(1)}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                  <p className="text-2xl font-bold">{analytics.active_sessions}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Tabs */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
          <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Security Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getEventIcon(event.type)}
                      <div>
                        <p className="font-medium">{event.type.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.ip_address} • {new Date(event.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getRiskLevel(event.risk_score).color}>
                        {getRiskLevel(event.risk_score).level}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {(event.risk_score * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Violations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityViolations.map((violation, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="font-medium">{violation.violation_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {violation.ip_address} • {new Date(violation.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">Violation</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fraud" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Fraud Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fraudAttempts.map((attempt, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="font-medium">Fraud Attempt</p>
                        <p className="text-sm text-muted-foreground">
                          {attempt.ip_address} • {new Date(attempt.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-orange-100 text-orange-800">
                        Risk: {(attempt.risk_score * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rate-limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Rate Limiting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rateLimits.map((limit, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Lock className="h-4 w-4 text-yellow-600" />
                      <div>
                        <p className="font-medium">{limit.endpoint}</p>
                        <p className="text-sm text-muted-foreground">
                          {limit.ip_address} • {limit.count} requests
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {limit.count} requests
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
