# Oryn Backend - Production-Ready API

A high-performance, scalable backend API for the Oryn Alert Hub platform, built with Node.js, Express, and TypeScript.

## 🚀 Features

- **High Performance**: Optimized for speed with Redis caching and connection pooling
- **ML Integration**: Advanced machine learning models for stock predictions
- **Real-time Updates**: WebSocket support for live data streaming
- **Comprehensive APIs**: Stock data, portfolio management, watchlists, alerts
- **Security**: JWT authentication, rate limiting, input validation
- **Monitoring**: Built-in metrics, logging, and health checks
- **Scalability**: Microservices architecture with horizontal scaling support

## 📋 Prerequisites

- Node.js 18+ 
- Redis 6+
- PostgreSQL/Supabase
- 4GB+ RAM recommended

## 🛠️ Installation

```bash
# Clone the repository
git clone <repository-url>
cd backend

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Build the application
npm run build

# Start the server
npm start
```

## 🔧 Configuration

Create a `.env` file with the following variables:

```env
# Server Configuration
NODE_ENV=production
PORT=3001
HOST=localhost

# Database Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# API Keys
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
POLYGON_API_KEY=your_polygon_key
IEX_CLOUD_API_KEY=your_iex_key
OPENAI_API_KEY=your_openai_key

# ML Configuration
ML_MODEL_PATH=./models
ML_BATCH_SIZE=32
ML_CACHE_TTL=300

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
MONITORING_ENABLED=true
METRICS_PORT=9090
```

## 🏗️ Architecture

### Core Services

1. **StockService**: Real-time stock data from multiple sources
2. **MLService**: Machine learning predictions and analysis
3. **DatabaseService**: Supabase/PostgreSQL operations
4. **CacheService**: Redis caching layer
5. **NotificationService**: Real-time notifications
6. **WebSocketService**: Live data streaming

### API Endpoints

#### Stock Data
- `GET /api/stock/:symbol` - Get single stock data
- `GET /api/stock/multi/:symbols` - Get multiple stocks
- `GET /api/stock/:symbol/history` - Historical data
- `GET /api/stock/search/:query` - Search stocks
- `GET /api/stock/:symbol/predictions` - ML predictions

#### Portfolio Management
- `GET /api/portfolio` - Get user portfolio
- `POST /api/portfolio` - Add portfolio item
- `PUT /api/portfolio/:id` - Update portfolio item
- `DELETE /api/portfolio/:id` - Remove portfolio item

#### Watchlist
- `GET /api/watchlist` - Get user watchlist
- `POST /api/watchlist` - Add to watchlist
- `DELETE /api/watchlist/:id` - Remove from watchlist

#### Alerts
- `GET /api/alerts` - Get user alerts
- `POST /api/alerts` - Create alert
- `PUT /api/alerts/:id` - Update alert
- `DELETE /api/alerts/:id` - Delete alert

#### Support
- `GET /api/support/tickets` - Get support tickets
- `POST /api/support/tickets` - Create ticket
- `GET /api/support/stats` - Support statistics

## 🤖 ML Models

### Price Prediction Model
- **Input**: Historical OHLCV data, technical indicators
- **Output**: Price predictions with confidence scores
- **Features**: RSI, MACD, SMA, support/resistance levels

### Sentiment Analysis Model
- **Input**: News articles, social media sentiment
- **Output**: Market sentiment scores
- **Features**: Text analysis, sentiment classification

### Technical Indicators Model
- **Input**: Price and volume data
- **Output**: Technical analysis signals
- **Features**: Trend analysis, momentum indicators

## 📊 Performance Optimization

### Caching Strategy
- **Redis**: 1-hour TTL for stock data
- **Memory**: 5-minute TTL for ML predictions
- **Database**: Connection pooling with 10 connections

### Rate Limiting
- **General**: 100 requests per 15 minutes
- **Stock API**: 30 requests per minute
- **ML API**: 10 requests per minute
- **Auth**: 5 attempts per 15 minutes

### Database Optimization
- **Indexes**: Optimized for common queries
- **Connection Pooling**: 10 concurrent connections
- **Query Optimization**: Prepared statements

## 🔒 Security

### Authentication
- JWT tokens with 24-hour expiration
- Refresh tokens for extended sessions
- Secure password hashing with bcrypt

### Authorization
- Role-based access control (RBAC)
- Resource-level permissions
- API key authentication for external services

### Input Validation
- Comprehensive request validation
- SQL injection prevention
- XSS protection

## 📈 Monitoring

### Health Checks
- `GET /api/health` - System health status
- Database connection monitoring
- Redis connection monitoring
- External API status

### Metrics
- Request/response times
- Error rates
- Cache hit rates
- Database performance

### Logging
- Structured JSON logging
- Error tracking
- Performance monitoring
- Security event logging

## 🚀 Deployment

### Docker Deployment
```bash
# Build Docker image
docker build -t oryn-backend .

# Run container
docker run -p 3001:3001 --env-file .env oryn-backend
```

### Production Deployment
```bash
# Install PM2 for process management
npm install -g pm2

# Start application
pm2 start dist/server.js --name oryn-backend

# Monitor application
pm2 monit
```

### Environment Variables
Ensure all required environment variables are set:
- Database credentials
- Redis configuration
- API keys
- JWT secrets
- Monitoring settings

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm test -- --grep "StockService"
```

## 📚 API Documentation

### Authentication
All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## 🔧 Development

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Watch for changes
npm run dev:watch
```

### Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check
```

## 📞 Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 🎯 Roadmap

- [ ] GraphQL API support
- [ ] Advanced ML models
- [ ] Real-time collaboration
- [ ] Mobile API optimization
- [ ] Microservices architecture
- [ ] Kubernetes deployment
- [ ] Advanced analytics
- [ ] Machine learning pipeline
