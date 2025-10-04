// Real-time support service with WebSocket-like functionality
export class RealtimeSupportService {
  private listeners: Set<() => void> = new Set()
  private refreshInterval: NodeJS.Timeout | null = null
  private isConnected = false

  constructor() {
    this.startPolling()
  }

  // Subscribe to real-time updates
  subscribe(callback: () => void) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  // Start polling for updates
  private startPolling() {
    if (this.refreshInterval) return
    
    this.isConnected = true
    this.refreshInterval = setInterval(() => {
      this.notifyListeners()
    }, 5000) // Poll every 5 seconds
  }

  // Stop polling
  stopPolling() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
    this.isConnected = false
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(callback => callback())
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected
  }

  // Force refresh
  refresh() {
    this.notifyListeners()
  }
}

// Global instance
export const realtimeSupportService = new RealtimeSupportService()
