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
      // Include defence, pharma, automotive, and other sectors (Yahoo-compatible symbols)
      return [
        // Large Cap - Blue Chips
        { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd', sector: 'Energy' },
        { symbol: 'TCS.NS', name: 'Tata Consultancy Services Ltd', sector: 'Technology' },
        { symbol: 'INFY.NS', name: 'Infosys Ltd', sector: 'Technology' },
        { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Ltd', sector: 'Financial Services' },
        { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Ltd', sector: 'Financial Services' },
        
        // Defence Stocks (as requested)
        { symbol: 'BEL.NS', name: 'Bharat Electronics Ltd', sector: 'Defence' },
        { symbol: 'HAL.NS', name: 'Hindustan Aeronautics Ltd', sector: 'Defence' },
        { symbol: 'BEML.NS', name: 'BEML Ltd', sector: 'Defence' },
        { symbol: 'BDL.NS', name: 'Bharat Dynamics Ltd', sector: 'Defence' },
        { symbol: 'MAZDOCK.NS', name: 'Mazagon Dock Shipbuilders', sector: 'Defence' },
        { symbol: 'COCHINSHIP.NS', name: 'Cochin Shipyard Ltd', sector: 'Defence' },
        { symbol: 'GRSE.NS', name: 'Garden Reach Shipbuilders', sector: 'Defence' },
        
        // Pharma (including Pfizer as requested)
        { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Industries', sector: 'Pharma' },
        { symbol: 'DRREDDY.NS', name: 'Dr. Reddy\'s Laboratories', sector: 'Pharma' },
        { symbol: 'CIPLA.NS', name: 'Cipla Ltd', sector: 'Pharma' },
        { symbol: 'DIVISLAB.NS', name: 'Divi\'s Laboratories', sector: 'Pharma' },
        { symbol: 'LUPIN.NS', name: 'Lupin Ltd', sector: 'Pharma' },
        { symbol: 'PFIZER.NS', name: 'Pfizer Ltd', sector: 'Pharma' },
        { symbol: 'BIOCON.NS', name: 'Biocon Ltd', sector: 'Pharma' },
        { symbol: 'AUROPHARMA.NS', name: 'Aurobindo Pharma Ltd', sector: 'Pharma' },
        
        // Automotive (including M&M as requested)
        { symbol: 'MARUTI.NS', name: 'Maruti Suzuki India Ltd', sector: 'Automotive' },
        { symbol: 'M&M.NS', name: 'Mahindra & Mahindra Ltd', sector: 'Automotive' },
        { symbol: 'TATAMOTORS.NS', name: 'Tata Motors Ltd', sector: 'Automotive' },
        { symbol: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto Ltd', sector: 'Automotive' },
        { symbol: 'HEROMOTOCO.NS', name: 'Hero MotoCorp Ltd', sector: 'Automotive' },
        { symbol: 'EICHERMOT.NS', name: 'Eicher Motors Ltd', sector: 'Automotive' },
        
        // Technology & IT
        { symbol: 'WIPRO.NS', name: 'Wipro Ltd', sector: 'Technology' },
        { symbol: 'HCLTECH.NS', name: 'HCL Technologies Ltd', sector: 'Technology' },
        { symbol: 'TECHM.NS', name: 'Tech Mahindra Ltd', sector: 'Technology' },
        { symbol: 'TATAELXSI.NS', name: 'Tata Elxsi Ltd', sector: 'Technology' },
        
        // Financial Services
        { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank Ltd', sector: 'Financial Services' },
        { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Financial Services' },
        { symbol: 'AXISBANK.NS', name: 'Axis Bank Ltd', sector: 'Financial Services' },
        { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Ltd', sector: 'Financial Services' },
        
        // Consumer Goods
        { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Ltd', sector: 'Consumer Goods' },
        { symbol: 'ITC.NS', name: 'ITC Ltd', sector: 'Consumer Goods' },
        { symbol: 'NESTLEIND.NS', name: 'Nestle India Ltd', sector: 'Consumer Goods' },
        { symbol: 'BRITANNIA.NS', name: 'Britannia Industries Ltd', sector: 'Consumer Goods' },
        
        // Industrials & Infrastructure
        { symbol: 'LT.NS', name: 'Larsen & Toubro Ltd', sector: 'Industrials' },
        { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement Ltd', sector: 'Cement' },
        { symbol: 'ADANIPORTS.NS', name: 'Adani Ports & SEZ Ltd', sector: 'Infrastructure' },
        
        // Chemicals
        { symbol: 'DEEPAKNTR.NS', name: 'Deepak Nitrite Ltd', sector: 'Chemicals' },
        { symbol: 'ATUL.NS', name: 'Atul Ltd', sector: 'Chemicals' },
        
        // Telecom
        { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd', sector: 'Telecommunications' },
        
        // Metals & Mining
        { symbol: 'TATASTEEL.NS', name: 'Tata Steel Ltd', sector: 'Metals' },
        { symbol: 'JSWSTEEL.NS', name: 'JSW Steel Ltd', sector: 'Metals' },
        { symbol: 'HINDALCO.NS', name: 'Hindalco Industries Ltd', sector: 'Metals' },
        
        // Energy & Oil
        { symbol: 'ONGC.NS', name: 'Oil & Natural Gas Corp Ltd', sector: 'Energy' },
        { symbol: 'BPCL.NS', name: 'Bharat Petroleum Corp Ltd', sector: 'Energy' },
        { symbol: 'COALINDIA.NS', name: 'Coal India Ltd', sector: 'Energy' }
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

