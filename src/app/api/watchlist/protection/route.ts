import { NextRequest, NextResponse } from 'next/server'
import { WatchlistProtectionService } from '@/lib/watchlist-protection-service'

// GET /api/watchlist/protection - Get backup history and validation status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    switch (action) {
      case 'backups':
        const backups = await WatchlistProtectionService.getBackupHistory(userId)
        return NextResponse.json({ backups })

      case 'validation':
        const validation = await WatchlistProtectionService.validateWatchlist(userId)
        const validationHistory = await WatchlistProtectionService.getValidationHistory(userId)
        return NextResponse.json({ validation, validationHistory })

      case 'validation-history':
        const history = await WatchlistProtectionService.getValidationHistory(userId)
        return NextResponse.json({ history })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Watchlist protection GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/watchlist/protection - Create backup or restore
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, backupId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    switch (action) {
      case 'create-backup':
        const backupResult = await WatchlistProtectionService.createBackup(
          userId, 
          body.backupType || 'manual',
          body.metadata
        )
        return NextResponse.json(backupResult)

      case 'restore':
        if (!backupId) {
          return NextResponse.json({ error: 'Backup ID is required for restore' }, { status: 400 })
        }
        const restoreResult = await WatchlistProtectionService.restoreFromBackup(userId, backupId)
        return NextResponse.json(restoreResult)

      case 'cleanup':
        const cleanupResult = await WatchlistProtectionService.cleanupOldBackups(userId)
        return NextResponse.json(cleanupResult)

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Watchlist protection POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
