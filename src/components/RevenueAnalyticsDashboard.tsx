"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Calendar,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'

interface RevenueAnalytics {
  totalRevenue: number
  totalUsers: number
  activeSubscriptions: number
  monthlyRevenue: number
  revenueByPlan: { [plan: string]: number }
  recentPayments: Array<{
    id: string
    user_id: string
    plan: string
    amount: number
    currency: string
    paid_at: string
    user_name?: string
    user_email?: string
  }>
  revenueGrowth: {
    thisMonth: number
    lastMonth: number
    growthPercentage: number
  }
  subscriptionStats: {
    newThisMonth: number
    cancelledThisMonth: number
    renewalRate: number
  }
}

interface ChartData {
  date: string
  revenue: number
  users: number
}

export function RevenueAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadAnalytics = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/analytics/revenue?days=30')
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      
      const data = await response.json()
      setAnalytics(data.analytics)
      setChartData(data.chartData)
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Failed to load revenue analytics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading revenue analytics...</span>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No analytics data available</p>
        <Button onClick={loadAnalytics} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Revenue Analytics</h2>
          <p className="text-muted-foreground">
            Track your subscription revenue and user growth
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadAnalytics}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.monthlyRevenue)}
            </div>
            <div className="flex items-center text-xs">
              {analytics.revenueGrowth.growthPercentage >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={analytics.revenueGrowth.growthPercentage >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(analytics.revenueGrowth.growthPercentage).toFixed(1)}% vs last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.subscriptionStats.newThisMonth} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.subscriptionStats.renewalRate.toFixed(1)}% renewal rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Plan</CardTitle>
            <CardDescription>Breakdown of revenue by subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.revenueByPlan).map(([plan, revenue]) => (
                <div key={plan} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="capitalize">
                      {plan}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(revenue)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {((revenue / analytics.totalRevenue) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Stats</CardTitle>
            <CardDescription>Monthly subscription activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">New Subscriptions</span>
                <Badge variant="default" className="bg-green-500">
                  {analytics.subscriptionStats.newThisMonth}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cancellations</span>
                <Badge variant="destructive">
                  {analytics.subscriptionStats.cancelledThisMonth}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Renewal Rate</span>
                <Badge variant="outline">
                  {analytics.subscriptionStats.renewalRate.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Latest successful payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.recentPayments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No recent payments found
              </p>
            ) : (
              analytics.recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {payment.user_name || payment.user_email || 'Unknown User'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {payment.plan.toUpperCase()} Plan
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(payment.amount, payment.currency)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(payment.paid_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
