"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../src/components/ui/card'
import { Button } from '../../src/components/ui/button'
import { Badge } from '../../src/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../src/components/ui/tabs'
import { Input } from '../../src/components/ui/input'
import { Textarea } from '../../src/components/ui/textarea'
import { Label } from '../../src/components/ui/label'
import { 
  Users, 
  MessageSquare, 
  Bell, 
  Settings, 
  Crown, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Mail,
  UserPlus,
  Shield,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../src/contexts/AuthContext'

interface SupportTicket {
  id: string
  subject: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  user_email: string
  created_at: string
  updated_at: string
  resolution?: string
}

interface User {
  id: string
  email: string
  plan: 'free' | 'pro' | 'master'
  created_at: string
  last_login?: string
}

interface Notification {
  id: string
  type: 'ticket_created' | 'ticket_resolved' | 'user_joined' | 'alert_triggered'
  title: string
  message: string
  read: boolean
  created_at: string
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [resolution, setResolution] = useState('')
  const [loading, setLoading] = useState(true)

  // Check if user is master account
  const isMasterAccount = user?.email === 'kennethoswin289@gmail.com' // Replace with your actual email

  useEffect(() => {
    if (isMasterAccount) {
      loadAdminData()
    }
  }, [isMasterAccount])

  const loadAdminData = async () => {
    try {
      setLoading(true)
      // Load tickets, users, and notifications
      const [ticketsData, usersData, notificationsData] = await Promise.all([
        fetch('/api/admin/tickets').then(res => res.json()).catch(() => []),
        fetch('/api/admin/users').then(res => res.json()).catch(() => []),
        fetch('/api/admin/notifications').then(res => res.json()).catch(() => [])
      ])
      
      setTickets(ticketsData)
      setUsers(usersData)
      setNotifications(notificationsData)
    } catch (error) {
      console.error('Error loading admin data:', error)
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const updateTicketStatus = async (ticketId: string, status: string, resolution?: string) => {
    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolution })
      })

      if (response.ok) {
        setTickets(prev => prev.map(t => 
          t.id === ticketId ? { ...t, status, resolution } : t
        ))
        toast.success('Ticket updated successfully')
        setSelectedTicket(null)
        setResolution('')
      } else {
        toast.error('Failed to update ticket')
      }
    } catch (error) {
      toast.error('Failed to update ticket')
    }
  }

  const updateUserPlan = async (userId: string, newPlan: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan })
      })

      if (response.ok) {
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, plan: newPlan as any } : u
        ))
        toast.success('User plan updated successfully')
      } else {
        toast.error('Failed to update user plan')
      }
    } catch (error) {
      toast.error('Failed to update user plan')
    }
  }

  if (!isMasterAccount) {
    return (
      <div className="page-background flex items-center justify-center p-4">
        <div className="relative z-10">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Access Denied</h2>
                <p className="text-muted-foreground">
                  This is a master account only area. You need master privileges to access this dashboard.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page-background flex items-center justify-center p-4">
        <div className="relative z-10">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading admin dashboard...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="page-background p-4">
      <div className="pt-20 relative z-10 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Master Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, tickets, and system notifications</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold">{users.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <MessageSquare className="h-8 w-8 text-orange-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Open Tickets</p>
                      <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'open').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Bell className="h-8 w-8 text-green-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Unread Notifications</p>
                      <p className="text-2xl font-bold">{notifications.filter(n => !n.read).length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Crown className="h-8 w-8 text-purple-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Pro Users</p>
                      <p className="text-2xl font-bold">{users.filter(u => u.plan === 'pro').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {notification.type === 'ticket_created' && <MessageSquare className="h-5 w-5 text-orange-500" />}
                        {notification.type === 'ticket_resolved' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {notification.type === 'user_joined' && <UserPlus className="h-5 w-5 text-blue-500" />}
                        {notification.type === 'alert_triggered' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>Manage and respond to support tickets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{ticket.subject}</h3>
                        <div className="flex items-center space-x-2">
                          <Badge variant={ticket.priority === 'urgent' ? 'destructive' : 
                                         ticket.priority === 'high' ? 'default' : 'secondary'}>
                            {ticket.priority}
                          </Badge>
                          <Badge variant={ticket.status === 'open' ? 'destructive' : 
                                         ticket.status === 'resolved' ? 'secondary' : 'default'}>
                            {ticket.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{ticket.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span>From: {ticket.user_email}</span>
                        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          Respond
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                        >
                          Mark In Progress
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateTicketStatus(ticket.id, 'resolved')}
                        >
                          Resolve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user plans and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{user.email}</h3>
                          <p className="text-sm text-muted-foreground">
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={user.plan === 'master' ? 'default' : 
                                         user.plan === 'pro' ? 'secondary' : 'outline'}>
                            {user.plan}
                          </Badge>
                          <div className="flex space-x-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateUserPlan(user.id, 'free')}
                              disabled={user.plan === 'free'}
                            >
                              Free
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateUserPlan(user.id, 'pro')}
                              disabled={user.plan === 'pro'}
                            >
                              Pro
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Notifications</CardTitle>
                <CardDescription>Manage system-wide notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div key={notification.id} className={`border rounded-lg p-4 ${!notification.read ? 'bg-blue-50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {notification.type === 'ticket_created' && <MessageSquare className="h-5 w-5 text-orange-500" />}
                          {notification.type === 'ticket_resolved' && <CheckCircle className="h-5 w-5 text-green-500" />}
                          {notification.type === 'user_joined' && <UserPlus className="h-5 w-5 text-blue-500" />}
                          {notification.type === 'alert_triggered' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                          <div>
                            <h3 className="font-semibold">{notification.title}</h3>
                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Ticket Response Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Respond to Ticket</CardTitle>
                <CardDescription>{selectedTicket.subject}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="resolution">Resolution</Label>
                    <Textarea
                      id="resolution"
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="Enter your response..."
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => updateTicketStatus(selectedTicket.id, 'resolved', resolution)}
                      disabled={!resolution.trim()}
                    >
                      Resolve Ticket
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedTicket(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
