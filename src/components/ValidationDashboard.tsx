'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  Download,
  Settings,
  BarChart3,
  Database,
  Shield,
  Zap,
  FileText,
  Activity,
  Server,
  Bug
} from 'lucide-react'

interface ValidationResult {
  test: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: any
  timestamp: string
}

interface TestSuite {
  name: string
  description: string
  tests: ValidationResult[]
  overallStatus: 'pass' | 'fail' | 'warning'
  duration: number
  timestamp: string
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  components: {
    database: 'healthy' | 'degraded' | 'unhealthy'
    authentication: 'healthy' | 'degraded' | 'unhealthy'
    payments: 'healthy' | 'degraded' | 'unhealthy'
    security: 'healthy' | 'degraded' | 'unhealthy'
    logging: 'healthy' | 'degraded' | 'unhealthy'
    performance: 'healthy' | 'degraded' | 'unhealthy'
  }
  metrics: {
    responseTime: number
    errorRate: number
    uptime: number
    memoryUsage: number
    cpuUsage: number
  }
  alerts: string[]
  recommendations: string[]
}

interface ValidationDashboardProps {
  showAdvancedMetrics?: boolean
  showRealTimeUpdates?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export function ValidationDashboard({
  showAdvancedMetrics = true,
  showRealTimeUpdates = true,
  autoRefresh = true,
  refreshInterval = 60000
}: ValidationDashboardProps) {
  const [testSuite, setTestSuite] = useState<TestSuite | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const loadValidationData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/validation/system')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      setTestSuite(data.testSuite)
      setSystemHealth(data.systemHealth)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error loading validation data:', error)
      setError('Failed to load validation data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    await loadValidationData()
  }

  const exportValidationData = async () => {
    try {
      const response = await fetch('/api/validation/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `validation-report-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting validation data:', error)
    }
  }

  const runValidation = async () => {
    try {
      const response = await fetch('/api/validation/run', { method: 'POST' })
      if (response.ok) {
        await loadValidationData()
      }
    } catch (error) {
      console.error('Error running validation:', error)
    }
  }

  useEffect(() => {
    loadValidationData()
    
    if (autoRefresh) {
      const interval = setInterval(loadValidationData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800'
      case 'fail':
        return 'bg-red-100 text-red-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800'
      case 'unhealthy':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getComponentIcon = (component: string) => {
    switch (component) {
      case 'database':
        return <Database className="h-4 w-4" />
      case 'authentication':
        return <Shield className="h-4 w-4" />
      case 'payments':
        return <Activity className="h-4 w-4" />
      case 'security':
        return <Shield className="h-4 w-4" />
      case 'logging':
        return <FileText className="h-4 w-4" />
      case 'performance':
        return <Zap className="h-4 w-4" />
      default:
        return <Server className="h-4 w-4" />
    }
  }

  if (loading && !testSuite) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading validation data...</span>
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
                <CheckCircle className="h-5 w-5" />
                System Validation Dashboard
              </CardTitle>
              <CardDescription>
                Comprehensive system validation and health monitoring
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={runValidation} disabled={loading} size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Run Validation
              </Button>
              <Button onClick={exportValidationData} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
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

      {/* System Health Overview */}
      {systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overall Health</p>
                  <p className="text-2xl font-bold">{systemHealth.overall}</p>
                </div>
                <Server className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Response Time</p>
                  <p className="text-2xl font-bold">{systemHealth.metrics.responseTime}ms</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                  <p className="text-2xl font-bold">{(systemHealth.metrics.errorRate * 100).toFixed(1)}%</p>
                </div>
                <Bug className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                  <p className="text-2xl font-bold">{systemHealth.metrics.uptime.toFixed(1)}%</p>
                </div>
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Component Health */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Component Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(systemHealth.components).map(([component, health]) => (
                <div key={component} className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    {getComponentIcon(component)}
                  </div>
                  <p className="text-sm font-medium capitalize">{component}</p>
                  <Badge className={getHealthColor(health)}>
                    {health}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Results */}
      {testSuite && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tests">Test Results</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Validation Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {testSuite.tests.filter(t => t.status === 'pass').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Passed</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {testSuite.tests.filter(t => t.status === 'warning').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Warnings</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {testSuite.tests.filter(t => t.status === 'fail').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Status</span>
                    <Badge className={getStatusColor(testSuite.overallStatus)}>
                      {testSuite.overallStatus.toUpperCase()}
                    </Badge>
                  </div>
                  <Progress 
                    value={testSuite.tests.filter(t => t.status === 'pass').length / testSuite.tests.length * 100} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testSuite.tests.map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <div>
                          <p className="font-medium">{test.test}</p>
                          <p className="text-sm text-muted-foreground">{test.message}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(test.status)}>
                          {test.status.toUpperCase()}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {new Date(test.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  System Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemHealth?.alerts.map((alert, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <p className="text-sm">{alert}</p>
                    </div>
                  ))}
                  {systemHealth?.alerts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <p>No system alerts</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemHealth?.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                      <Settings className="h-4 w-4 text-yellow-600" />
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  ))}
                  {systemHealth?.recommendations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <p>No recommendations</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
