# 🚀 Oryn Alert Hub - Production Architecture

## Overview

A world-class, production-ready architecture for the Oryn Alert Hub platform, designed for scalability, performance, and reliability.

## 🏗️ System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (Supabase)    │
│                 │    │                 │    │                 │
│ • React 18      │    │ • Express.js    │    │ • PostgreSQL    │
│ • TypeScript    │    │ • TypeScript    │    │ • Redis Cache   │
│ • Tailwind CSS  │    │ • Socket.io    │    │ • Row Level     │
│ • Zustand       │    │ • ML Models     │    │   Security      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN/Edge      │    │   ML Pipeline   │    │   Monitoring    │
│   (Cloudflare)  │    │   (TensorFlow)  │    │   (Prometheus)   │
│                 │    │                 │    │                 │
│ • Global Cache  │    │ • Price Predict │    │ • Metrics       │
│ • DDoS Protect  │    │ • Sentiment     │    │ • Logging       │
│ • SSL/TLS       │    │ • Technical     │    │ • Alerting      │
│ • Compression   │    │   Analysis      │    │ • Health Checks │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Backend Architecture

### Core Services

#### 1. **API Gateway Service**
```typescript
// High-performance API gateway with rate limiting
class APIGateway {
  private rateLimiter: RateLimiter;
  private authService: AuthService;
  private cacheService: CacheService;

  async handleRequest(req: Request, res: Response) {
    // Rate limiting
    if (!await this.rateLimiter.check(req.ip)) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    // Authentication
    const user = await this.authService.authenticate(req);
    if (!user && req.path.startsWith('/api/protected')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Cache check
    const cached = await this.cacheService.get(req.url);
    if (cached) {
      return res.json(cached);
    }

    // Process request
    const result = await this.processRequest(req, user);
    
    // Cache result
    await this.cacheService.set(req.url, result, 300);
    
    return res.json(result);
  }
}
```

#### 2. **Stock Data Service**
```typescript
// Multi-source stock data aggregation
class StockDataService {
  private sources: Map<string, StockDataSource> = new Map();
  private cacheService: CacheService;
  private mlService: MLService;

  async getStockData(symbol: string): Promise<StockData> {
    // Check cache first
    const cached = await this.cacheService.get(`stock:${symbol}`);
    if (cached) return cached;

    // Fetch from multiple sources
    const promises = Array.from(this.sources.values())
      .map(source => source.fetch(symbol));
    
    const results = await Promise.allSettled(promises);
    const validResults = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<StockData>).value);

    // Aggregate and validate data
    const aggregated = this.aggregateData(validResults);
    
    // Cache result
    await this.cacheService.set(`stock:${symbol}`, aggregated, 60);
    
    return aggregated;
  }

  private aggregateData(results: StockData[]): StockData {
    // Weighted average based on source reliability
    const weights = { yahoo: 0.4, alpha_vantage: 0.3, polygon: 0.3 };
    
    return {
      symbol: results[0].symbol,
      price: this.weightedAverage(results.map(r => r.price), weights),
      change: this.weightedAverage(results.map(r => r.change), weights),
      volume: Math.max(...results.map(r => r.volume)),
      timestamp: new Date(),
      confidence: this.calculateConfidence(results)
    };
  }
}
```

#### 3. **ML Prediction Service**
```typescript
// Advanced ML prediction service
class MLPredictionService {
  private models: Map<string, tf.LayersModel> = new Map();
  private cacheService: CacheService;
  private stockService: StockDataService;

  async generatePrediction(symbol: string): Promise<MLPrediction> {
    // Get historical data
    const historicalData = await this.stockService.getHistoricalData(symbol, '6mo');
    
    // Calculate technical indicators
    const indicators = this.calculateTechnicalIndicators(historicalData);
    
    // Run ML models
    const priceModel = this.models.get('price-prediction');
    const sentimentModel = this.models.get('sentiment-analysis');
    
    const pricePrediction = await this.runPriceModel(priceModel, indicators);
    const sentiment = await this.runSentimentModel(sentimentModel, symbol);
    
    // Combine predictions
    const finalPrediction = this.combinePredictions(pricePrediction, sentiment);
    
    return {
      symbol,
      currentPrice: historicalData[historicalData.length - 1].close,
      predictedPrice: finalPrediction.price,
      confidence: finalPrediction.confidence,
      timeframe: finalPrediction.timeframe,
      reasoning: this.generateReasoning(indicators, finalPrediction),
      technicalIndicators: indicators,
      marketSentiment: sentiment.overall,
      riskFactors: this.identifyRiskFactors(indicators),
      recommendation: this.generateRecommendation(finalPrediction)
    };
  }

  private async runPriceModel(model: tf.LayersModel, indicators: any): Promise<any> {
    const input = tf.tensor2d([
      [
        indicators.rsi,
        indicators.macd,
        indicators.sma20,
        indicators.sma50,
        indicators.sma200,
        indicators.volume,
        indicators.volatility
      ]
    ]);
    
    const prediction = model.predict(input) as tf.Tensor;
    const result = await prediction.data();
    
    return {
      price: result[0],
      confidence: result[1],
      timeframe: '3-5 days'
    };
  }
}
```

