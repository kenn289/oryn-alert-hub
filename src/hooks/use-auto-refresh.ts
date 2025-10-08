/**
 * Auto Refresh Hook
 * 
 * React hook for automatic background data refresh
 */

import { useEffect, useState, useCallback } from 'react'
import { AutoRefreshService, RefreshData } from '../lib/auto-refresh-service'

export interface UseAutoRefreshReturn {
  data: RefreshData | null
  isRefreshing: boolean
  isRunning: boolean
  lastUpdated: string | null
  forceRefresh: () => Promise<void>
  startRefresh: () => void
  stopRefresh: () => void
}

export function useAutoRefresh(): UseAutoRefreshReturn {
  const [data, setData] = useState<RefreshData | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const autoRefreshService = AutoRefreshService.getInstance()

  const handleRefresh = useCallback((refreshData: RefreshData) => {
    setData(refreshData)
    setLastUpdated(refreshData.lastUpdated)
    setIsRefreshing(false)
  }, [])

  const forceRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const refreshData = await autoRefreshService.forceRefresh()
      if (refreshData) {
        setData(refreshData)
        setLastUpdated(refreshData.lastUpdated)
      }
    } catch (error) {
      console.error('Error during force refresh:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [autoRefreshService])

  const startRefresh = useCallback(() => {
    autoRefreshService.startAutoRefresh()
    setIsRunning(true)
  }, [autoRefreshService])

  const stopRefresh = useCallback(() => {
    autoRefreshService.stopAutoRefresh()
    setIsRunning(false)
  }, [autoRefreshService])

  useEffect(() => {
    // Subscribe to refresh updates
    const unsubscribe = autoRefreshService.subscribe(handleRefresh)

    // Start auto refresh
    startRefresh()

    // Get initial data if available
    const initialData = autoRefreshService.getLastRefreshData()
    if (initialData) {
      setData(initialData)
      setLastUpdated(initialData.lastUpdated)
    }

    return () => {
      unsubscribe()
      stopRefresh()
    }
  }, [handleRefresh, startRefresh, stopRefresh, autoRefreshService])

  return {
    data,
    isRefreshing,
    isRunning,
    lastUpdated,
    forceRefresh,
    startRefresh,
    stopRefresh
  }
}
