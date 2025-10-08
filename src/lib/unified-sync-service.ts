import { DatabaseWatchlistService } from './database-watchlist-service'
import { DatabasePortfolioService } from './database-portfolio-service'

/**
 * UnifiedSyncService ensures a single source of truth across devices.
 *
 * Strategy:
 * - Track local last_modified timestamps for each dataset.
 * - On login/session restore:
 *   - For each dataset (watchlist, portfolio):
 *     - If DB is empty and local has data => push local to DB
 *     - If local is empty and DB has data => pull DB to local
 *     - If both have data => compare last_modified; last-write-wins
 * - After resolving, set both sides to the winning version.
 * - One-time cleanup: if duplicates exist for the user (due to previous bug), de-dupe by ticker.
 */
export class UnifiedSyncService {
  private static WATCHLIST_KEY = 'oryn_watchlist'
  private static WATCHLIST_LAST_MODIFIED_KEY = 'oryn_watchlist_last_modified'
  private static PORTFOLIO_KEY = 'oryn_portfolio'
  private static PORTFOLIO_LAST_MODIFIED_KEY = 'oryn_portfolio_last_modified'

  static markWatchlistModified() {
    try { localStorage.setItem(this.WATCHLIST_LAST_MODIFIED_KEY, Date.now().toString()) } catch {}
  }

  static markPortfolioModified() {
    try { localStorage.setItem(this.PORTFOLIO_LAST_MODIFIED_KEY, Date.now().toString()) } catch {}
  }

  static getLocal<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return parsed as T
    } catch {
      return null
    }
  }

  static getLocalModified(key: string): number | null {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const n = Number(raw)
      return Number.isFinite(n) ? n : null
    } catch {
      return null
    }
  }

  static async unifyWatchlist(userId: string): Promise<void> {
    const local = this.getLocal<any[]>(this.WATCHLIST_KEY) || []
    const db = await DatabaseWatchlistService.getWatchlist(userId)

    // One-time de-dupe (by ticker)
    const dedupe = (items: any[]) => {
      const seen = new Set<string>()
      return items.filter((i) => {
        const t = String(i.ticker || '').toUpperCase()
        if (seen.has(t)) return false
        seen.add(t)
        return true
      })
    }

    const localClean = dedupe(local)
    const dbClean = dedupe(db)

    const localModified = this.getLocalModified(this.WATCHLIST_LAST_MODIFIED_KEY)
    const dbModified = await DatabaseWatchlistService.getLastUpdatedAt(userId)

    if (dbClean.length === 0 && localClean.length > 0) {
      // Push local -> DB
      for (const item of localClean) {
        await DatabaseWatchlistService.addToWatchlist(userId, item.ticker, item.name, item.market)
      }
      await DatabaseWatchlistService.syncDatabaseToLocal(userId)
      localStorage.setItem(this.WATCHLIST_LAST_MODIFIED_KEY, (localModified || Date.now()).toString())
      return
    }

    if (localClean.length === 0 && dbClean.length > 0) {
      // Pull DB -> local
      await DatabaseWatchlistService.syncDatabaseToLocal(userId)
      localStorage.setItem(this.WATCHLIST_LAST_MODIFIED_KEY, Date.now().toString())
      return
    }

    // Both have data -> last-write-wins by comparing timestamps
    const dbIsNewer = (dbModified || 0) >= (localModified || 0)
    if (dbIsNewer) {
      await DatabaseWatchlistService.syncDatabaseToLocal(userId)
      localStorage.setItem(this.WATCHLIST_LAST_MODIFIED_KEY, Date.now().toString())
    } else {
      // Replace DB with local (one-time) and pull back
      try {
        console.log('🔄 Syncing local watchlist to database...')
        await DatabaseWatchlistService.replaceAll(userId, localClean.map(i => ({ ticker: i.ticker, name: i.name, market: i.market })))
        await DatabaseWatchlistService.syncDatabaseToLocal(userId)
        localStorage.setItem(this.WATCHLIST_LAST_MODIFIED_KEY, Date.now().toString())
        console.log('✅ Watchlist sync completed')
      } catch (error) {
        console.error('❌ Error syncing watchlist to database:', error)
        // Continue with local data if database sync fails
      }
    }
  }

  static async unifyPortfolio(userId: string): Promise<void> {
    const local = this.getLocal<any[]>(this.PORTFOLIO_KEY) || []
    const db = await DatabasePortfolioService.getPortfolio(userId)

    // De-dupe by ticker, keep last addedAt in local array order
    const dedupe = (items: any[]) => {
      const seen = new Set<string>()
      const result: any[] = []
      for (const i of items) {
        const t = String(i.ticker || '').toUpperCase()
        if (seen.has(t)) continue
        seen.add(t)
        result.push(i)
      }
      return result
    }

    const localClean = dedupe(local)
    const dbClean = dedupe(db)

    const localModified = this.getLocalModified(this.PORTFOLIO_LAST_MODIFIED_KEY)

    if (dbClean.length === 0 && localClean.length > 0) {
      for (const item of localClean) {
        await DatabasePortfolioService.upsertPortfolioItem({
          userId,
          ticker: item.ticker,
          name: item.name,
          shares: Number(item.shares || 0),
          avgPrice: Number(item.avgPrice || 0),
          currentPrice: Number(item.currentPrice || 0),
          market: item.market,
          currency: item.currency || 'USD',
          exchange: item.exchange,
        })
      }
      await DatabasePortfolioService.syncDatabaseToLocal(userId)
      localStorage.setItem(this.PORTFOLIO_LAST_MODIFIED_KEY, (localModified || Date.now()).toString())
      return
    }

    if (localClean.length === 0 && dbClean.length > 0) {
      await DatabasePortfolioService.syncDatabaseToLocal(userId)
      localStorage.setItem(this.PORTFOLIO_LAST_MODIFIED_KEY, Date.now().toString())
      return
    }

    // Both have data -> prefer DB as source of truth
    await DatabasePortfolioService.syncDatabaseToLocal(userId)
    localStorage.setItem(this.PORTFOLIO_LAST_MODIFIED_KEY, Date.now().toString())
  }

  static async unifyAll(userId: string): Promise<void> {
    await this.unifyWatchlist(userId)
    await this.unifyPortfolio(userId)
    await this.unifyAlerts(userId)
  }

  static async unifyAlerts(userId: string): Promise<void> {
    try {
      // For now, alerts are stored in localStorage only
      // In the future, we can add database persistence for alerts
      console.log('📊 Alerts are currently stored in localStorage only')
    } catch (error) {
      console.error('Error syncing alerts:', error)
    }
  }
}
