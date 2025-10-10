import { supabase } from './supabase'
import { WatchlistItem } from './watchlist-service'

export interface WatchlistBackup {
  id: string
  user_id: string
  backup_data: WatchlistItem[]
  backup_type: 'automatic' | 'manual' | 'before_delete' | 'before_update'
  created_at: string
  metadata?: {
    reason?: string
    trigger?: string
    item_count?: number
  }
}

export interface WatchlistValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

export class WatchlistProtectionService {
  private static BACKUP_TABLE = 'watchlist_backups'
  private static VALIDATION_TABLE = 'watchlist_validation_logs'

  /**
   * Create a backup of user's watchlist
   */
  static async createBackup(
    userId: string, 
    backupType: WatchlistBackup['backup_type'] = 'automatic',
    metadata?: WatchlistBackup['metadata']
  ): Promise<{ success: boolean; backupId?: string; message: string }> {
    try {
      // Get current watchlist
      const { data: watchlistData, error: fetchError } = await supabase
        .from('watchlists')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: false })

      if (fetchError) {
        console.error('Error fetching watchlist for backup:', fetchError)
        return { success: false, message: 'Failed to fetch watchlist for backup' }
      }

      // Convert to WatchlistItem format
      const watchlistItems: WatchlistItem[] = (watchlistData || []).map(item => ({
        id: item.id,
        ticker: item.ticker,
        name: item.name,
        price: item.price,
        change: item.change,
        changePercent: item.change_percent,
        market: item.market,
        currency: item.currency,
        addedAt: item.added_at
      }))

      // Create backup record
      const { data: backupData, error: backupError } = await supabase
        .from(this.BACKUP_TABLE)
        .insert({
          user_id: userId,
          backup_data: watchlistItems,
          backup_type: backupType,
          metadata: {
            item_count: watchlistItems.length,
            ...metadata
          }
        })
        .select('id')
        .single()

      if (backupError) {
        console.error('Error creating watchlist backup:', backupError)
        return { success: false, message: 'Failed to create backup' }
      }

