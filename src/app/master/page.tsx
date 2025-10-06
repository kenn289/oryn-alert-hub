"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { 
  Users, 
  Ticket, 
  Crown, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Mail,
  Calendar,
  Star,
  Shield,
  Settings,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'
import { realtimeSupportService } from '../../lib/realtime-support-service'
import { NotificationGenerator } from '../../lib/notification-generator'

interface User {
  id: string
  email: string
  plan: 'free' | 'pro' | 'master'
  created_at: string
  last_login?: string
}

interface Ticket {
  id: string
  subject: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  category: string
  user_email: string
  created_at: string
  updated_at: string
  resolution?: string
}

export default function MasterDashboard() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [resolution, setResolution] = useState('')

  // Check if user is master
  const isMasterAccount = user?.email === 'kennethoswin289@gmail.com'

  useEffect(() => {
    if (isMasterAccount) {
      loadData()
    }
  }, [isMasterAccount])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load users
      const usersResponse = await fetch('/api/master/users')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData)
      }

      // Load tickets
      const ticketsResponse = await fetch('/api/master/tickets')
      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json()
        setTickets(ticketsData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
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
        
        // Create real-time notification
        const user = users.find(u => u.id === userId)
        if (user) {
          // Generate notification for the user whose plan was changed
          const notification = NotificationGenerator.generatePlanChanged(user.email, newPlan, userId)
          console.log('📧 Generated plan change notification:', notification)
        }
        
        // Trigger real-time update
        realtimeSupportService.refresh()
      } else {
        toast.error('Failed to update user plan')
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
        
        // Create real-time notification
        const ticket = tickets.find(t => t.id === ticketId)
        if (ticket) {
          // Generate notification for the user whose ticket was updated
          const notification = NotificationGenerator.generateTicketResolved(ticket, ticket.user_id)
          console.log('📧 Generated ticket resolution notification:', notification)
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

  // Filter functions
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPlan = filterPlan === 'all' || user.plan === filterPlan
    return matchesSearch && matchesPlan
  })

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.user_email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // Stats
  const totalUsers = users.length
  const proUsers = users.filter(u => u.plan === 'pro').length
  const masterUsers = users.filter(u => u.plan === 'master').length
  const openTickets = tickets.filter(t => t.status === 'open').length
  const resolvedTickets = tickets.filter(t => t.status === 'resolved').length

  if (!isMasterAccount) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-red-600">Access Denied</CardTitle>
            <CardDescription>
              This dashboard is only accessible to master accounts.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl">
              <Crown className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-800 bg-clip-text text-transparent">
                Master Dashboard
              </h1>
              <p className="text-lg text-gray-600">Manage users, tickets, and system operations</p>
            </div>
            <div className="ml-auto">
              <Button onClick={loadData} disabled={loading} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-600">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{totalUsers}</div>
                <p className="text-xs text-blue-600">Registered users</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">Pro Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{proUsers}</div>
                <p className="text-xs text-green-600">Premium subscribers</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-600">Open Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700">{openTickets}</div>
                <p className="text-xs text-purple-600">Pending resolution</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-600">Resolved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-700">{resolvedTickets}</div>
                <p className="text-xs text-orange-600">This month</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users ({totalUsers})
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Tickets ({tickets.length})
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage user accounts and subscription plans
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Search users by email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={filterPlan} onValueChange={setFilterPlan}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="master">Master</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Users List */}
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <Card key={user.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{user.email}</p>
                            <p className="text-sm text-gray-500">
                              Joined: {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={user.plan === 'master' ? 'default' : user.plan === 'pro' ? 'secondary' : 'outline'}
                            className={user.plan === 'master' ? 'bg-yellow-100 text-yellow-800' : 
                                     user.plan === 'pro' ? 'bg-green-100 text-green-800' : 
                                     'bg-gray-100 text-gray-800'}
                          >
                            {user.plan.toUpperCase()}
                          </Badge>
                          <Select
                            value={user.plan}
                            onValueChange={(newPlan) => updateUserPlan(user.id, newPlan)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                              <SelectItem value="master">Master</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Ticket Management
                </CardTitle>
                <CardDescription>
                  Handle support tickets and customer issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Search tickets by subject or user..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tickets List */}
                <div className="space-y-3">
                  {filteredTickets.map((ticket) => (
                    <Card key={ticket.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium">{ticket.subject}</h3>
                            <Badge 
                              variant={ticket.priority === 'urgent' ? 'destructive' : 
                                     ticket.priority === 'high' ? 'default' : 'secondary'}
                            >
                              {ticket.priority}
                            </Badge>
                            <Badge 
                              variant={ticket.status === 'resolved' ? 'default' : 
                                     ticket.status === 'closed' ? 'secondary' : 'outline'}
                            >
                              {ticket.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {ticket.user_email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            View
                          </Button>
                          <Select
                            value={ticket.status}
                            onValueChange={(status) => updateTicketStatus(ticket.id, status)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Ticket Details
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>
                    ×
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Subject</Label>
                  <p className="font-medium">{selectedTicket.subject}</p>
                </div>
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-gray-600">{selectedTicket.description}</p>
                </div>
                <div>
                  <Label>Resolution</Label>
                  <Textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Add resolution notes..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => updateTicketStatus(selectedTicket.id, 'resolved', resolution)}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolve Ticket
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTicket(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}