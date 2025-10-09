import { NextRequest, NextResponse } from 'next/server'

// Yahoo Finance global search (covers NSE/BSE/US/UK/JP/etc.)
// Docs (informal): `https://query2.finance.yahoo.com/v1/finance/search?q=RELIANCE`

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()
    const market = normalizeMarket(searchParams.get('market') || undefined)
    const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10) || 30, 100)

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=${limit}&newsCount=0&enableFuzzyQuery=true&lang=en-US&quotesQueryId=tss_match_phrase_query`
    const response = await fetch(url, { next: { revalidate: 60 } })
    if (!response.ok) {
      return NextResponse.json({ error: `Upstream search HTTP ${response.status}` }, { status: 502 })
    }
    const data = await response.json()
    const quotes: any[] = Array.isArray(data.quotes) ? data.quotes : []

    const mapped = quotes
      .filter((q) => !!q.symbol && !!(q.shortname || q.longname || q.name))
      .map((q) => mapYahooQuote(q))
      .filter((r) => !!r.symbol)

    const filtered = market ? mapped.filter((r) => r.market === market) : mapped

    return NextResponse.json({
      query,
      market: market || 'all',
      results: dedupeBySymbol(filtered).slice(0, limit),
      total: filtered.length
    })
  } catch (error) {
    console.error('Global stock search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function mapYahooQuote(q: any) {
  const symbol: string = q.symbol
  const name: string = q.shortname || q.longname || q.name || symbol
  const currency: string | undefined = q.currency
  const market = inferMarketFromSymbol(symbol, q)
  return {
    symbol,
    name,
    market,
    currency: currency || defaultCurrencyForMarket(market)
  }
}

function normalizeMarket(input?: string): string | undefined {
  if (!input) return undefined
  const u = input.toUpperCase()
  if (u === 'UK') return 'GB'
  return u
}

function inferMarketFromSymbol(symbol: string, q?: any): string {
  const upper = symbol.toUpperCase()
  if (upper.endsWith('.NS') || upper.endsWith('.BO') || /^\d+$/.test(upper)) return 'IN'
  if (upper.endsWith('.L')) return 'GB'
  if (upper.endsWith('.T')) return 'JP'
  if (upper.endsWith('.AX')) return 'AU'
  if (upper.endsWith('.TO')) return 'CA'
  if (upper.endsWith('.DE')) return 'DE'
  if (upper.endsWith('.PA')) return 'FR'
  // Attempt to use region/exchange hints
  const exch: string = (q?.exchDisp || q?.exchange || '').toUpperCase()
  if (exch.includes('NSE') || exch.includes('BSE')) return 'IN'
  if (exch.includes('LSE')) return 'GB'
  if (exch.includes('TSE')) return 'JP'
  return 'US'
}

function defaultCurrencyForMarket(market?: string): string {
  switch (market) {
    case 'IN': return 'INR'
    case 'GB': return 'GBP'
    case 'JP': return 'JPY'
    case 'AU': return 'AUD'
    case 'CA': return 'CAD'
    case 'DE': return 'EUR'
    case 'FR': return 'EUR'
    default: return 'USD'
  }
}

function dedupeBySymbol(list: Array<{ symbol: string }>) {
  const seen = new Set<string>()
  const result: any[] = []
  for (const item of list) {
    if (!seen.has(item.symbol)) {
      seen.add(item.symbol)
      result.push(item)
    }
  }
  return result
}

