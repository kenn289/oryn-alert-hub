'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  FileText, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw,
  Download,
  Settings,
  BarChart3,
  Database,
  Server,
  Bug,
  Zap
} from 'lucide-react'

interface LogEntry {
  id: string
  level: string
  message: string
  context?: any
  metadata?: any
  timestamp: string
}

interface AuditEntry {
  id: string
  action: string
  resource: string
  resource_id?: string
  user_id?: string
  user_email?: string
  ip_address: string
  user_agent: string
  changes?: any
  previous_values?: any
  new_values?: any
  reason?: string
  metadata?: any
  timestamp: string
}

interface PerformanceLog {
  id: string
  endpoint: string
  method: string
  duration: number
  status_code: number
  user_id?: string
  ip_address: string
  user_agent: string
  request_size?: number
  response_size?: number
  database_queries?: number
  cache_hits?: number
  cache_misses?: number
  timestamp: string
}

interface LoggingStats {
  total_logs: number
  total_audit_entries: number
  total_performance_logs: number
  logs_by_level: Record<string, number>
  recent_activity: number
}

interface LoggingDashboardProps {
  showAdvancedMetrics?: boolean
  showRealTimeUpdates?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export function LoggingDashboard({
  showAdvancedMetrics = true,
  showRealTimeUpdates = true,
  autoRefresh = true,
  refreshInterval = 30000
}: LoggingDashboardProps) {
  const [stats, setStats] = useState<LoggingStats | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([])
  const [performanceLogs, setPerformanceLogs] = useState<PerformanceLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const loadLoggingData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/logging/dashboard')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      setStats(data.stats)
      setLogs(data.logs || [])
      setAuditTrail(data.auditTrail || [])
      setPerformanceLogs(data.performanceLogs || [])
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error loading logging data:', error)
      setError('Failed to load logging data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    await loadLoggingData()
  }

  const exportLogs = async () => {
    try {
      const response = await fetch('/api/logging/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `logs-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting logs:', error)
    }
  }

  const cleanupOldLogs = async () => {
    try {
      const response = await fetch('/api/logging/cleanup', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        alert(`Cleaned up ${data.deletedCount} old log entries`)
        await refreshData()
      }
    } catch (error) {
      console.error('Error cleaning up logs:', error)
    }
  }

  useEffect(() => {
    loadLoggingData()
    
    if (autoRefresh) {
      const interval = setInterval(loadLoggingData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'debug':
        return <FileText className="h-4 w-4 text-gray-600" />
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'debug':
        return 'bg-gray-100 text-gray-800'
      case 'info':
        return 'bg-blue-100 text-blue-800'
      case 'warn':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'text-green-600'
    if (statusCode >= 300 && statusCode < 400) return 'text-blue-600'
    if (statusCode >= 400 && statusCode < 500) return 'text-yellow-600'
    if (statusCode >= 500) return 'text-red-600'
    return 'text-gray-600'
  }

  if (loading && !stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading logging data...</span>
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
                <FileText className="h-5 w-5" />
                Logging Dashboard
              </CardTitle>
              <CardDescription>
                Comprehensive logging and audit trail monitoring
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={refreshData} disabled={loading} size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={exportLogs} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={cleanupOldLogs} variant="outline" size="sm">
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

      {/* Logging Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Logs</p>
                  <p className="text-2xl font-bold">{stats.total_logs}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Audit Entries</p>
                  <p className="text-2xl font-bold">{stats.total_audit_entries}</p>
                </div>
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Performance Logs</p>
                  <p className="text-2xl font-bold">{stats.total_performance_logs}</p>
                </div>
                <Zap className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Recent Activity</p>
                  <p className="text-2xl font-bold">{stats.recent_activity}</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logs by Level */}
      {stats && stats.logs_by_level && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Logs by Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(stats.logs_by_level).map(([level, count]) => (
                <div key={level} className="text-center">
                  <div className="text-2xl font-bold">{count}</div>
                  <Badge className={getLevelColor(level)}>
                    {level.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logging Tabs */}
      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Application Logs</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Application Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getLevelIcon(log.level)}
                      <div>
                        <p className="font-medium">{log.message}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getLevelColor(log.level)}>
                        {log.level.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditTrail.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium">{entry.action} on {entry.resource}</p>
                        <p className="text-sm text-muted-foreground">
                          {entry.user_email || entry.ip_address} • {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{entry.resource}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performanceLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Zap className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium">{log.method} {log.endpoint}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.duration}ms • {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(log.status_code)}>
                        {log.status_code}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Error Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs
                  .filter(log => log.level === 'error' || log.level === 'critical')
                  .map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getLevelIcon(log.level)}
                        <div>
                          <p className="font-medium">{log.message}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getLevelColor(log.level)}>
                          {log.level.toUpperCase()}
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
