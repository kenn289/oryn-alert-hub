'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Activity, Database, Zap, BarChart3, RefreshCw, Trash2, Settings } from 'lucide-react'

interface PerformanceMetrics {
  cacheHitRate: number
  averageQueryTime: number
  memoryUsage: number
  connectionPoolUtilization: number
}

interface TableStats {
  table_name: string
  row_count: number
  table_size: string
  index_size: string
  total_size: string
}

interface SlowQuery {
  query: string
  calls: number
  total_time: number
  mean_time: number
  rows: number
}

interface PerformanceMonitorProps {
  userId?: string
}

export function PerformanceMonitor({ userId }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [tableStats, setTableStats] = useState<TableStats[]>([])
  const [slowQueries, setSlowQueries] = useState<SlowQuery[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  const loadMetrics = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/performance?action=metrics')
      const data = await response.json()
      if (data.metrics) {
        setMetrics(data.metrics)
      }
    } catch (error) {
      console.error('Error loading metrics:', error)
      setMessage({ type: 'error', text: 'Failed to load performance metrics' })
    } finally {
      setIsLoading(false)
    }
  }

  const loadTableStats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/performance?action=table-stats')
      const data = await response.json()
      if (data.tableStats) {
        setTableStats(data.tableStats)
      }
    } catch (error) {
      console.error('Error loading table stats:', error)
      setMessage({ type: 'error', text: 'Failed to load table statistics' })
    } finally {
      setIsLoading(false)
    }
  }

  const loadSlowQueries = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/performance?action=slow-queries')
      const data = await response.json()
      if (data.slowQueries) {
        setSlowQueries(data.slowQueries)
      }
    } catch (error) {
      console.error('Error loading slow queries:', error)
      setMessage({ type: 'error', text: 'Failed to load slow queries' })
    } finally {
      setIsLoading(false)
    }
  }

  const optimizeIndexes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'optimize-indexes' })
      })
      const data = await response.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        loadTableStats()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to optimize indexes' })
    } finally {
      setIsLoading(false)
    }
  }

  const warmupCache = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'warmup-cache' })
      })
      const data = await response.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        loadMetrics()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to warmup cache' })
    } finally {
      setIsLoading(false)
    }
  }

  const clearCache = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-cache' })
      })
      const data = await response.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        loadMetrics()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to clear cache' })
    } finally {
      setIsLoading(false)
    }
  }

  const optimizeTables = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'optimize-tables' })
      })
      const data = await response.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        loadTableStats()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to optimize tables' })
    } finally {
      setIsLoading(false)
    }
  }

  const preloadData = async () => {
    if (!userId) {
      setMessage({ type: 'error', text: 'User ID is required for data preloading' })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preload-data', userId })
      })
      const data = await response.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        loadMetrics()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to preload data' })
    } finally {
      setIsLoading(false)
    }
  }

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600'
    if (value >= thresholds.warning) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatQuery = (query: string) => {
    return query.length > 100 ? query.substring(0, 100) + '...' : query
  }

  useEffect(() => {
    loadMetrics()
    loadTableStats()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Monitor
          </CardTitle>
          <CardDescription>
            Monitor and optimize system performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 mb-4">
            <Button onClick={loadMetrics} disabled={isLoading} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Metrics
            </Button>
            <Button onClick={optimizeIndexes} disabled={isLoading} size="sm" variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Optimize Indexes
            </Button>
            <Button onClick={warmupCache} disabled={isLoading} size="sm" variant="outline">
              <Zap className="h-4 w-4 mr-2" />
              Warmup Cache
            </Button>
            <Button onClick={clearCache} disabled={isLoading} size="sm" variant="outline">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
            <Button onClick={optimizeTables} disabled={isLoading} size="sm" variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Optimize Tables
            </Button>
            {userId && (
              <Button onClick={preloadData} disabled={isLoading} size="sm" variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Preload Data
              </Button>
            )}
          </div>

          <Tabs defaultValue="metrics" className="w-full">
            <TabsList>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="tables">Table Stats</TabsTrigger>
              <TabsTrigger value="queries">Slow Queries</TabsTrigger>
            </TabsList>

            <TabsContent value="metrics" className="space-y-4">
              {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Cache Hit Rate</p>
                          <p className={`text-2xl font-bold ${getPerformanceColor(metrics.cacheHitRate, { good: 80, warning: 60 })}`}>
                            {metrics.cacheHitRate.toFixed(1)}%
                          </p>
                        </div>
                        <Activity className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <Progress value={metrics.cacheHitRate} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Avg Query Time</p>
                          <p className={`text-2xl font-bold ${getPerformanceColor(metrics.averageQueryTime, { good: 100, warning: 500 })}`}>
                            {metrics.averageQueryTime.toFixed(1)}ms
                          </p>
                        </div>
                        <Database className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Memory Usage</p>
                          <p className={`text-2xl font-bold ${getPerformanceColor(metrics.memoryUsage, { good: 100, warning: 500 })}`}>
                            {metrics.memoryUsage.toFixed(1)}MB
                          </p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Connection Pool</p>
                          <p className={`text-2xl font-bold ${getPerformanceColor(metrics.connectionPoolUtilization, { good: 50, warning: 80 })}`}>
                            {metrics.connectionPoolUtilization.toFixed(1)}%
                          </p>
                        </div>
                        <Zap className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <Progress value={metrics.connectionPoolUtilization} className="mt-2" />
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tables" className="space-y-4">
              <div className="space-y-2">
                {tableStats.length === 0 ? (
                  <p className="text-gray-500">No table statistics available</p>
                ) : (
                  tableStats.map((table, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{table.table_name}</span>
                            <Badge variant="outline">{table.row_count.toLocaleString()} rows</Badge>
                          </div>
                          <div className="flex gap-4 text-sm text-gray-500">
                            <span>Table: {table.table_size}</span>
                            <span>Index: {table.index_size}</span>
                            <span>Total: {table.total_size}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="queries" className="space-y-4">
              <div className="space-y-2">
                {slowQueries.length === 0 ? (
                  <p className="text-gray-500">No slow queries found</p>
                ) : (
                  slowQueries.map((query, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Query #{index + 1}</span>
                          <div className="flex gap-2">
                            <Badge variant="outline">{query.calls} calls</Badge>
                            <Badge variant="destructive">{query.mean_time.toFixed(2)}ms avg</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                          {formatQuery(query.query)}
                        </p>
                        <div className="flex gap-4 text-sm text-gray-500">
                          <span>Total time: {query.total_time.toFixed(2)}ms</span>
                          <span>Rows: {query.rows.toLocaleString()}</span>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
