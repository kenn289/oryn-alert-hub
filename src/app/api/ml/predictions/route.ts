import { NextRequest, NextResponse } from 'next/server'
import { mlPredictionStabilizationService } from '@/lib/ml-prediction-stabilization-service'

// GET /api/ml/predictions - Get ML predictions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbols = searchParams.get('symbols')
    const action = searchParams.get('action')

    if (action === 'metrics') {
      const metrics = await mlPredictionStabilizationService.getPredictionMetrics()
      return NextResponse.json({ metrics })
    }

    if (action === 'clear-cache') {
      mlPredictionStabilizationService.clearCache()
      return NextResponse.json({ 
        success: true, 
        message: 'ML prediction cache cleared successfully' 
      })
    }

    if (!symbols) {
      return NextResponse.json({ error: 'Symbols parameter is required' }, { status: 400 })
    }

    const symbolList = symbols.split(',').map(s => s.trim().toUpperCase())
    const predictions = await mlPredictionStabilizationService.generateStabilizedPredictions(symbolList)
    
    return NextResponse.json({
      predictions,
      total: predictions.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('ML predictions error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate ML predictions',
      fallback: true
    }, { status: 500 })
  }
}

// POST /api/ml/predictions - Generate predictions for specific symbols
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symbols, forceRefresh = false } = body

    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json({ error: 'Symbols array is required' }, { status: 400 })
    }

    if (forceRefresh) {
      mlPredictionStabilizationService.clearCache()
    }

    const predictions = await mlPredictionStabilizationService.generateStabilizedPredictions(symbols)
    
    return NextResponse.json({
      success: true,
      predictions,
      total: predictions.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('ML predictions POST error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate ML predictions',
      fallback: true
    }, { status: 500 })
  }
}