#### 4. **Real-time WebSocket Service**
```typescript
// High-performance WebSocket service
class WebSocketService {
  private io: Server;
  private connectedClients: Map<string, Socket> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map();

  constructor(server: Server) {
    this.io = new Server(server, {
      cors: { origin: process.env.CORS_ORIGINS?.split(',') },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.connectedClients.set(socket.id, socket);
      
      socket.on('subscribe', (symbol: string) => {
        this.subscribeToSymbol(socket.id, symbol);
      });

      socket.on('unsubscribe', (symbol: string) => {
        this.unsubscribeFromSymbol(socket.id, symbol);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket.id);
      });
    });
  }

  async broadcastStockUpdate(symbol: string, data: StockData) {
    const subscribers = this.subscriptions.get(symbol);
    if (subscribers) {
      subscribers.forEach(clientId => {
        const socket = this.connectedClients.get(clientId);
        if (socket) {
          socket.emit('stock_update', { symbol, data });
        }
      });
    }
  }
}
```

## 🎨 Frontend Architecture

### 1. **Component Architecture**
```typescript
// Optimized component structure
const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <WebSocketProvider>
            <QueryClientProvider client={queryClient}>
              <Router>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/portfolio" element={<Portfolio />} />
                </Routes>
              </Router>
            </QueryClientProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};
```

### 2. **State Management**
```typescript
// Zustand store with persistence
interface AppState {
  user: User | null;
  watchlist: Stock[];
  portfolio: PortfolioItem[];
  alerts: Alert[];
  settings: UserSettings;
  
  // Actions
  setUser: (user: User | null) => void;
  addToWatchlist: (stock: Stock) => void;
  removeFromWatchlist: (symbol: string) => void;
  updatePortfolio: (item: PortfolioItem) => void;
  createAlert: (alert: Alert) => void;
  updateSettings: (settings: UserSettings) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        watchlist: [],
        portfolio: [],
        alerts: [],
        settings: defaultSettings,
        
        setUser: (user) => set({ user }),
        addToWatchlist: (stock) => set((state) => ({
          watchlist: [...state.watchlist, stock]
        })),
        removeFromWatchlist: (symbol) => set((state) => ({
          watchlist: state.watchlist.filter(s => s.symbol !== symbol)
        })),
        updatePortfolio: (item) => set((state) => ({
          portfolio: state.portfolio.map(p => p.id === item.id ? item : p)
        })),
        createAlert: (alert) => set((state) => ({
          alerts: [...state.alerts, alert]
        })),
        updateSettings: (settings) => set({ settings })
      }),
      { name: 'oryn-store' }
    )
  )
);
```

### 3. **Data Fetching Strategy**
```typescript
// React Query for server state
export const useStockData = (symbol: string) => {
  return useQuery({
    queryKey: ['stock', symbol],
    queryFn: () => fetchStockData(symbol),
    staleTime: 60000, // 1 minute
    cacheTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
};

export const useMLPredictions = (symbols: string[]) => {
  return useQuery({
    queryKey: ['ml-predictions', symbols],
    queryFn: () => fetchMLPredictions(symbols),
    staleTime: 300000, // 5 minutes
    cacheTime: 900000, // 15 minutes
    enabled: symbols.length > 0
  });
};
```

## 🗄️ Database Architecture

### 1. **Database Schema**
```sql
-- Optimized database schema
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  plan VARCHAR(20) NOT NULL DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE watchlists_fixed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(12,4) DEFAULT 0,
  change DECIMAL(12,4) DEFAULT 0,
  change_percent DECIMAL(8,4) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  exchange TEXT,
  market TEXT,
  sector TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, ticker)
);

CREATE TABLE portfolios_fixed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  ticker TEXT NOT NULL,
  name TEXT NOT NULL,
  shares DECIMAL(18,6) NOT NULL CHECK (shares > 0),
  avg_price DECIMAL(18,6) NOT NULL CHECK (avg_price >= 0),
  current_price DECIMAL(18,6) DEFAULT 0,
  total_value DECIMAL(18,6) DEFAULT 0,
  gain_loss DECIMAL(18,6) DEFAULT 0,
  gain_loss_percent DECIMAL(8,4) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  exchange TEXT,
  market TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, ticker)
);

-- Indexes for performance
CREATE INDEX idx_watchlists_fixed_user_id ON watchlists_fixed(user_id);
CREATE INDEX idx_watchlists_fixed_ticker ON watchlists_fixed(ticker);
CREATE INDEX idx_portfolios_fixed_user_id ON portfolios_fixed(user_id);
CREATE INDEX idx_portfolios_fixed_ticker ON portfolios_fixed(ticker);
```