      console.log(`✅ Watchlist backup created: ${backupData.id} (${watchlistItems.length} items)`)
      return { 
        success: true, 
        backupId: backupData.id, 
        message: `Backup created with ${watchlistItems.length} items` 
      }
    } catch (error) {
      console.error('WatchlistProtectionService.createBackup error:', error)
      return { success: false, message: 'Failed to create backup' }
    }
  }

  /**
   * Validate watchlist data integrity
   */
  static async validateWatchlist(userId: string): Promise<WatchlistValidationResult> {
    const result: WatchlistValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    }

    try {
      // Get current watchlist
      const { data: watchlistData, error } = await supabase
        .from('watchlists')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        result.isValid = false
        result.errors.push(`Database error: ${error.message}`)
        return result
      }

      const watchlist = watchlistData || []

      // Check for duplicate tickers
      const tickers = watchlist.map(item => item.ticker)
      const duplicateTickers = tickers.filter((ticker, index) => tickers.indexOf(ticker) !== index)
      if (duplicateTickers.length > 0) {
        result.isValid = false
        result.errors.push(`Duplicate tickers found: ${duplicateTickers.join(', ')}`)
      }

      // Check for invalid tickers
      const invalidTickers = watchlist.filter(item => 
        !item.ticker || 
        item.ticker.length === 0 || 
        item.ticker.length > 10 ||
        !/^[A-Z0-9.-]+$/.test(item.ticker)
      )
      if (invalidTickers.length > 0) {
        result.isValid = false
        result.errors.push(`Invalid ticker format: ${invalidTickers.map(item => item.ticker).join(', ')}`)
      }

      // Check for missing names
      const missingNames = watchlist.filter(item => !item.name || item.name.trim().length === 0)
      if (missingNames.length > 0) {
        result.warnings.push(`Items with missing names: ${missingNames.map(item => item.ticker).join(', ')}`)
      }

      // Check for very old items (older than 1 year)
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      const oldItems = watchlist.filter(item => new Date(item.added_at) < oneYearAgo)
      if (oldItems.length > 0) {
        result.suggestions.push(`Consider reviewing old items: ${oldItems.map(item => item.ticker).join(', ')}`)
      }

      // Check for items with zero price (might be delisted)
      const zeroPriceItems = watchlist.filter(item => item.price === 0)
      if (zeroPriceItems.length > 0) {
        result.warnings.push(`Items with zero price (might be delisted): ${zeroPriceItems.map(item => item.ticker).join(', ')}`)
      }

      // Log validation result
      await this.logValidationResult(userId, result)

      return result
    } catch (error) {
      console.error('WatchlistProtectionService.validateWatchlist error:', error)
      result.isValid = false
      result.errors.push(`Validation error: ${error.message}`)
      return result
    }
  }

  /**
   * Restore watchlist from backup
   */
  static async restoreFromBackup(
    userId: string, 
    backupId: string
  ): Promise<{ success: boolean; message: string; restoredCount?: number }> {
    try {
      // Get backup data
      const { data: backupData, error: backupError } = await supabase
        .from(this.BACKUP_TABLE)
        .select('backup_data')
        .eq('id', backupId)
        .eq('user_id', userId)
        .single()

      if (backupError || !backupData) {
        return { success: false, message: 'Backup not found or access denied' }
      }

      // Create backup before restore
      await this.createBackup(userId, 'before_update', { reason: 'Before restore from backup' })

      // Clear current watchlist
      const { error: deleteError } = await supabase
        .from('watchlists')
        .delete()
        .eq('user_id', userId)

      if (deleteError) {
        console.error('Error clearing watchlist before restore:', deleteError)
        return { success: false, message: 'Failed to clear current watchlist' }
      }

      // Restore from backup
      const watchlistItems = backupData.backup_data as WatchlistItem[]
      const itemsToInsert = watchlistItems.map(item => ({
        user_id: userId,
        ticker: item.ticker,
        name: item.name,
        price: item.price,
        change: item.change,
        change_percent: item.changePercent,
        market: item.market,
        currency: item.currency,
        added_at: item.addedAt
      }))

      const { error: insertError } = await supabase
        .from('watchlists')
        .insert(itemsToInsert)

      if (insertError) {
        console.error('Error restoring watchlist:', insertError)
        return { success: false, message: 'Failed to restore watchlist' }
      }

      console.log(`✅ Watchlist restored from backup: ${watchlistItems.length} items`)
      return { 
        success: true, 
        message: `Restored ${watchlistItems.length} items from backup`,
        restoredCount: watchlistItems.length
      }
    } catch (error) {
      console.error('WatchlistProtectionService.restoreFromBackup error:', error)
      return { success: false, message: 'Failed to restore from backup' }
    }
  }

  /**
   * Get user's backup history
   */
  static async getBackupHistory(userId: string): Promise<WatchlistBackup[]> {
    try {
      const { data, error } = await supabase
        .from(this.BACKUP_TABLE)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching backup history:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('WatchlistProtectionService.getBackupHistory error:', error)
      return []
    }
  }

  /**
   * Clean up old backups (keep last 10)
   */
  static async cleanupOldBackups(userId: string): Promise<{ success: boolean; deletedCount: number }> {
    try {
      // Get all backups for user
      const { data: backups, error: fetchError } = await supabase
        .from(this.BACKUP_TABLE)
        .select('id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('Error fetching backups for cleanup:', fetchError)
        return { success: false, deletedCount: 0 }
      }

      // Keep last 10 backups
      const backupsToDelete = (backups || []).slice(10)
      if (backupsToDelete.length === 0) {
        return { success: true, deletedCount: 0 }
      }

      const backupIds = backupsToDelete.map(backup => backup.id)
      const { error: deleteError } = await supabase
        .from(this.BACKUP_TABLE)
        .delete()
        .in('id', backupIds)

      if (deleteError) {
        console.error('Error deleting old backups:', deleteError)
        return { success: false, deletedCount: 0 }
      }

      console.log(`✅ Cleaned up ${backupsToDelete.length} old backups`)
      return { success: true, deletedCount: backupsToDelete.length }
    } catch (error) {
      console.error('WatchlistProtectionService.cleanupOldBackups error:', error)
      return { success: false, deletedCount: 0 }
    }
  }

  /**
   * Log validation result
   */
  private static async logValidationResult(
    userId: string, 
    result: WatchlistValidationResult
  ): Promise<void> {
    try {
      await supabase
        .from(this.VALIDATION_TABLE)
        .insert({
          user_id: userId,
          is_valid: result.isValid,
          error_count: result.errors.length,
          warning_count: result.warnings.length,
          suggestion_count: result.suggestions.length,
          errors: result.errors,
          warnings: result.warnings,
          suggestions: result.suggestions
        })
    } catch (error) {
      console.error('Error logging validation result:', error)
    }
  }

  /**
   * Get validation history
   */
  static async getValidationHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from(this.VALIDATION_TABLE)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error fetching validation history:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('WatchlistProtectionService.getValidationHistory error:', error)
      return []
    }
  }
}
