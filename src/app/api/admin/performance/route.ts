import { NextRequest, NextResponse } from 'next/server'
import { performanceService } from '@/lib/performance-optimization-service'
import { supabase } from '@/lib/supabase'

// GET /api/admin/performance - Get performance metrics and statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'metrics':
        const metrics = performanceService.getPerformanceMetrics()
        return NextResponse.json({ metrics })

      case 'table-stats':
        const { data: tableStats, error: tableError } = await supabase
          .rpc('analyze_table_stats')
        
        if (tableError) {
          return NextResponse.json({ error: 'Failed to get table statistics' }, { status: 500 })
        }
        return NextResponse.json({ tableStats })

      case 'slow-queries':
        const { data: slowQueries, error: queriesError } = await supabase
          .rpc('get_slow_queries')
        
        if (queriesError) {
          return NextResponse.json({ error: 'Failed to get slow queries' }, { status: 500 })
        }
        return NextResponse.json({ slowQueries })

      case 'monitoring':
        const { data: monitoring, error: monitoringError } = await supabase
          .from('performance_monitoring')
          .select('*')
        
        if (monitoringError) {
          return NextResponse.json({ error: 'Failed to get monitoring data' }, { status: 500 })
        }
        return NextResponse.json({ monitoring })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Performance GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/performance - Optimize performance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'optimize-indexes':
        const indexResult = await performanceService.optimizeIndexes()
        return NextResponse.json(indexResult)

      case 'warmup-cache':
        await performanceService.warmupCache()
        return NextResponse.json({ 
          success: true, 
          message: 'Cache warmup completed successfully' 
        })

      case 'clear-cache':
        performanceService.clearCache()
        return NextResponse.json({ 
          success: true, 
          message: 'Cache cleared successfully' 
        })

      case 'optimize-tables':
        const { data: optimizeResult, error: optimizeError } = await supabase
          .rpc('optimize_tables')
        
        if (optimizeError) {
          return NextResponse.json({ error: 'Failed to optimize tables' }, { status: 500 })
        }
        return NextResponse.json({ 
          success: true, 
          message: 'Tables optimized successfully',
          result: optimizeResult
        })

      case 'preload-data':
        const { userId } = body
        if (!userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }
        
        await performanceService.preloadData(userId)
        return NextResponse.json({ 
          success: true, 
          message: 'Data preloaded successfully' 
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Performance POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