### 2. **Caching Strategy**
```typescript
// Multi-layer caching
class CacheService {
  private redis: RedisClientType;
  private memoryCache: Map<string, any> = new Map();
  private ttl: Map<string, number> = new Map();

  async get<T>(key: string): Promise<T | null> {
    // L1: Memory cache
    if (this.memoryCache.has(key)) {
      const ttl = this.ttl.get(key);
      if (ttl && Date.now() < ttl) {
        return this.memoryCache.get(key);
      }
    }

    // L2: Redis cache
    const cached = await this.redis.get(key);
    if (cached) {
      const data = JSON.parse(cached);
      this.memoryCache.set(key, data);
      this.ttl.set(key, Date.now() + 60000); // 1 minute
      return data;
    }

    return null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
    // Set in memory cache
    this.memoryCache.set(key, value);
    this.ttl.set(key, Date.now() + ttlSeconds * 1000);

    // Set in Redis cache
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
  }
}
```

## 🔒 Security Architecture

### 1. **Authentication & Authorization**
```typescript
// JWT-based authentication
class AuthService {
  private jwtSecret: string;
  private refreshTokens: Map<string, string> = new Map();

  generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      this.jwtSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      this.jwtSecret,
      { expiresIn: '7d' }
    );

    this.refreshTokens.set(user.id, refreshToken);
    return { accessToken, refreshToken };
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      return await this.getUserById(decoded.userId);
    } catch (error) {
      return null;
    }
  }
}
```

### 2. **Rate Limiting**
```typescript
// Advanced rate limiting
class RateLimiter {
  private limits: Map<string, { count: number; resetTime: number }> = new Map();

  async check(identifier: string, limit: number = 100, windowMs: number = 900000): Promise<boolean> {
    const now = Date.now();
    const key = `${identifier}:${Math.floor(now / windowMs)}`;
    
    const current = this.limits.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (current.count >= limit) {
      return false;
    }

    current.count++;
    this.limits.set(key, current);
    return true;
  }
}
```

## 📊 Monitoring & Observability

### 1. **Metrics Collection**
```typescript
// Prometheus metrics
class MetricsService {
  private register: prometheus.Registry;
  private httpRequestDuration: prometheus.Histogram;
  private httpRequestTotal: prometheus.Counter;
  private activeConnections: prometheus.Gauge;

  constructor() {
    this.register = new prometheus.Registry();
    
    this.httpRequestDuration = new prometheus.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code']
    });

    this.httpRequestTotal = new prometheus.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code']
    });

    this.activeConnections = new prometheus.Gauge({
      name: 'websocket_connections_active',
      help: 'Number of active WebSocket connections'
    });

    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.httpRequestTotal);
    this.register.registerMetric(this.activeConnections);
  }
}
```

### 2. **Health Checks**
```typescript
// Comprehensive health checks
class HealthCheckService {
  async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkExternalAPIs(),
      this.checkMLModels()
    ]);

    const results = checks.map((check, index) => ({
      service: ['database', 'redis', 'external_apis', 'ml_models'][index],
      status: check.status === 'fulfilled' ? 'healthy' : 'unhealthy',
      details: check.status === 'fulfilled' ? check.value : check.reason
    }));

    const overallStatus = results.every(r => r.status === 'healthy') ? 'healthy' : 'unhealthy';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: results
    };
  }
}
```

## 🚀 Deployment Architecture

### 1. **Docker Configuration**
```dockerfile
# Multi-stage Docker build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3001
CMD ["node", "dist/server.js"]
```

### 2. **Kubernetes Deployment**
```yaml
# kubernetes-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: oryn-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: oryn-backend
  template:
    metadata:
      labels:
        app: oryn-backend
    spec:
      containers:
      - name: oryn-backend
        image: oryn-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: oryn-secrets
              key: redis-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
```

## 🎯 Performance Targets

### Backend Performance
- **API Response Time**: < 100ms (95th percentile)
- **Database Query Time**: < 50ms (95th percentile)
- **Cache Hit Rate**: > 90%
- **Throughput**: 10,000 requests/second
- **Uptime**: 99.9%

### Frontend Performance
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **First Input Delay**: < 100ms
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3.5s

### ML Model Performance
- **Prediction Time**: < 500ms
- **Model Accuracy**: > 85%
- **Confidence Score**: > 70%
- **Batch Processing**: 100 predictions/second

## 🔧 Development Workflow

### 1. **CI/CD Pipeline**
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run test
    - run: npm run lint
    - run: npm run type-check

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run build
    - uses: actions/upload-artifact@v3
      with:
        name: dist
        path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    - name: Deploy to Production
      run: |
        echo "Deploying to production..."
        # Deployment commands here
```

### 2. **Code Quality**
```json
// .eslintrc.json
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

This production architecture ensures the Oryn Alert Hub platform is built to world-class standards with enterprise-grade performance, security, and scalability.
