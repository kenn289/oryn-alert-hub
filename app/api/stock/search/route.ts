import { NextRequest, NextResponse } from 'next/server'
import { globalStockService } from '../../../../src/lib/global-stock-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    const results = await globalStockService.searchStocks(query, limit)
    
    return NextResponse.json({
      results,
      total: results.length,
      query
    })
  } catch (error) {
    console.error('Error searching stocks:', error)
    
    return NextResponse.json(
      { error: 'Failed to search stocks' },
      { status: 500 }
    )
  }
}

