## Oryn: Real-time AI Market Analysis

Oryn provides transparent, real-time market data and machine learning price predictions for global stocks. The UI highlights inputs, signals, and confidence so you can understand why a prediction was made.

### Getting Started

```bash
npm run dev
```

Open `http://localhost:3000` and navigate to `Dashboard` to see AI Insights.

### Data Sources
- Yahoo Finance chart API for OHLCV and quotes
- Optional paid providers (IEX, Polygon) if keys are configured

### ML Model (v3.1.0-hist)
- Inputs: recent OHLCV history (default 6 months, 1d), live quote, sector context.
- Signals: SMA(20/50/200), RSI(14), MACD(12,26,9), ATR(14), support/resistance.
- Confidence: signal agreement, liquidity vs. average volume, volatility sweet-spot.
- Timeframe: derived from ATR% and market cap.
- Prediction: momentum-weighted forecast combining trend slope, MACD histogram, RSI bias, and confidence, with bounds scaled to volatility.

The model is implemented in `src/lib/real-ai-analysis-service.ts` and served in the UI via `src/components/AIInsights.tsx`.

### Historical Data API

We expose a history endpoint used by the model:

```http
GET /api/stock/history/:symbol?range=6mo&interval=1d&market=IN
```

Response includes `candles` array with `{ time, open, high, low, close, volume }`.

### Environment (optional)

Set any of the following to unlock additional providers:
- `IEX_CLOUD_API_KEY`
- `POLYGON_API_KEY`

With no keys, Yahoo Finance remains the default.

### Notes
- This application uses real market data. Predictions are for research; not financial advice.
