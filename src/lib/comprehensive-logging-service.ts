import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwrurebhoxyozdjbokhe.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cnVyZWJob3h5b3pkamJva2hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODQ4NDUsImV4cCI6MjA3NDk2MDg0NX0.uVqhgfs0a_ji3BlVq0cUAd4XzhFT-zDvLNenNOWL6oE'
)

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical'
  message: string
  context?: {
    userId?: string
    userEmail?: string
    ipAddress?: string
    userAgent?: string
    endpoint?: string
    method?: string
    requestId?: string
    sessionId?: string
    deviceFingerprint?: string
    geolocation?: any
  }
  metadata?: any
  timestamp?: string
}

export interface AuditTrailEntry {
  action: string
  resource: string
  resourceId?: string
  userId?: string
  userEmail?: string
  ipAddress?: string
  userAgent?: string
  changes?: any
  previousValues?: any
  newValues?: any
  reason?: string
  metadata?: any
  timestamp?: string
}

export interface PerformanceLog {
  endpoint: string
  method: string
  duration: number
  statusCode: number
  userId?: string
  ipAddress?: string
  userAgent?: string
  requestSize?: number
  responseSize?: number
  databaseQueries?: number
  cacheHits?: number
  cacheMisses?: number
  timestamp?: string
}

export class ComprehensiveLoggingService {
  private static instance: ComprehensiveLoggingService
  private logBuffer: LogEntry[] = []
  private auditBuffer: AuditTrailEntry[] = []
  private performanceBuffer: PerformanceLog[] = []
  private flushInterval: NodeJS.Timeout | null = null

  constructor() {
    // Start periodic flush
    this.startPeriodicFlush()
  }

  static getInstance(): ComprehensiveLoggingService {
    if (!ComprehensiveLoggingService.instance) {
      ComprehensiveLoggingService.instance = new ComprehensiveLoggingService()
    }
    return ComprehensiveLoggingService.instance
  }

  /**
   * Log a message with context
   */
  log(level: LogEntry['level'], message: string, context?: LogEntry['context'], metadata?: any): void {
    const logEntry: LogEntry = {
      level,
      message,
      context,
      metadata,
      timestamp: new Date().toISOString()
    }

    // Add to buffer
    this.logBuffer.push(logEntry)

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      const logMethod = level === 'error' || level === 'critical' ? 'error' : 'log'
      console[logMethod](`[${level.toUpperCase()}] ${message}`, { context, metadata })
    }

    // Flush if buffer is full
    if (this.logBuffer.length >= 100) {
      this.flushLogs()
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogEntry['context'], metadata?: any): void {
    this.log('debug', message, context, metadata)
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogEntry['context'], metadata?: any): void {
    this.log('info', message, context, metadata)
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogEntry['context'], metadata?: any): void {
    this.log('warn', message, context, metadata)
  }

  /**
   * Log error message
   */
  error(message: string, context?: LogEntry['context'], metadata?: any): void {
    this.log('error', message, context, metadata)
  }

  /**
   * Log critical message
   */
  critical(message: string, context?: LogEntry['context'], metadata?: any): void {
    this.log('critical', message, context, metadata)
  }

  /**
   * Create audit trail entry
   */
  audit(action: string, resource: string, context?: {
    resourceId?: string
    userId?: string
    userEmail?: string
    ipAddress?: string
    userAgent?: string
    changes?: any
    previousValues?: any
    newValues?: any
    reason?: string
    metadata?: any
  }): void {
    const auditEntry: AuditTrailEntry = {
      action,
      resource,
      resourceId: context?.resourceId,
      userId: context?.userId,
      userEmail: context?.userEmail,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      changes: context?.changes,
      previousValues: context?.previousValues,
      newValues: context?.newValues,
      reason: context?.reason,
      metadata: context?.metadata,
      timestamp: new Date().toISOString()
    }

    // Add to buffer
    this.auditBuffer.push(auditEntry)

    // Flush if buffer is full
    if (this.auditBuffer.length >= 50) {
      this.flushAuditTrail()
    }
  }

  /**
   * Log performance metrics
   */
  performance(metrics: PerformanceLog): void {
    const performanceEntry: PerformanceLog = {
      ...metrics,
      timestamp: metrics.timestamp || new Date().toISOString()
    }

    // Add to buffer
    this.performanceBuffer.push(performanceEntry)

    // Flush if buffer is full
    if (this.performanceBuffer.length >= 50) {
      this.flushPerformanceLogs()
    }
  }

