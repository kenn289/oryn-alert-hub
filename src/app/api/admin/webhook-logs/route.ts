import { NextRequest, NextResponse } from 'next/server'
import { webhookLoggingService } from '../../../../lib/webhook-logging-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'webhooks'
    const limit = parseInt(searchParams.get('limit') || '50')
    const eventType = searchParams.get('event_type')
    const status = searchParams.get('status')
    const source = searchParams.get('source')

    let result

    switch (type) {
      case 'webhooks':
        result = await webhookLoggingService.getWebhookEvents(limit, eventType || undefined, status || undefined)
        break

      case 'revenue':
        result = await webhookLoggingService.getRevenueLogs(limit, status || undefined, source || undefined)
        break

      case 'summary':
        result = await webhookLoggingService.getRevenueSummary()
        break

      default:
        return NextResponse.json({ error: 'Invalid type. Use: webhooks, revenue, or summary' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Webhook logs API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch webhook logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
