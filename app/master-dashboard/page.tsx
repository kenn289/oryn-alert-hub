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
  Crown, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Mail,
  UserPlus,
  Shield,
  TrendingUp,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Star,
  Calendar,
  Mail as MailIcon,
  DollarSign,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../src/contexts/AuthContext'
import { realtimeSupportService } from '../../src/lib/realtime-support-service'
import { RealtimeStatus } from '../../src/components/RealtimeStatus'
import { realtimeNotificationService } from '../../src/lib/realtime-notifications'
import { RevenueAnalyticsDashboard } from '../../src/components/RevenueAnalyticsDashboard'

interface User {
  id: string
  email: string
  plan: 'free' | 'pro' | 'master'
  created_at: string
  last_login?: string
  is_active: boolean
}

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

export default function MasterDashboard() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [resolution, setResolution] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPlan, setFilterPlan] = useState('all')
  const [notificationTitle, setNotificationTitle] = useState('')
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState('info')
  const [isSendingNotification, setIsSendingNotification] = useState(false)

  // Check if user is master account
  const isMasterAccount = user?.email === 'kennethoswin289@gmail.com'

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/auth'
      return
    }
  }, [user, loading])

  useEffect(() => {
    if (isMasterAccount) {
      loadMasterData()
    }
  }, [isMasterAccount])

  const loadMasterData = async () => {
    try {
      setLoading(true)
      const [usersResponse, ticketsResponse] = await Promise.all([
        fetch('/api/master/users'),
        fetch('/api/master/tickets')
      ])
      
      // Handle users data with better error handling
      let usersData = []
      if (usersResponse.ok) {
        const usersResult = await usersResponse.json()
        usersData = Array.isArray(usersResult) ? usersResult : []
      } else {
        console.error('Failed to fetch users:', usersResponse.status)
        const errorData = await usersResponse.json().catch(() => ({}))
        console.error('Error details:', errorData)
        
        // Show user-friendly error message
        if (usersResponse.status === 503) {
          toast.error('Database setup required. Please contact support.')
        } else {
          toast.error('Failed to load users data')
        }
      }
      
      // Handle tickets data with better error handling
      let ticketsData = []
      if (ticketsResponse.ok) {
        const ticketsResult = await ticketsResponse.json()
        ticketsData = Array.isArray(ticketsResult) ? ticketsResult : []
      } else {
        console.error('Failed to fetch tickets:', ticketsResponse.status)
        const errorData = await ticketsResponse.json().catch(() => ({}))
        console.error('Error details:', errorData)
        
        // Show user-friendly error message
        if (ticketsResponse.status === 503) {
          toast.error('Database setup required. Please contact support.')
        } else {
          toast.error('Failed to load tickets data')
        }
      }
      
      setUsers(usersData)
      setTickets(ticketsData)
    } catch (error) {
      console.error('Error loading master data:', error)
      toast.error('Failed to load master data')
      // Ensure arrays are set even on error
      setUsers([])
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  const updateUserPlan = async (userId: string, newPlan: string) => {
    try {
      const response = await fetch(`/api/master/users/${userId}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan })
      })

      if (response.ok) {
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, plan: newPlan as any } : u
        ))
        toast.success(`User plan updated to ${newPlan.toUpperCase()}`)
        
        // Send real-time notification
        const user = users.find(u => u.id === userId)
        if (user) {
          realtimeNotificationService.sendUserPlanChange(user.email, newPlan)
        }
        
        // Trigger real-time update
        realtimeSupportService.refresh()
        
        // Force refresh the user's subscription status
        console.log('🔄 Plan updated, user will see changes on next page refresh')
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to update user plan:', errorData)
        toast.error(`Failed to update user plan: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      toast.error('Failed to update user plan')
    }
  }

  const updateTicketStatus = async (ticketId: string, status: string, resolution?: string) => {
    try {
      const response = await fetch(`/api/master/tickets/${ticketId}`, {
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
        
        // Send real-time notification
        const ticket = tickets.find(t => t.id === ticketId)
        if (ticket) {
          realtimeNotificationService.sendTicketUpdate(ticketId, status, ticket.user_email)
        }
        
        // Trigger real-time update
        realtimeSupportService.refresh()
      } else {
        toast.error('Failed to update ticket')
      }
    } catch (error) {
      toast.error('Failed to update ticket')
    }
  }

  const sendBulkNotification = async () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      toast.error('Please fill in both title and message')
      return
    }

    try {
      setIsSendingNotification(true)
      
      const response = await fetch('/api/master/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: notificationTitle,
          message: notificationMessage,
          type: notificationType
        })
      })

      if (response.ok) {
        toast.success('Notification sent to all users')
        setNotificationTitle('')
        setNotificationMessage('')
        setNotificationType('info')
        
        // Trigger real-time update
        realtimeSupportService.refresh()
      } else {
        toast.error('Failed to send notification')
      }
    } catch (error) {
      toast.error('Failed to send notification')
    } finally {
      setIsSendingNotification(false)
    }
  }

  // Filter functions
  const filteredUsers = (Array.isArray(users) ? users : []).filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPlan = filterPlan === 'all' || user.plan === filterPlan
    return matchesSearch && matchesPlan
  })

  const filteredTickets = (Array.isArray(tickets) ? tickets : []).filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.user_email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="page-background flex items-center justify-center p-4">
        <div className="relative z-10">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Checking authentication...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="page-background flex items-center justify-center p-4">
        <div className="relative z-10">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
                <p className="text-muted-foreground mb-4">
                  Please log in to access this dashboard.
                </p>
                <Button onClick={() => window.location.href = '/auth'}>
                  Go to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
                <Button onClick={() => window.location.href = '/dashboard'} className="mt-4">
                  Go to Dashboard
                </Button>
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
                <p>Loading master dashboard...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-transparent animate-pulse-glow" />
      
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00d4aa08_1px,transparent_1px),linear-gradient(to_bottom,#00d4aa08_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      
      {/* Floating elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-float" />
      <div className="absolute bottom-20 right-20 w-24 h-24 bg-secondary/10 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-accent/10 rounded-full blur-lg animate-float" style={{ animationDelay: '2s' }} />
      
      <div className="pt-20 relative z-10 max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4 animate-slide-in">
              <div className="p-4 bg-gradient-to-r from-primary to-secondary rounded-xl shadow-lg animate-pulse-glow">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                  Master
                  <span className="block gradient-text animate-gradient-shift">Dashboard</span>
                </h1>
                <p className="text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  Manage users, tickets, and system operations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium backdrop-blur-sm">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                Live Updates
              </div>
              <RealtimeStatus />
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="card-hover animate-scale-in bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 group" style={{ animationDelay: '0.1s' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary/80">Total Users</p>
                    <p className="text-3xl font-bold text-primary">{users.length}</p>
                  </div>
                  <div className="p-3 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-colors">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover animate-scale-in bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20 group" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-500/80">Open Tickets</p>
                    <p className="text-3xl font-bold text-orange-500">{tickets.filter(t => t.status === 'open').length}</p>
                  </div>
                  <div className="p-3 bg-orange-500/20 rounded-lg group-hover:bg-orange-500/30 transition-colors">
                    <MessageSquare className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover animate-scale-in bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 group" style={{ animationDelay: '0.3s' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-500/80">Pro Users</p>
                    <p className="text-3xl font-bold text-green-500">{users.filter(u => u.plan === 'pro').length}</p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover animate-scale-in bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20 group" style={{ animationDelay: '0.4s' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-500/80">Resolved</p>
                    <p className="text-3xl font-bold text-purple-500">{tickets.filter(t => t.status === 'resolved').length}</p>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                    <TrendingUp className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg">
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-500 data-[state=active]:border-green-500/30">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/30">
              <Users className="h-4 w-4" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500 data-[state=active]:border-orange-500/30">
              <MessageSquare className="h-4 w-4" />
              Tickets ({tickets.length})
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-500 data-[state=active]:border-purple-500/30">
              <Mail className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <RevenueAnalyticsDashboard />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="card-hover bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription className="text-muted-foreground">Manage user accounts and plans</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {/* Search and Filter */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users by email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <select
                    value={filterPlan}
                    onChange={(e) => setFilterPlan(e.target.value)}
                    className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:border-primary focus:ring-primary/20 min-w-[120px]"
                  >
                    <option value="all">All Plans</option>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="master">Master</option>
                  </select>
                </div>

                {/* Users List */}
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-background/50 backdrop-blur-sm hover:bg-background/80">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-full">
                              <MailIcon className="h-4 w-4 text-primary" />
                            </div>
                            <h3 className="font-semibold text-foreground">{user.email}</h3>
                            <Badge variant={user.plan === 'master' ? 'default' : 
                                           user.plan === 'pro' ? 'secondary' : 'outline'}
                                   className={user.plan === 'master' ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' : 
                                            user.plan === 'pro' ? 'bg-green-500/20 text-green-600 border-green-500/30' : 
                                            'bg-muted/20 text-muted-foreground border-border'}>
                              {user.plan}
                            </Badge>
                            {user.is_active ? (
                              <Badge variant="secondary" className="text-green-600 bg-green-500/20 border-green-500/30">Active</Badge>
                            ) : (
                              <Badge variant="outline" className="text-red-600 bg-red-500/20 border-red-500/30">Inactive</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground ml-8">
                            <p>Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                            {user.last_login && (
                              <p>Last Login: {new Date(user.last_login).toLocaleDateString()}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={user.plan}
                            onChange={(e) => updateUserPlan(user.id, e.target.value)}
                            className="px-3 py-1 border border-border rounded-md text-sm bg-background text-foreground focus:border-primary focus:ring-primary/20"
                          >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="master">Master</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <Card className="card-hover bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-500/10 to-orange-500/5 border-b border-orange-500/20">
                <CardTitle className="flex items-center gap-2 text-orange-500">
                  <MessageSquare className="h-5 w-5" />
                  Support Tickets
                </CardTitle>
                <CardDescription className="text-muted-foreground">Manage and respond to support tickets</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {/* Search and Filter */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tickets by subject or user..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:border-primary focus:ring-primary/20 min-w-[120px]"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Tickets List */}
                <div className="space-y-4">
                  {filteredTickets.map((ticket) => (
                    <div key={ticket.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-background/50 backdrop-blur-sm hover:bg-background/80">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-foreground">{ticket.subject}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant={ticket.priority === 'urgent' ? 'destructive' : 
                                         ticket.priority === 'high' ? 'default' : 'secondary'}
                                 className={ticket.priority === 'urgent' ? 'bg-red-500/20 text-red-600 border-red-500/30' : 
                                          ticket.priority === 'high' ? 'bg-orange-500/20 text-orange-600 border-orange-500/30' : 
                                          'bg-muted/20 text-muted-foreground border-border'}>
                            {ticket.priority}
                          </Badge>
                          <Badge variant={ticket.status === 'open' ? 'destructive' : 
                                         ticket.status === 'resolved' ? 'secondary' : 'default'}
                                 className={ticket.status === 'open' ? 'bg-red-500/20 text-red-600 border-red-500/30' : 
                                          ticket.status === 'resolved' ? 'bg-green-500/20 text-green-600 border-green-500/30' : 
                                          ticket.status === 'in_progress' ? 'bg-blue-500/20 text-blue-600 border-blue-500/30' : 
                                          'bg-muted/20 text-muted-foreground border-border'}>
                            {ticket.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{ticket.description}</p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>From: {ticket.user_email}</span>
                        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedTicket(ticket)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Respond
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                          className="border-border hover:bg-muted"
                        >
                          Mark In Progress
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateTicketStatus(ticket.id, 'resolved')}
                          className="border-border hover:bg-muted"
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

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="card-hover bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 to-purple-500/5 border-b border-purple-500/20">
                <CardTitle className="flex items-center gap-2 text-purple-500">
                  <Mail className="h-5 w-5" />
                  Send Notifications
                </CardTitle>
                <CardDescription className="text-muted-foreground">Send notifications to all users or specific groups</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="notification-title" className="text-sm font-medium text-foreground">Title</Label>
                      <Input
                        id="notification-title"
                        value={notificationTitle}
                        onChange={(e) => setNotificationTitle(e.target.value)}
                        placeholder="Enter notification title..."
                        className="border-border focus:border-primary focus:ring-primary/20 bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notification-type" className="text-sm font-medium text-foreground">Type</Label>
                      <select
                        id="notification-type"
                        value={notificationType}
                        onChange={(e) => setNotificationType(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background/50 focus:border-primary focus:ring-primary/20"
                      >
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="success">Success</option>
                        <option value="error">Error</option>
                        <option value="announcement">Announcement</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notification-message" className="text-sm font-medium text-foreground">Message</Label>
                    <Textarea
                      id="notification-message"
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      placeholder="Enter your notification message..."
                      className="border-border focus:border-primary focus:ring-primary/20 bg-background/50"
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center justify-between p-6 bg-primary/5 rounded-lg border border-primary/20 backdrop-blur-sm">
                    <div>
                      <h4 className="font-semibold text-foreground">Send to All Users</h4>
                      <p className="text-sm text-muted-foreground mt-1">This will send the notification to all {users.length} registered users</p>
                    </div>
                    <Button
                      onClick={sendBulkNotification}
                      disabled={isSendingNotification || !notificationTitle.trim() || !notificationMessage.trim()}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 micro-interaction hover-lift"
                    >
                      {isSendingNotification ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Send to All Users
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Ticket Response Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="w-full max-w-md bg-background/95 backdrop-blur-sm border border-border/50 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20">
                <CardTitle className="text-primary">Respond to Ticket</CardTitle>
                <CardDescription className="text-muted-foreground">{selectedTicket.subject}</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="resolution" className="text-foreground">Resolution</Label>
                    <Textarea
                      id="resolution"
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="Enter your response..."
                      className="mt-1 border-border focus:border-primary focus:ring-primary/20 bg-background/50"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => updateTicketStatus(selectedTicket.id, 'resolved', resolution)}
                      disabled={!resolution.trim()}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Resolve Ticket
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedTicket(null)}
                      className="border-border hover:bg-muted"
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