  /**
   * Start periodic flush
   */
  private startPeriodicFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushAll()
    }, 30000) // Flush every 30 seconds
  }

  /**
   * Flush all buffers
   */
  private async flushAll(): Promise<void> {
    await Promise.all([
      this.flushLogs(),
      this.flushAuditTrail(),
      this.flushPerformanceLogs()
    ])
  }

  /**
   * Flush log buffer to database
   */
  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return

    try {
      const logsToFlush = [...this.logBuffer]
      this.logBuffer = []

      await supabase.from('application_logs').insert(logsToFlush)
    } catch (error) {
      console.error('Failed to flush logs:', error)
      // Re-add logs to buffer if flush failed
      this.logBuffer.unshift(...this.logBuffer)
    }
  }

  /**
   * Flush audit trail buffer to database
   */
  private async flushAuditTrail(): Promise<void> {
    if (this.auditBuffer.length === 0) return

    try {
      const auditToFlush = [...this.auditBuffer]
      this.auditBuffer = []

      await supabase.from('audit_trail').insert(auditToFlush)
    } catch (error) {
      console.error('Failed to flush audit trail:', error)
      // Re-add audit entries to buffer if flush failed
      this.auditBuffer.unshift(...this.auditBuffer)
    }
  }

  /**
   * Flush performance logs buffer to database
   */
  private async flushPerformanceLogs(): Promise<void> {
    if (this.performanceBuffer.length === 0) return

    try {
      const performanceToFlush = [...this.performanceBuffer]
      this.performanceBuffer = []

      await supabase.from('performance_logs').insert(performanceToFlush)
    } catch (error) {
      console.error('Failed to flush performance logs:', error)
      // Re-add performance logs to buffer if flush failed
      this.performanceBuffer.unshift(...this.performanceBuffer)
    }
  }

  /**
   * Get logs with filtering
   */
  async getLogs(filters?: {
    level?: string
    userId?: string
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }): Promise<LogEntry[]> {
    try {
      let query = supabase.from('application_logs').select('*')

      if (filters?.level) {
        query = query.eq('level', filters.level)
      }

      if (filters?.userId) {
        query = query.eq('context->>userId', filters.userId)
      }

      if (filters?.startDate) {
        query = query.gte('timestamp', filters.startDate)
      }

      if (filters?.endDate) {
        query = query.lte('timestamp', filters.endDate)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1)
      }

      const { data, error } = await query.order('timestamp', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Failed to get logs:', error)
      return []
    }
  }

  /**
   * Get audit trail with filtering
   */
  async getAuditTrail(filters?: {
    action?: string
    resource?: string
    userId?: string
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }): Promise<AuditTrailEntry[]> {
    try {
      let query = supabase.from('audit_trail').select('*')

      if (filters?.action) {
        query = query.eq('action', filters.action)
      }

      if (filters?.resource) {
        query = query.eq('resource', filters.resource)
      }

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId)
      }

      if (filters?.startDate) {
        query = query.gte('timestamp', filters.startDate)
      }

      if (filters?.endDate) {
        query = query.lte('timestamp', filters.endDate)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1)
      }

      const { data, error } = await query.order('timestamp', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Failed to get audit trail:', error)
      return []
    }
  }

  /**
   * Get performance logs with filtering
   */
  async getPerformanceLogs(filters?: {
    endpoint?: string
    method?: string
    userId?: string
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }): Promise<PerformanceLog[]> {
    try {
      let query = supabase.from('performance_logs').select('*')

      if (filters?.endpoint) {
        query = query.eq('endpoint', filters.endpoint)
      }

      if (filters?.method) {
        query = query.eq('method', filters.method)
      }

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId)
      }

      if (filters?.startDate) {
        query = query.gte('timestamp', filters.startDate)
      }

      if (filters?.endDate) {
        query = query.lte('timestamp', filters.endDate)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1)
      }

      const { data, error } = await query.order('timestamp', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Failed to get performance logs:', error)
      return []
    }
  }

  /**
   * Clean up old logs
   */
  async cleanupOldLogs(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString()

      const [
        { count: logsDeleted },
        { count: auditDeleted },
        { count: performanceDeleted }
      ] = await Promise.all([
        supabase.from('application_logs').delete().lt('timestamp', cutoffDate),
        supabase.from('audit_trail').delete().lt('timestamp', cutoffDate),
        supabase.from('performance_logs').delete().lt('timestamp', cutoffDate)
      ])

      return (logsDeleted || 0) + (auditDeleted || 0) + (performanceDeleted || 0)
    } catch (error) {
      console.error('Failed to cleanup old logs:', error)
      return 0
    }
  }

  /**
   * Get logging statistics
   */
  async getLoggingStats(): Promise<{
    totalLogs: number
    totalAuditEntries: number
    totalPerformanceLogs: number
    logsByLevel: Record<string, number>
    recentActivity: number
  }> {
    try {
      const [
        { count: totalLogs },
        { count: totalAuditEntries },
        { count: totalPerformanceLogs },
        { data: logsByLevel },
        { count: recentActivity }
      ] = await Promise.all([
        supabase.from('application_logs').select('*', { count: 'exact', head: true }),
        supabase.from('audit_trail').select('*', { count: 'exact', head: true }),
        supabase.from('performance_logs').select('*', { count: 'exact', head: true }),
        supabase.from('application_logs').select('level').gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('application_logs').select('*', { count: 'exact', head: true }).gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ])

      const levelCounts: Record<string, number> = {}
      logsByLevel?.forEach(log => {
        levelCounts[log.level] = (levelCounts[log.level] || 0) + 1
      })

      return {
        totalLogs: totalLogs || 0,
        totalAuditEntries: totalAuditEntries || 0,
        totalPerformanceLogs: totalPerformanceLogs || 0,
        logsByLevel: levelCounts,
        recentActivity: recentActivity || 0
      }
    } catch (error) {
      console.error('Failed to get logging stats:', error)
      return {
        totalLogs: 0,
        totalAuditEntries: 0,
        totalPerformanceLogs: 0,
        logsByLevel: {},
        recentActivity: 0
      }
    }
  }

  /**
   * Destroy the service and flush remaining logs
   */
  async destroy(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    await this.flushAll()
  }
}

// Export singleton instance
export const logger = ComprehensiveLoggingService.getInstance()
