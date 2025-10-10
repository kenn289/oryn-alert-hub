import { NextRequest, NextResponse } from 'next/server'
import { ManualProService } from '@/lib/manual-pro-service'

// GET /api/admin/manual-pro - Get manual Pro grants and statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')

    switch (action) {
      case 'stats':
        const stats = await ManualProService.getManualProStats()
        return NextResponse.json({ stats })

      case 'grants':
        const grants = await ManualProService.getAllManualProGrants()
        return NextResponse.json({ grants })

      case 'users':
        const users = await ManualProService.getUsersWithManualProAccess()
        return NextResponse.json({ users })

      case 'user-grants':
        if (!userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }
        const userGrants = await ManualProService.getUserManualProGrants(userId)
        return NextResponse.json({ grants: userGrants })

      case 'cleanup':
        const cleanupResult = await ManualProService.cleanupExpiredManualProAccess()
        return NextResponse.json(cleanupResult)

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Manual Pro GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/manual-pro - Grant or revoke manual Pro access
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, grantedBy, revokedBy, reason, expiresAt } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    switch (action) {
      case 'grant':
        if (!grantedBy) {
          return NextResponse.json({ error: 'Granted by user ID is required' }, { status: 400 })
        }
        const grantResult = await ManualProService.grantManualProAccess({
          userId,
          grantedBy,
          reason,
          expiresAt
        })
        return NextResponse.json(grantResult)

      case 'revoke':
        if (!revokedBy) {
          return NextResponse.json({ error: 'Revoked by user ID is required' }, { status: 400 })
        }
        const revokeResult = await ManualProService.revokeManualProAccess({
          userId,
          revokedBy,
          reason
        })
        return NextResponse.json(revokeResult)

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Manual Pro POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
