'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Shield, UserPlus, UserMinus, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface ManualProGrant {
  id: string
  user_id: string
  granted_by: string
  reason?: string
  expires_at?: string
  created_at: string
  revoked_at?: string
  revoked_by?: string
  revoked_reason?: string
}

interface ManualProStats {
  totalGrants: number
  activeGrants: number
  expiredGrants: number
  revokedGrants: number
}

interface UserWithManualPro {
  id: string
  email: string
  plan: string
  manual_pro_override: boolean
  manual_pro_granted_by: string
  manual_pro_granted_at: string
  manual_pro_reason: string
  manual_pro_expires_at: string
}

interface ManualProManagerProps {
  currentUserId: string
}

export function ManualProManager({ currentUserId }: ManualProManagerProps) {
  const [grants, setGrants] = useState<ManualProGrant[]>([])
  const [users, setUsers] = useState<UserWithManualPro[]>([])
  const [stats, setStats] = useState<ManualProStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  
  // Grant form state
  const [grantUserId, setGrantUserId] = useState('')
  const [grantReason, setGrantReason] = useState('')
  const [grantExpiresAt, setGrantExpiresAt] = useState('')
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false)
  
  // Revoke form state
  const [revokeUserId, setRevokeUserId] = useState('')
  const [revokeReason, setRevokeReason] = useState('')
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [grantsRes, usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/manual-pro?action=grants'),
        fetch('/api/admin/manual-pro?action=users'),
        fetch('/api/admin/manual-pro?action=stats')
      ])

      const [grantsData, usersData, statsData] = await Promise.all([
        grantsRes.json(),
        usersRes.json(),
        statsRes.json()
      ])

      if (grantsData.grants) setGrants(grantsData.grants)
      if (usersData.users) setUsers(usersData.users)
      if (statsData.stats) setStats(statsData.stats)
    } catch (error) {
      console.error('Error loading manual Pro data:', error)
      setMessage({ type: 'error', text: 'Failed to load data' })
    } finally {
      setIsLoading(false)
    }
  }

  const grantManualPro = async () => {
    if (!grantUserId.trim()) {
      setMessage({ type: 'error', text: 'User ID is required' })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/manual-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'grant',
          userId: grantUserId,
          grantedBy: currentUserId,
          reason: grantReason || null,
          expiresAt: grantExpiresAt || null
        })
      })
      const data = await response.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        setIsGrantDialogOpen(false)
        setGrantUserId('')
        setGrantReason('')
        setGrantExpiresAt('')
        loadData()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to grant manual Pro access' })
    } finally {
      setIsLoading(false)
    }
  }

  const revokeManualPro = async () => {
    if (!revokeUserId.trim()) {
      setMessage({ type: 'error', text: 'User ID is required' })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/manual-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke',
          userId: revokeUserId,
          revokedBy: currentUserId,
          reason: revokeReason || null
        })
      })
      const data = await response.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        setIsRevokeDialogOpen(false)
        setRevokeUserId('')
        setRevokeReason('')
        loadData()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to revoke manual Pro access' })
    } finally {
      setIsLoading(false)
    }
  }

  const cleanupExpired = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/manual-pro?action=cleanup')
      const data = await response.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        loadData()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to cleanup expired access' })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  const getStatusBadge = (grant: ManualProGrant) => {
    if (grant.revoked_at) {
      return <Badge variant="destructive">Revoked</Badge>
    }
    if (grant.expires_at && isExpired(grant.expires_at)) {
      return <Badge variant="secondary">Expired</Badge>
    }
    return <Badge variant="default">Active</Badge>
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manual Pro Access Management
          </CardTitle>
          <CardDescription>
            Grant and manage manual Pro access for users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 mb-4">
            <Dialog open={isGrantDialogOpen} onOpenChange={setIsGrantDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Grant Pro Access
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Grant Manual Pro Access</DialogTitle>
                  <DialogDescription>
                    Grant Pro access to a user manually
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="grantUserId">User ID</Label>
                    <Input
                      id="grantUserId"
                      value={grantUserId}
                      onChange={(e) => setGrantUserId(e.target.value)}
                      placeholder="Enter user ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="grantReason">Reason (Optional)</Label>
                    <Textarea
                      id="grantReason"
                      value={grantReason}
                      onChange={(e) => setGrantReason(e.target.value)}
                      placeholder="Reason for granting Pro access"
                    />
                  </div>
                  <div>
                    <Label htmlFor="grantExpiresAt">Expires At (Optional)</Label>
                    <Input
                      id="grantExpiresAt"
                      type="datetime-local"
                      value={grantExpiresAt}
                      onChange={(e) => setGrantExpiresAt(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsGrantDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={grantManualPro} disabled={isLoading}>
                    Grant Access
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <UserMinus className="h-4 w-4 mr-2" />
                  Revoke Pro Access
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Revoke Manual Pro Access</DialogTitle>
                  <DialogDescription>
                    Revoke Pro access from a user
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="revokeUserId">User ID</Label>
                    <Input
                      id="revokeUserId"
                      value={revokeUserId}
                      onChange={(e) => setRevokeUserId(e.target.value)}
                      placeholder="Enter user ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="revokeReason">Reason (Optional)</Label>
                    <Textarea
                      id="revokeReason"
                      value={revokeReason}
                      onChange={(e) => setRevokeReason(e.target.value)}
                      placeholder="Reason for revoking Pro access"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsRevokeDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={revokeManualPro} disabled={isLoading}>
                    Revoke Access
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button onClick={cleanupExpired} disabled={isLoading} variant="outline">
              <Clock className="h-4 w-4 mr-2" />
              Cleanup Expired
            </Button>

            <Button onClick={loadData} disabled={isLoading} variant="outline">
              Refresh
            </Button>
          </div>

          <Tabs defaultValue="stats" className="w-full">
            <TabsList>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="grants">Grant History</TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="space-y-4">
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{stats.totalGrants}</div>
                      <p className="text-sm text-muted-foreground">Total Grants</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-600">{stats.activeGrants}</div>
                      <p className="text-sm text-muted-foreground">Active</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-yellow-600">{stats.expiredGrants}</div>
                      <p className="text-sm text-muted-foreground">Expired</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-red-600">{stats.revokedGrants}</div>
                      <p className="text-sm text-muted-foreground">Revoked</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <div className="space-y-2">
                {users.length === 0 ? (
                  <p className="text-gray-500">No users with manual Pro access</p>
                ) : (
                  users.map((user) => (
                    <Card key={user.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.email}</span>
                            <Badge variant="default">Pro</Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            Granted: {formatDate(user.manual_pro_granted_at)}
                          </p>
                          {user.manual_pro_reason && (
                            <p className="text-xs text-gray-400">{user.manual_pro_reason}</p>
                          )}
                          {user.manual_pro_expires_at && (
                            <p className="text-xs text-gray-400">
                              Expires: {formatDate(user.manual_pro_expires_at)}
                              {isExpired(user.manual_pro_expires_at) && (
                                <span className="text-red-500 ml-2">(Expired)</span>
                              )}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => {
                            setRevokeUserId(user.id)
                            setIsRevokeDialogOpen(true)
                          }}
                          size="sm"
                          variant="destructive"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Revoke
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="grants" className="space-y-4">
              <div className="space-y-2">
                {grants.length === 0 ? (
                  <p className="text-gray-500">No grant history found</p>
                ) : (
                  grants.map((grant) => (
                    <Card key={grant.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">User: {grant.user_id}</span>
                            {getStatusBadge(grant)}
                          </div>
                          <p className="text-sm text-gray-500">
                            Granted: {formatDate(grant.created_at)}
                          </p>
                          {grant.reason && (
                            <p className="text-xs text-gray-400">Reason: {grant.reason}</p>
                          )}
                          {grant.expires_at && (
                            <p className="text-xs text-gray-400">
                              Expires: {formatDate(grant.expires_at)}
                            </p>
                          )}
                          {grant.revoked_at && (
                            <p className="text-xs text-red-400">
                              Revoked: {formatDate(grant.revoked_at)}
                              {grant.revoked_reason && ` - ${grant.revoked_reason}`}
                            </p>
                          )}
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
