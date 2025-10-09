import { NextResponse } from 'next/server'
import { multiApiStockService } from '../../../../src/lib/multi-api-stock-service'

export async function GET() {
  try {
    const apiStatus = multiApiStockService.getApiStatus()
    
    return NextResponse.json({
      apis: apiStatus,
      totalApis: apiStatus.length,
      enabledApis: apiStatus.filter(api => api.enabled).length,
      rateLimitedApis: apiStatus.filter(api => api.rateLimited).length,
      availableApis: apiStatus.filter(api => api.enabled && !api.rateLimited).length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting API status:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to get API status',
        apis: [],
        totalApis: 0,
        enabledApis: 0,
        rateLimitedApis: 0,
        availableApis: 0,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}





