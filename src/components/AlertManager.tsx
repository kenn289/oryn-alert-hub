"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Badge } from "../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { 
  Bell, 
  Plus, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Newspaper,
  CheckCircle,
  Clock
} from "lucide-react"
import { toast } from "sonner"
import { alertService, Alert } from "../lib/alert-service"
import { useCurrency } from "../contexts/CurrencyContext"

export function AlertManager() {
  const { selectedTimezone } = useCurrency()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newAlert, setNewAlert] = useState({
    symbol: '',
    type: 'price_above' as Alert['type'],
    condition: '',
    value: ''
  })

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = () => {
    try {
      const allAlerts = alertService.getAlerts()
      setAlerts(allAlerts)
    } catch (error) {
      console.error('Error loading alerts:', error)
      toast.error('Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAlert = () => {
    toast.info('🚧 Alert creation feature is not yet released. Coming soon!')
    return
  }

  const handleDeleteAlert = (id: string) => {
    if (alertService.deleteAlert(id)) {
      setAlerts(alerts.filter(alert => alert.id !== id))
    }
  }

  const handleToggleAlert = (id: string) => {
    if (alertService.toggleAlert(id)) {
      loadAlerts() // Reload to get updated state
    }
  }

  const getConditionText = (type: Alert['type'], value: number): string => {
    switch (type) {
      case 'price_above':
        return `Price above $${value.toFixed(2)}`
      case 'price_below':
        return `Price below $${value.toFixed(2)}`
      case 'volume_spike':
        return `Volume spike detected`
      case 'earnings':
        return `Earnings announcement`
      case 'news':
        return `News alert`
      default:
        return 'Unknown condition'
    }
  }

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'price_above':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'price_below':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'volume_spike':
        return <Activity className="h-4 w-4 text-blue-500" />
      case 'earnings':
        return <Calendar className="h-4 w-4 text-purple-500" />
      case 'news':
        return <Newspaper className="h-4 w-4 text-orange-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getAlertTypeLabel = (type: Alert['type']) => {
    switch (type) {
      case 'price_above':
        return 'Price Above'
      case 'price_below':
        return 'Price Below'
      case 'volume_spike':
        return 'Volume Spike'
      case 'earnings':
        return 'Earnings'
      case 'news':
        return 'News'
      default:
        return 'Unknown'
    }
  }

  const stats = alertService.getStats()

  if (loading) {
    return (
      <Card className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading alerts...</span>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Alert Manager
          </h2>
          <p className="text-muted-foreground">
            Set up price alerts and notifications for your stocks
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Alert
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Alerts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-500">{stats.active}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-500">{stats.triggered}</div>
            <div className="text-sm text-muted-foreground">Triggered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
      </div>

      {/* Create Alert Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Alert</CardTitle>
            <CardDescription>Set up a price alert for any stock symbol</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="symbol">Stock Symbol *</Label>
                <Input
                  id="symbol"
                  value={newAlert.symbol}
                  onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value.toUpperCase() })}
                  placeholder="e.g., AAPL"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Alert Type *</Label>
                <select
                  id="type"
                  value={newAlert.type}
                  onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value as Alert['type'] })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:border-primary focus:ring-primary/20"
                >
                  <option value="price_above">Price Above</option>
                  <option value="price_below">Price Below</option>
                  <option value="volume_spike">Volume Spike</option>
                  <option value="earnings">Earnings</option>
                  <option value="news">News</option>
                </select>
              </div>
              <div>
                <Label htmlFor="value">Price Value *</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newAlert.value}
                  onChange={(e) => setNewAlert({ ...newAlert, value: e.target.value })}
                  placeholder="e.g., 150.00"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateAlert}>
                Create Alert
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Alerts</CardTitle>
          <CardDescription>
            {alerts.length === 0 
              ? "No alerts created yet. Create your first alert to get started!"
              : `${alerts.length} alert${alerts.length === 1 ? '' : 's'} configured`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No alerts configured yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <div className="font-medium">{alert.symbol}</div>
                      <div className="text-sm text-muted-foreground">{alert.condition}</div>
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(alert.createdAt).toLocaleDateString('en-US', { timeZone: selectedTimezone })}
                        {alert.triggeredAt && (
                          <span className="text-green-600 ml-2">
                            • Triggered: {new Date(alert.triggeredAt).toLocaleDateString('en-US', { timeZone: selectedTimezone })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.isActive ? 'default' : 'secondary'}>
                      {alert.isActive ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                    <Badge variant="outline">
                      {getAlertTypeLabel(alert.type)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleAlert(alert.id)}
                    >
                      {alert.isActive ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
