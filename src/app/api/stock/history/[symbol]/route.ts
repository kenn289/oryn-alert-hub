import { NextRequest, NextResponse } from 'next/server'

const suffixMap: Record<string, string> = {
  IN: '.NS',
  GB: '.L',
  UK: '.L',
  JP: '.T',
  AU: '.AX',
  CA: '.TO',
  DE: '.DE',
  FR: '.PA'
}

function getYahooSymbol(symbol: string, market?: string): string {
  const upper = (symbol || '').toUpperCase().trim()
  if (!market || upper.includes('.')) return upper
  if (market === 'IN' && /^\d+$/.test(upper)) return `${upper}.BO` // BSE codes
  const suffix = suffixMap[market] || ''
  return `${upper}${suffix}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const { searchParams } = new URL(request.url)
  const market = (searchParams.get('market') || undefined)?.toUpperCase()
  const range = searchParams.get('range') || '6mo'
  const interval = searchParams.get('interval') || '1d'

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
  }

  const yahooSymbol = getYahooSymbol(symbol, market)
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`

  try {
    const resp = await fetch(url)
    if (!resp.ok) {
      // Try a basic Indian suffix fallback if 4xx and market looks IN
      if ((resp.status === 404 || resp.status === 400) && !yahooSymbol.includes('.') && market === 'IN') {
        const retryUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol + '.NS')}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`
        const retry = await fetch(retryUrl)
        if (retry.ok) {
          const retryData = await retry.json()
          return NextResponse.json(parseYahooChart(retryData, symbol + '.NS', market, range, interval))
        }
      }
      return NextResponse.json({ error: `HTTP ${resp.status}`, symbol: yahooSymbol }, { status: resp.status })
    }

    const data = await resp.json()
    const parsed = parseYahooChart(data, yahooSymbol, market, range, interval)
    if (!parsed.candles || parsed.candles.length === 0) {
      return NextResponse.json({ error: 'No data available', symbol: yahooSymbol }, { status: 404 })
    }
    return NextResponse.json(parsed)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

function parseYahooChart(data: any, symbol: string, market: string | undefined, range: string, interval: string) {
  const result = data?.chart?.result?.[0]
  const timestamps: number[] = result?.timestamp || []
  const quote = result?.indicators?.quote?.[0] || {}
  const opens: number[] = quote.open || []
  const highs: number[] = quote.high || []
  const lows: number[] = quote.low || []
  const closes: number[] = quote.close || []
  const volumes: number[] = quote.volume || []

  const candles = [] as Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }>
  for (let i = 0; i < timestamps.length; i++) {
    const o = opens[i]
    const h = highs[i]
    const l = lows[i]
    const c = closes[i]
    const v = volumes[i]
    if ([o, h, l, c].every((x) => typeof x === 'number' && isFinite(x))) {
      candles.push({ time: timestamps[i], open: o, high: h, low: l, close: c, volume: typeof v === 'number' ? v : 0 })
    }
  }

  return {
    symbol,
    market,
    range,
    interval,
    candles
  }
}
