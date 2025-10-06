import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const market = normalizeMarket(searchParams.get('market') || 'US')

    const stocks = getPopularStocks(market)
    return NextResponse.json({ market, stocks })
  } catch (error) {
    console.error('Popular stocks endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function normalizeMarket(input?: string) {
  const u = (input || 'US').toUpperCase()
  return u === 'UK' ? 'GB' : u
}

function getPopularStocks(market: string) {
  switch (market) {
    case 'IN':
      // Include defence, pharma, small/mid caps as examples (Yahoo-compatible symbols)
      return [
        { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd', sector: 'Energy' },
        { symbol: 'TCS.NS', name: 'Tata Consultancy Services Ltd', sector: 'Technology' },
        { symbol: 'INFY.NS', name: 'Infosys Ltd', sector: 'Technology' },
        { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', sector: 'Financial Services' },
        { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd', sector: 'Financial Services' },
        // Defence
        { symbol: 'BEL.NS', name: 'Bharat Electronics Ltd', sector: 'Defence' },
        { symbol: 'HAL.NS', name: 'Hindustan Aeronautics Ltd', sector: 'Defence' },
        { symbol: 'BDL.NS', name: 'Bharat Dynamics Ltd', sector: 'Defence' },
        { symbol: 'MAZDOCK.NS', name: 'Mazagon Dock Shipbuilders', sector: 'Defence' },
        { symbol: 'COCHINSHIP.NS', name: 'Cochin Shipyard Ltd', sector: 'Defence' },
        // Pharma
        { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Industries', sector: 'Pharma' },
        { symbol: 'DRREDDY.NS', name: 'Dr. Reddy\'s Laboratories', sector: 'Pharma' },
        { symbol: 'CIPLA.NS', name: 'Cipla Ltd', sector: 'Pharma' },
        { symbol: 'DIVISLAB.NS', name: 'Divi\'s Laboratories', sector: 'Pharma' },
        { symbol: 'LUPIN.NS', name: 'Lupin Ltd', sector: 'Pharma' },
        // Small/Mid cap examples
        { symbol: 'DEEPAKNTR.NS', name: 'Deepak Nitrite Ltd', sector: 'Chemicals' },
        { symbol: 'TATAELXSI.NS', name: 'Tata Elxsi Ltd', sector: 'Technology' },
        { symbol: 'ATUL.NS', name: 'Atul Ltd', sector: 'Chemicals' }
      ]
    case 'GB':
      return [
        { symbol: 'VOD.L', name: 'Vodafone Group PLC', sector: 'Telecom' },
        { symbol: 'BP.L', name: 'BP PLC', sector: 'Energy' },
        { symbol: 'HSBA.L', name: 'HSBC Holdings PLC', sector: 'Financials' }
      ]
    case 'JP':
      return [
        { symbol: '7203.T', name: 'Toyota Motor Corporation', sector: 'Automotive' },
        { symbol: '6758.T', name: 'Sony Group Corporation', sector: 'Technology' }
      ]
    default:
      return [
        { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' }
      ]
  }
}
