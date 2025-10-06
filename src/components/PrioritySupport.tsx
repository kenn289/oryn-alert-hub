"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Label } from "../components/ui/label"
import { Badge } from "../components/ui/badge"
import { Mail, Clock, Star, MessageSquare, Send, CheckCircle, RefreshCw, Wifi, WifiOff } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "../contexts/AuthContext"
import { supportService, SupportTicket, SupportStats } from "../lib/support-service"
import { realtimeSupportService } from "../lib/realtime-support-service"
import { TicketRatingModal } from "../components/TicketRatingModal"

interface PrioritySupportProps {
  userPlan?: {
    name: string
    maxWatchlistItems: number
    maxAlerts: number
    maxOptionsFlow: number
    maxPortfolioAnalytics: number
    maxCustomWebhooks: number
    maxTeamMembers: number
    features: {
      watchlist: { enabled: boolean; unlimited: boolean }
      priceAlerts: { enabled: boolean; unlimited: boolean }
      emailNotifications: { enabled: boolean; unlimited: boolean }
      basicOptionsFlow: { enabled: boolean; unlimited: boolean }
      advancedOptionsFlow: { enabled: boolean; unlimited: boolean }
      portfolioAnalytics: { enabled: boolean; unlimited: boolean }
      customWebhooks: { enabled: boolean; unlimited: boolean }
      teamCollaboration: { enabled: boolean; unlimited: boolean }
      prioritySupport: { enabled: boolean; unlimited: boolean }
      aiInsights: { enabled: boolean; unlimited: boolean }
    }
  }
  subscriptionStatus?: {
    hasActiveSubscription: boolean
    plan: string | null
    isTrial: boolean
    trialEndsAt: string | null
    isExpired: boolean
    daysRemaining: number | null
    isMasterAccount: boolean
  }
}

