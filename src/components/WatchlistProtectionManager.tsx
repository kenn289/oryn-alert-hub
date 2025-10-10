'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, Shield, Download, Upload, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'

interface WatchlistBackup {
  id: string
  user_id: string
  backup_data: any[]
  backup_type: 'automatic' | 'manual' | 'before_delete' | 'before_update'
  created_at: string
  metadata?: {
    reason?: string
    trigger?: string
    item_count?: number
  }
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

interface WatchlistProtectionManagerProps {
  userId: string
}

export function WatchlistProtectionManager({ userId }: WatchlistProtectionManagerProps) {
  const [backups, setBackups] = useState<WatchlistBackup[]>([])
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  const loadBackups = async () => {
    try {
      const response = await fetch(`/api/watchlist/protection?userId=${userId}&action=backups`)
      const data = await response.json()
      if (data.backups) {
        setBackups(data.backups)
      }
    } catch (error) {
      console.error('Error loading backups:', error)
    }
  }

  const loadValidation = async () => {
    try {
      const response = await fetch(`/api/watchlist/protection?userId=${userId}&action=validation`)
      const data = await response.json()
      if (data.validation) {
        setValidation(data.validation)
      }
    } catch (error) {
      console.error('Error loading validation:', error)
    }
  }

  const createBackup = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/watchlist/protection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'create-backup',
          backupType: 'manual',
          metadata: { reason: 'Manual backup created by user' }
        })
      })
      const data = await response.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        loadBackups()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create backup' })
    } finally {
      setIsLoading(false)
    }
  }

  const restoreFromBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to restore from this backup? This will replace your current watchlist.')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/watchlist/protection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'restore',
          backupId
        })
      })
      const data = await response.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        loadBackups()
        loadValidation()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to restore from backup' })
    } finally {
      setIsLoading(false)
    }
  }

  const cleanupOldBackups = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/watchlist/protection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'cleanup'
        })
      })
      const data = await response.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: `Cleaned up ${data.deletedCount} old backups` })
        loadBackups()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to cleanup old backups' })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getBackupTypeColor = (type: string) => {
    switch (type) {
      case 'automatic': return 'bg-blue-100 text-blue-800'
      case 'manual': return 'bg-green-100 text-green-800'
      case 'before_delete': return 'bg-red-100 text-red-800'
      case 'before_update': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  useEffect(() => {
    loadBackups()
    loadValidation()
  }, [userId])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Watchlist Protection
          </CardTitle>
          <CardDescription>
            Manage backups and validate your watchlist data integrity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 mb-4">
            <Button onClick={createBackup} disabled={isLoading} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Create Backup
            </Button>
            <Button onClick={loadValidation} disabled={isLoading} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Validate Data
            </Button>
            <Button onClick={cleanupOldBackups} disabled={isLoading} size="sm" variant="outline">
              <Trash2 className="h-4 w-4 mr-2" />
              Cleanup Old
            </Button>
          </div>

          <Tabs defaultValue="validation" className="w-full">
            <TabsList>
              <TabsTrigger value="validation">Validation</TabsTrigger>
              <TabsTrigger value="backups">Backups</TabsTrigger>
            </TabsList>

            <TabsContent value="validation" className="space-y-4">
              {validation && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {validation.isValid ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                    <span className={`font-medium ${validation.isValid ? 'text-green-700' : 'text-red-700'}`}>
                      {validation.isValid ? 'Watchlist is valid' : 'Watchlist has issues'}
                    </span>
                  </div>

                  {validation.errors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-700 mb-2">Errors:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {validation.errors.map((error, index) => (
                          <li key={index} className="text-sm text-red-600">{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {validation.warnings.length > 0 && (
                    <div>
                      <h4 className="font-medium text-yellow-700 mb-2">Warnings:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {validation.warnings.map((warning, index) => (
                          <li key={index} className="text-sm text-yellow-600">{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {validation.suggestions.length > 0 && (
                    <div>
                      <h4 className="font-medium text-blue-700 mb-2">Suggestions:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {validation.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm text-blue-600">{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="backups" className="space-y-4">
              <div className="space-y-2">
                {backups.length === 0 ? (
                  <p className="text-gray-500">No backups found</p>
                ) : (
                  backups.map((backup) => (
                    <Card key={backup.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className={getBackupTypeColor(backup.backup_type)}>
                              {backup.backup_type}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {backup.metadata?.item_count || 0} items
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {formatDate(backup.created_at)}
                          </p>
                          {backup.metadata?.reason && (
                            <p className="text-xs text-gray-400">{backup.metadata.reason}</p>
                          )}
                        </div>
                        <Button
                          onClick={() => restoreFromBackup(backup.id)}
                          disabled={isLoading}
                          size="sm"
                          variant="outline"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
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
