"use client"

import { useState, useEffect } from 'react'
import { Bell, X, CheckCircle, MessageSquare, UserPlus, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'
import { ClearNotificationsDialog } from '../components/ConfirmationDialog'
import { realtimeSupportService } from '../lib/realtime-support-service'
import { simpleNotificationService } from '../lib/simple-notification-service'

interface Notification {
  id: string
  type: 'ticket_created' | 'ticket_resolved' | 'user_joined' | 'alert_triggered' | 'plan_updated'
  title: string
  message: string
  read: boolean
  created_at: string
}

export function NotificationCenter() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

  // Set up real-time updates
  useEffect(() => {
    if (!user) return

    const unsubscribe = realtimeSupportService.subscribe(() => {
      loadNotifications()
    })

    return () => {
      unsubscribe()
    }
  }, [user])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      
      // Try API first, fallback to simple service
      try {
        const response = await fetch(`/api/notifications?userId=${user?.id}`)
        if (response.ok) {
          const data = await response.json()
          setNotifications(data)
          return
        }
      } catch (apiError) {
        console.log('API not available, using simple notifications')
      }
      
      // Fallback to simple notification service
      // Use static import instead of dynamic import
      const data = await simpleNotificationService.getNotifications(user?.id || '')
      setNotifications(data)
    } catch (error) {
      console.error('Error loading notifications:', error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      // Try API first
      try {
        const response = await fetch(`/api/notifications/${notificationId}/read`, {
          method: 'PUT'
        })
        
        if (response.ok) {
          setNotifications(prev => 
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
          )
          return
        }
      } catch (apiError) {
        console.log('API not available, using simple service')
      }
      
      // Fallback to simple service
      // Use static import instead of dynamic import
      await simpleNotificationService.markAsRead(notificationId)
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      // Try API first
      try {
        const response = await fetch(`/api/notifications/read-all?userId=${user?.id}`, {
          method: 'PUT'
        })
        
        if (response.ok) {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })))
          return
        }
      } catch (apiError) {
        console.log('API not available, using simple service')
      }
      
      // Fallback to simple service
      // Use static import instead of dynamic import
      await simpleNotificationService.markAllAsRead(user?.id || '')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      
      // Trigger real-time update
      realtimeSupportService.refresh()
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const handleClearAll = () => {
    setShowClearDialog(true)
  }

  const clearAllNotifications = async () => {
    try {
      setIsClearing(true)
      console.log('🗑️ Starting to clear all notifications...')
      
      // Try API first
      try {
        const response = await fetch(`/api/notifications/clear-all?userId=${user?.id}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          console.log('✅ API clear successful')
          setNotifications([])
          toast.success('All notifications cleared')
          setShowClearDialog(false)
          return
        }
      } catch (apiError) {
        console.log('API not available, using simple service')
      }
      
      // Fallback to simple service
      // Use static import instead of dynamic import
      await simpleNotificationService.clearAllNotifications(user?.id || '')
      
      // Force reload notifications to get empty array
      await loadNotifications()
      
      toast.success('All notifications cleared')
      setShowClearDialog(false)
      
      // Trigger real-time update
      realtimeSupportService.refresh()
    } catch (error) {
      console.error('Error clearing all notifications:', error)
      toast.error('Failed to clear notifications')
    } finally {
      setIsClearing(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ticket_created':
        return <MessageSquare className="h-4 w-4 text-orange-500" />
      case 'ticket_resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'user_joined':
        return <UserPlus className="h-4 w-4 text-blue-500" />
      case 'alert_triggered':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'plan_updated':
        return <CheckCircle className="h-4 w-4 text-purple-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (!user) return null

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop for click-outside-to-close */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] sm:max-w-80 bg-white border rounded-lg shadow-lg z-50"
            style={{
              right: '0',
              transform: 'translateX(0)',
              maxHeight: 'calc(100vh - 8rem)',
              // Ensure it doesn't overflow on small screens
              left: 'auto',
              maxWidth: 'min(320px, calc(100vw - 2rem))',
            }}
            onClick={(e) => e.stopPropagation()}
          >
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notifications</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadNotifications}
                    disabled={loading}
                    className="text-xs"
                    title="Refresh notifications"
                  >
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAll}
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      🗑️ Clear all
                    </Button>
                  )}
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      Mark all read
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b last:border-b-0 cursor-pointer transition-colors duration-200 ${
                        !notification.read 
                          ? 'bg-slate-50 border-l-4 border-l-blue-500 hover:bg-slate-100' 
                          : 'bg-white hover:bg-slate-50'
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            !notification.read ? 'text-slate-900' : 'text-slate-600'
                          }`}>
                            {notification.title}
                          </p>
                          <p className={`text-sm ${
                            !notification.read ? 'text-slate-700' : 'text-slate-500'
                          }`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="flex-shrink-0">
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </>
      )}

      {/* Beautiful Web UI Confirmation Dialog */}
      <ClearNotificationsDialog
        isOpen={showClearDialog}
        onClose={() => setShowClearDialog(false)}
        onConfirm={clearAllNotifications}
        isLoading={isClearing}
      />
    </div>
  )
}
