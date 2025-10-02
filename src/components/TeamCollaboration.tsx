"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  UserPlus, 
  Share2, 
  Settings, 
  Crown,
  Shield,
  Eye,
  Download,
  MessageSquare,
  Bell,
  CheckCircle,
  X,
  Copy,
  Send,
  Loader2,
  RefreshCw,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react"
import { toast } from "sonner"

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'member'
  status: 'active' | 'pending' | 'inactive'
  joinedAt: string
  lastActive: string
  avatar?: string
}

interface SharedAnalytics {
  id: string
  title: string
  type: 'portfolio' | 'watchlist' | 'options' | 'insights'
  sharedBy: string
  sharedAt: string
  views: number
  isPublic: boolean
  description: string
  data: Record<string, unknown>
}

interface TeamInvite {
  id: string
  email: string
  role: 'admin' | 'member'
  invitedBy: string
  invitedAt: string
  expiresAt: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
}

export function TeamCollaboration() {
  const [activeTab, setActiveTab] = useState('overview')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'member' as 'admin' | 'member',
    message: ''
  })
  const [shareData, setShareData] = useState({
    title: '',
    description: '',
    type: 'portfolio' as 'portfolio' | 'watchlist' | 'options' | 'insights',
    isPublic: false
  })
  const [loading, setLoading] = useState(false)
  const [pendingInvites, setPendingInvites] = useState<TeamInvite[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [sharedAnalytics, setSharedAnalytics] = useState<SharedAnalytics[]>([])
  const [teamActivity, setTeamActivity] = useState<Array<{ description: string; timestamp: string }>>([])

  useEffect(() => {
    loadTeamData()
  }, [])

  const loadTeamData = () => {
    loadTeamMembers()
    loadPendingInvites()
    loadSharedAnalytics()
    loadTeamActivity()
  }

  const loadTeamMembers = () => {
    const stored = localStorage.getItem('oryn_team_members')
    if (stored) {
      setTeamMembers(JSON.parse(stored))
    } else {
      // Initialize with owner
      const initialMembers: TeamMember[] = [
        {
          id: '1',
          name: 'Kenneth Oswin',
          email: 'kennethoswin289@gmail.com',
          role: 'owner',
          status: 'active',
          joinedAt: '2024-01-01',
          lastActive: '2 min ago'
        }
      ]
      setTeamMembers(initialMembers)
      localStorage.setItem('oryn_team_members', JSON.stringify(initialMembers))
    }
  }

  const loadPendingInvites = () => {
    const stored = localStorage.getItem('oryn_team_invites')
    if (stored) {
      setPendingInvites(JSON.parse(stored))
    }
  }

  const loadSharedAnalytics = () => {
    const stored = localStorage.getItem('oryn_shared_analytics')
    if (stored) {
      setSharedAnalytics(JSON.parse(stored))
    }
  }

  const loadTeamActivity = () => {
    const stored = localStorage.getItem('oryn_team_activity')
    if (stored) {
      setTeamActivity(JSON.parse(stored))
    } else {
      // Initialize with empty activity
      setTeamActivity([])
    }
  }

  // Data is now loaded from localStorage in useEffect

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create team invite in localStorage (in real app, this would be API call)
      const inviteId = `invite_${Math.floor(Math.random() * 1000000)}`
      const newInvite: TeamInvite = {
        id: inviteId,
        email: inviteData.email,
        role: inviteData.role,
        invitedBy: 'Kenneth Oswin',
        invitedAt: '2024-01-15T10:30:00Z',
        expiresAt: '2024-01-22T10:30:00Z', // 7 days
        status: 'pending'
      }

      // Store invite in localStorage
      const existingInvites = JSON.parse(localStorage.getItem('oryn_team_invites') || '[]')
      existingInvites.push(newInvite)
      localStorage.setItem('oryn_team_invites', JSON.stringify(existingInvites))
      
      // Add team activity
      const newActivity = {
        description: `Invited ${inviteData.email} to join the team`,
        timestamp: '2024-01-15T10:30:00Z'
      }
      const existingActivity = JSON.parse(localStorage.getItem('oryn_team_activity') || '[]')
      existingActivity.unshift(newActivity)
      localStorage.setItem('oryn_team_activity', JSON.stringify(existingActivity))
      setTeamActivity(existingActivity)

      // Create invite email with actual invitation link
      const inviteLink = `${window.location.origin}/team/join?token=${inviteId}&email=${encodeURIComponent(inviteData.email)}`
      const subject = `Invitation to join Oryn Pro Team`
      const body = `Hi there!

You've been invited to join our Oryn Pro team by Kenneth Oswin${inviteData.message ? ` with the message: "${inviteData.message}"` : ''}.

As a team member, you'll get access to:
- Shared analytics and insights
- Collaborative watchlists  
- Team portfolio tracking
- Priority support
- Real-time market data sharing

Click here to accept the invitation: ${inviteLink}

This invitation expires in 7 days.

Best regards,
Kenneth Oswin (Team Owner)
kennethoswin289@gmail.com`
      
      const mailtoLink = `mailto:${inviteData.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      window.open(mailtoLink)
      
      toast.success(`Invitation sent to ${inviteData.email}. They can join using the link in their email.`)
      setIsInviteModalOpen(false)
      setInviteData({ email: '', role: 'member', message: '' })
      
      // Refresh pending invites
      loadPendingInvites()
    } catch (error) {
      console.error('Error sending invitation:', error)
      toast.error('Failed to send invitation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleShareAnalytics = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create new shared analytics entry
      const newAnalytics: SharedAnalytics = {
        id: `analytics_${Math.floor(Math.random() * 1000000)}`,
        title: shareData.title,
        type: shareData.type,
        sharedBy: 'Kenneth Oswin',
        sharedAt: '2024-01-15T10:30:00Z',
        views: 0,
        isPublic: shareData.isPublic,
        description: shareData.description,
        data: {
          type: shareData.type,
          timestamp: '2024-01-15T10:30:00Z',
          sharedBy: 'Kenneth Oswin'
        }
      }

      // Store in localStorage
      const existing = JSON.parse(localStorage.getItem('oryn_shared_analytics') || '[]')
      existing.unshift(newAnalytics) // Add to beginning
      localStorage.setItem('oryn_shared_analytics', JSON.stringify(existing))
      
      // Update state
      setSharedAnalytics(existing)
      
      // Add team activity
      const newActivity = {
        description: `Shared ${shareData.title} with the team`,
        timestamp: '2024-01-15T10:30:00Z'
      }
      const existingActivity = JSON.parse(localStorage.getItem('oryn_team_activity') || '[]')
      existingActivity.unshift(newActivity)
      localStorage.setItem('oryn_team_activity', JSON.stringify(existingActivity))
      setTeamActivity(existingActivity)
      
      toast.success('Analytics shared with team successfully!')
      setIsShareModalOpen(false)
      setShareData({ title: '', description: '', type: 'portfolio', isPublic: false })
    } catch (error) {
      console.error('Error sharing analytics:', error)
      toast.error('Failed to share analytics. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/team/join?ref=pro-team`
    navigator.clipboard.writeText(inviteLink)
    toast.success('Invite link copied to clipboard!')
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-500/20 text-purple-600'
      case 'admin':
        return 'bg-blue-500/20 text-blue-600'
      default:
        return 'bg-green-500/20 text-green-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-600'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-600'
      default:
        return 'bg-gray-500/20 text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Team Collaboration
          </h2>
          <p className="text-muted-foreground">Share analytics and collaborate with your Pro team</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsShareModalOpen(true)}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Analytics
          </Button>
          <Button onClick={() => setIsInviteModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shared Analytics</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sharedAnalytics.length}</div>
            <p className="text-xs text-muted-foreground">Shared insights</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvites.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">Actions this week</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="analytics">Shared Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Team Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamActivity.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No team activity yet</p>
                      <p className="text-sm">Start collaborating to see activity here</p>
                    </div>
                  ) : (
                    teamActivity.map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <div className="p-2 bg-green-500/20 rounded-full">
                          <Share2 className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{activity.description}</div>
                          <div className="text-xs text-muted-foreground">{activity.timestamp}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Team Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Shared Insights</span>
                    <span className="text-lg font-semibold">{sharedAnalytics.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Team Members</span>
                    <span className="text-lg font-semibold">{teamMembers.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Team Activity</span>
                    <span className="text-lg font-semibold">{teamActivity.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage your team members and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                        <div className="text-xs text-muted-foreground">
                          Last active: {member.lastActive}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getRoleColor(member.role)}>
                        {member.role.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(member.status)}>
                        {member.status.toUpperCase()}
                      </Badge>
                      {member.role !== 'owner' && (
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>Manage pending team invitations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingInvites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">{invite.email}</div>
                      <div className="text-sm text-muted-foreground">
                        Invited by {invite.invitedBy} • {invite.role.toUpperCase()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Expires: {invite.expiresAt}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-yellow-500/20 text-yellow-600">
                        PENDING
                      </Badge>
                      <Button variant="outline" size="sm">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Shared Analytics</CardTitle>
              <CardDescription>Analytics and insights shared by your team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sharedAnalytics.map((analytics) => (
                  <div key={analytics.id} className="p-4 bg-muted rounded-lg hover:bg-muted/70 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-medium">{analytics.title}</div>
                        <div className="text-sm text-muted-foreground">{analytics.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={analytics.isPublic ? 'bg-green-500/20 text-green-600' : 'bg-blue-500/20 text-blue-600'}>
                          {analytics.isPublic ? 'PUBLIC' : 'PRIVATE'}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Shared by {analytics.sharedBy} • {analytics.sharedAt}</span>
                      <span>{analytics.views} views</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Settings</CardTitle>
              <CardDescription>Configure your team collaboration settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Public Invite Link</div>
                    <div className="text-sm text-muted-foreground">Allow anyone with the link to join</div>
                  </div>
                  <Button variant="outline" onClick={copyInviteLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Auto-share New Analytics</div>
                    <div className="text-sm text-muted-foreground">Automatically share new insights with team</div>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Team Notifications</div>
                    <div className="text-sm text-muted-foreground">Get notified of team activities</div>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Invite Team Member
              </CardTitle>
              <CardDescription>
                Send an invitation to join your Pro team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInviteMember} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    placeholder="colleague@example.com"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={inviteData.role}
                    onChange={(e) => setInviteData({ ...inviteData, role: e.target.value as 'admin' | 'member' })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="member">Member - Can view and share analytics</option>
                    <option value="admin">Admin - Can manage team and invite others</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="message">Personal Message (Optional)</Label>
                  <Textarea
                    id="message"
                    value={inviteData.message}
                    onChange={(e) => setInviteData({ ...inviteData, message: e.target.value })}
                    placeholder="Add a personal message to your invitation..."
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsInviteModalOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Share Analytics
              </CardTitle>
              <CardDescription>
                Share your analytics and insights with your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleShareAnalytics} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={shareData.title}
                    onChange={(e) => setShareData({ ...shareData, title: e.target.value })}
                    placeholder="Analytics title"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Analytics Type</Label>
                  <select
                    id="type"
                    value={shareData.type}
                    onChange={(e) => setShareData({ ...shareData, type: e.target.value as 'portfolio' | 'watchlist' | 'options' | 'insights' })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="portfolio">Portfolio Analysis</option>
                    <option value="watchlist">Watchlist Performance</option>
                    <option value="options">Options Flow</option>
                    <option value="insights">AI Insights</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={shareData.description}
                    onChange={(e) => setShareData({ ...shareData, description: e.target.value })}
                    placeholder="Describe your analytics..."
                    rows={3}
                    required
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={shareData.isPublic}
                    onChange={(e) => setShareData({ ...shareData, isPublic: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="isPublic">Make this analytics public to all team members</Label>
                </div>
                
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sharing...
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share with Team
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsShareModalOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
