import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  try {
    const markets = [
      { code: 'US', name: 'United States', currency: 'USD', exchanges: ['NYSE', 'NASDAQ'] },
      { code: 'IN', name: 'India', currency: 'INR', exchanges: ['NSE', 'BSE'] },
      { code: 'GB', name: 'United Kingdom', currency: 'GBP', exchanges: ['LSE'] },
      { code: 'JP', name: 'Japan', currency: 'JPY', exchanges: ['TSE'] },
      { code: 'AU', name: 'Australia', currency: 'AUD', exchanges: ['ASX'] },
      { code: 'CA', name: 'Canada', currency: 'CAD', exchanges: ['TSX'] },
      { code: 'DE', name: 'Germany', currency: 'EUR', exchanges: ['Xetra'] },
      { code: 'FR', name: 'France', currency: 'EUR', exchanges: ['Euronext Paris'] }
    ]
    return NextResponse.json({ markets })
  } catch (error) {
    console.error('Markets endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