export function PrioritySupport({ userPlan, subscriptionStatus }: PrioritySupportProps) {
  const { user } = useAuth()
  const [isContactFormOpen, setIsContactFormOpen] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'medium'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [stats, setStats] = useState<SupportStats>({
    openTickets: 0,
    resolvedThisMonth: 0,
    averageResponseTime: 0,
    customerRating: 0,
    totalTickets: 0
  })
  const [loading, setLoading] = useState(true)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [selectedTicketForRating, setSelectedTicketForRating] = useState<SupportTicket | null>(null)

  // Check if user can submit tickets (Pro/Master only)
  const canSubmitTickets = userPlan?.name === 'pro' || userPlan?.name === 'master' || subscriptionStatus?.isMasterAccount

  // Load tickets and stats
  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  // Set up real-time updates
  useEffect(() => {
    const unsubscribe = realtimeSupportService.subscribe(() => {
      if (user) {
        loadData()
      }
    })

    setIsRealtimeConnected(realtimeSupportService.getConnectionStatus())

    return () => {
      unsubscribe()
    }
  }, [user])

  const loadData = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Add a small delay to ensure API is ready
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Try to load data, but don't fail if APIs are down
      const ticketsPromise = supportService.getTickets(user.id).catch((error) => {
        console.warn('Failed to load tickets:', error)
        return []
      })
      
      const statsPromise = supportService.getStats().catch((error) => {
        console.warn('Failed to load stats:', error)
        return {
          openTickets: 0,
          resolvedThisMonth: 0,
          averageResponseTime: 0,
          customerRating: 0,
          totalTickets: 0
        }
      })
      
      const [ticketsData, statsData] = await Promise.all([ticketsPromise, statsPromise])
      setTickets(ticketsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading support data:', error)
      // Set default values
      setTickets([])
      setStats({
        openTickets: 0,
        resolvedThisMonth: 0,
        averageResponseTime: 0,
        customerRating: 0,
        totalTickets: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please log in to submit a support ticket')
      return
    }

    setIsSubmitting(true)

    try {
      const newTicket = await supportService.createTicket({
        subject: formData.subject,
        description: formData.message,
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        category: 'general',
        userId: user.id,
        userEmail: user.email || ''
      })
      
      setTickets(prev => [newTicket, ...prev])
      toast.success('Support ticket created successfully! We\'ll get back to you within 2 minutes.')
      setIsContactFormOpen(false)
      setFormData({ subject: '', message: '', priority: 'medium' })
    } catch (error) {
      console.error('Error creating ticket:', error)
      toast.error('Failed to create support ticket. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Priority Support
          {isRealtimeConnected ? (
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
              <Wifi className="h-3 w-3 mr-1" />
              Live
            </Badge>
          ) : (
            <Badge variant="outline" className="ml-2">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          24/7 priority customer support with direct access to our team
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Support Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-primary">
              {stats.averageResponseTime > 0 ? `${stats.averageResponseTime}min` : '-'}
            </div>
            <div className="text-xs text-muted-foreground">Average response time</div>
            <div className="text-xs text-muted-foreground text-muted-foreground/70">
              {stats.averageResponseTime > 0 ? 'Real data' : 'No data yet'}
            </div>
          </div>
          <div className="text-center">
            <Star className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <div className="text-2xl font-bold text-muted-foreground">
              {stats.customerRating > 0 ? stats.customerRating.toFixed(1) : '-'}
            </div>
            <div className="text-xs text-muted-foreground">Customer rating</div>
            <div className="text-xs text-muted-foreground text-muted-foreground/70">
              {stats.customerRating > 0 ? 'Real data' : 'No ratings yet'}
            </div>
          </div>
          <div className="text-center">
            <MessageSquare className="h-6 w-6 text-success mx-auto mb-2" />
            <div className="text-2xl font-bold text-success">{stats.openTickets}</div>
            <div className="text-xs text-muted-foreground">Open tickets</div>
            <div className="text-xs text-muted-foreground text-success/70">Real data</div>
          </div>
          <div className="text-center">
            <CheckCircle className="h-6 w-6 text-accent mx-auto mb-2" />
            <div className="text-2xl font-bold text-accent">{stats.resolvedThisMonth}</div>
            <div className="text-xs text-muted-foreground">Resolved this month</div>
            <div className="text-xs text-muted-foreground text-accent/70">Real data</div>
          </div>
        </div>

        {/* Contact Form */}
        {isContactFormOpen ? (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Contact Support</CardTitle>
              <CardDescription>
                Submit your support request and we&apos;ll get back to you within 2 minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="low">Low - General inquiry</option>
                    <option value="medium">Medium - Feature request</option>
                    <option value="high">High - Bug report</option>
                    <option value="urgent">Urgent - System issue</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your issue in detail..."
                    rows={4}
                    required
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Request
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsContactFormOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Direct Support Access</h3>
              <p className="text-sm text-muted-foreground">
                Get direct access to our support team for urgent issues
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {canSubmitTickets ? (
                <Button onClick={() => setIsContactFormOpen(true)} className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Support
                </Button>
              ) : (
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Mail className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">Support Access Required</p>
                  <p className="text-xs text-muted-foreground">Upgrade to Pro or Master to submit support tickets</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Support Features */}
        <div className="space-y-4">
          <h4 className="font-semibold">Support features available to all users</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-sm">Priority Queue</span>
              <Badge variant="secondary" className="text-xs">Jump to front</Badge>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-sm">Secure Channel</span>
              <Badge variant="secondary" className="text-xs">Encrypted</Badge>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-sm">Fast Response</span>
              <Badge variant="secondary" className="text-xs">Target: 2 min</Badge>
            </div>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-sm">VIP Treatment</span>
              <Badge variant="secondary" className="text-xs">Personal attention</Badge>
            </div>
          </div>
        </div>

        {/* Recent Support Tickets */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Recent Support Tickets</h4>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" />
              <p>Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium mb-2">No support tickets yet</p>
              <p className="text-sm">
                {canSubmitTickets 
                  ? 'Create your first support request using the "Contact Support" button above'
                  : 'Upgrade to Pro or Master to submit support tickets'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.slice(0, 5).map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{ticket.subject}</span>
                      <Badge 
                        variant={ticket.status === 'open' ? 'destructive' : 
                                ticket.status === 'in_progress' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {ticket.status}
                      </Badge>
                      <Badge 
                        variant={ticket.priority === 'urgent' ? 'destructive' : 
                                ticket.priority === 'high' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {ticket.priority}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Created {new Date(ticket.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {ticket.status === 'resolved' && (
                    <div className="flex items-center gap-2">
                      {ticket.rating ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-muted-foreground">Rated:</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= ticket.rating
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTicketForRating(ticket)}
                          className="text-xs"
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Rate
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Rating Modal */}
    {selectedTicketForRating && (
      <TicketRatingModal
        ticket={selectedTicketForRating}
        isOpen={!!selectedTicketForRating}
        onClose={() => setSelectedTicketForRating(null)}
        onRated={() => {
          loadData() // Refresh data after rating
          setSelectedTicketForRating(null)
        }}
      />
    )}
    </>
  )
}