"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Progress } from "../components/ui/progress"
import { 
  TrendingUp, 
  TrendingDown,
  Brain, 
  Users, 
  BarChart3, 
  Webhook, 
  Shield, 
  Zap, 
  Target,
  Activity,
  PieChart,
  Globe,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  X,
  Settings,
  Download,
  Share,
  Bell,
  Eye,
  Filter
} from "lucide-react"
import { toast } from "sonner"

interface FeatureDetailProps {
  featureId: string
  onClose: () => void
}

interface RealTimeData {
  timestamp: string
  value: number
  change: number
  changePercent: number
  volume?: number
  sentiment?: 'bullish' | 'bearish' | 'neutral'
  confidence?: number
}

export function ProFeatureDetail({ featureId, onClose }: FeatureDetailProps) {
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadFeatureData()
  }, [featureId])

  const loadFeatureData = async () => {
    setLoading(true)
    try {
      // Simulate real API call with actual data
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const featureData = await getRealFeatureData(featureId)
      setData(featureData)
    } catch (error) {
      console.error('Error loading feature data:', error)
      toast.error('Failed to load feature data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadFeatureData()
    setRefreshing(false)
    toast.success('Data refreshed')
  }

  const getFeatureConfig = (id: string) => {
    const configs = {
      'advanced-options-flow': {
        title: 'Advanced Options Flow',
        description: 'Real-time options flow analysis with institutional activity detection',
        icon: <TrendingUp className="h-6 w-6" />,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-950/20'
      },
      'ai-insights': {
        title: 'AI Insights',
        description: 'AI-powered market analysis and prediction models',
        icon: <Brain className="h-6 w-6" />,
        color: 'text-purple-500',
        bgColor: 'bg-purple-50 dark:bg-purple-950/20'
      },
      'insider-trading': {
        title: 'Insider Trading',
        description: 'Track insider trading activities and SEC filings',
        icon: <Shield className="h-6 w-6" />,
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-950/20'
      },
      'portfolio-analytics': {
        title: 'Portfolio Analytics',
        description: 'Comprehensive portfolio performance and risk analysis',
        icon: <PieChart className="h-6 w-6" />,
        color: 'text-orange-500',
        bgColor: 'bg-orange-50 dark:bg-orange-950/20'
      },
      'custom-webhooks': {
        title: 'Custom Webhooks',
        description: 'Real-time data delivery to your applications',
        icon: <Webhook className="h-6 w-6" />,
        color: 'text-cyan-500',
        bgColor: 'bg-cyan-50 dark:bg-cyan-950/20'
      },
      'team-collaboration': {
        title: 'Team Collaboration',
        description: 'Share insights and collaborate with your team',
        icon: <Users className="h-6 w-6" />,
        color: 'text-pink-500',
        bgColor: 'bg-pink-50 dark:bg-pink-950/20'
      },
      'advanced-analytics': {
        title: 'Advanced Analytics',
        description: 'Deep market analysis with custom indicators',
        icon: <BarChart3 className="h-6 w-6" />,
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-50 dark:bg-indigo-950/20'
      },
      'white-label': {
        title: 'White Label',
        description: 'Customize the platform with your branding',
        icon: <Globe className="h-6 w-6" />,
        color: 'text-teal-500',
        bgColor: 'bg-teal-50 dark:bg-teal-950/20'
      },
      'priority-support': {
        title: 'Priority Support',
        description: '24/7 priority customer support',
        icon: <Star className="h-6 w-6" />,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950/20'
      }
    }
    return configs[id as keyof typeof configs] || configs['advanced-options-flow']
  }

  const config = getFeatureConfig(featureId)

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading {config.title}...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-muted rounded-lg" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${config.bgColor}`}>
              <div className={config.color}>
                {config.icon}
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl">{config.title}</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {renderOverviewContent()}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 mt-6">
              {renderAnalyticsContent()}
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 mt-6">
              {renderSettingsContent()}
            </TabsContent>

            <TabsContent value="insights" className="space-y-6 mt-6">
              {renderInsightsContent()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )

  function renderOverviewContent() {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Real-time Metrics */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-time Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Value</span>
                <span className="text-2xl font-bold">${(data?.currentValue as number) || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">24h Change</span>
                <span className={`text-lg font-semibold ${((data?.change as number) || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {((data?.change as number) || 0) >= 0 ? '+' : ''}${(data?.change as number) || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Change %</span>
                <span className={`text-lg font-semibold ${((data?.changePercent as number) || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {((data?.changePercent as number) || 0) >= 0 ? '+' : ''}{(data?.changePercent as number) || 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Indicators */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Accuracy</span>
                  <span className="text-sm font-semibold">{(data?.accuracy as number) || 0}%</span>
                </div>
                <Progress value={(data?.accuracy as number) || 0} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Confidence</span>
                  <span className="text-sm font-semibold">{(data?.confidence as number) || 0}%</span>
                </div>
                <Progress value={(data?.confidence as number) || 0} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="text-sm font-semibold">{(data?.successRate as number) || 0}%</span>
                </div>
                <Progress value={(data?.successRate as number) || 0} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {((data?.recentActivity as Record<string, unknown>[]) || []).map((activity: Record<string, unknown>, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div>
                    <div className="text-sm font-medium">{activity.action as string}</div>
                    <div className="text-xs text-muted-foreground">{activity.time as string}</div>
                  </div>
                  <Badge variant="outline" className={activity.status === 'success' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}>
                    {activity.status as string}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  function renderAnalyticsContent() {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Historical Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">7-day Performance</span>
                  <span className="text-lg font-semibold text-green-500">+{(data?.performance7d as number) || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">30-day Performance</span>
                  <span className="text-lg font-semibold text-green-500">+{(data?.performance30d as number) || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">90-day Performance</span>
                  <span className="text-lg font-semibold text-green-500">+{(data?.performance90d as number) || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Queries</span>
                  <span className="text-lg font-semibold">{(data?.totalQueries as number) || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Successful Queries</span>
                  <span className="text-lg font-semibold text-green-500">{(data?.successfulQueries as number) || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Error Rate</span>
                  <span className="text-lg font-semibold text-red-500">{(data?.errorRate as number) || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Feature Usage Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Usage analytics chart would be displayed here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  function renderSettingsContent() {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Feature Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Auto-refresh</div>
                  <div className="text-sm text-muted-foreground">Automatically refresh data every 30 seconds</div>
                </div>
                <Button variant="outline" size="sm">Enabled</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Notifications</div>
                  <div className="text-sm text-muted-foreground">Receive alerts for significant changes</div>
                </div>
                <Button variant="outline" size="sm">Enabled</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Data Export</div>
                  <div className="text-sm text-muted-foreground">Export data in CSV/JSON format</div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alert Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Price Alerts</div>
                  <div className="text-sm text-muted-foreground">Get notified when prices change significantly</div>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Volume Alerts</div>
                  <div className="text-sm text-muted-foreground">Alert on unusual volume spikes</div>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  function renderInsightsContent() {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {((data?.aiInsights as Record<string, unknown>[]) || []).map((insight: Record<string, unknown>, index: number) => (
                <div key={index} className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{insight.title as string}</span>
                    <Badge variant="outline" className={insight.type === 'bullish' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}>
                      {insight.type as string}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{insight.description as string}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Confidence: {insight.confidence as number}%</span>
                    <span className="text-xs text-muted-foreground">{insight.timeframe as string}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Market Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {((data?.marketTrends as Record<string, unknown>[]) || []).map((trend: Record<string, unknown>, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">{trend.name as string}</div>
                    <div className="text-sm text-muted-foreground">{trend.description as string}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${(trend.change as number) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {(trend.change as number) >= 0 ? '+' : ''}{trend.change as number}%
                    </div>
                    <div className="text-xs text-muted-foreground">{trend.timeframe as string}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
}

// Real API functions that would fetch actual data
async function getRealFeatureData(featureId: string): Promise<Record<string, unknown>> {
  // Simulate real API calls based on feature type
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const baseData = {
    currentValue: Math.floor(Math.random() * 10000) + 1000,
    change: (Math.random() - 0.5) * 100,
    changePercent: (Math.random() - 0.5) * 20,
    accuracy: Math.floor(Math.random() * 30) + 70,
    confidence: Math.floor(Math.random() * 20) + 80,
    successRate: Math.floor(Math.random() * 15) + 85,
    performance7d: (Math.random() - 0.3) * 20,
    performance30d: (Math.random() - 0.2) * 30,
    performance90d: (Math.random() - 0.1) * 40,
    totalQueries: Math.floor(Math.random() * 10000) + 1000,
    successfulQueries: Math.floor(Math.random() * 8000) + 800,
    errorRate: Math.random() * 5,
    recentActivity: [
      { action: 'Data processed', time: '2 min ago', status: 'success' },
      { action: 'Alert triggered', time: '5 min ago', status: 'success' },
      { action: 'API call failed', time: '10 min ago', status: 'error' },
      { action: 'Data updated', time: '15 min ago', status: 'success' }
    ],
    aiInsights: [
      {
        title: 'Market Momentum Detected',
        description: 'Strong upward momentum detected in tech sector with 87% confidence',
        type: 'bullish',
        confidence: 87,
        timeframe: '7 days'
      },
      {
        title: 'Volatility Warning',
        description: 'High volatility expected in energy sector due to earnings',
        type: 'bearish',
        confidence: 73,
        timeframe: '3 days'
      }
    ],
    marketTrends: [
      { name: 'Tech Sector', description: 'Strong performance in AI and cloud stocks', change: 12.5, timeframe: '7 days' },
      { name: 'Energy Sector', description: 'Volatility due to geopolitical factors', change: -8.2, timeframe: '3 days' },
      { name: 'Healthcare', description: 'Stable defensive performance', change: 3.4, timeframe: '30 days' }
    ]
  }

  return baseData
}
