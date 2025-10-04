# Oryn Alert Hub - Complete Route Documentation

## Overview
This document provides comprehensive documentation for all routes in the Oryn Alert Hub application, including access controls, authentication requirements, and usage instructions.

## Route Categories

### 1. Public Routes (No Authentication Required)

#### Home Page
- **Route**: `/`
- **Access**: Public
- **Description**: Landing page with features, pricing, and documentation
- **Components**: Hero, Features, Pricing, Footer

#### Documentation
- **Route**: `/docs`
- **Access**: Public
- **Description**: Comprehensive documentation for all features and terms
- **Components**: Feature explanations, beginner guides, API documentation

#### Authentication
- **Route**: `/auth`
- **Access**: Public
- **Description**: Sign in and sign up page
- **Components**: Login form, registration form, password reset

### 2. Protected Routes (Authentication Required)

#### Dashboard
- **Route**: `/dashboard`
- **Access**: Authenticated users only
- **Description**: Main user dashboard with portfolio, watchlist, and alerts
- **Components**: Portfolio tracker, watchlist, alerts, market status
- **Redirects**: Unauthenticated users → `/auth`

#### User Profile (Future)
- **Route**: `/profile`
- **Access**: Authenticated users only
- **Description**: User profile and settings management
- **Components**: Profile form, settings, preferences

### 3. Pro-Only Routes (Pro Subscription Required)

#### Advanced Analytics
- **Route**: `/analytics`
- **Access**: Pro users only
- **Description**: Advanced portfolio analytics and risk metrics
- **Components**: Sharpe ratio, max drawdown, performance charts
- **Redirects**: Free users → upgrade prompt

#### AI Insights
- **Route**: `/insights`
- **Access**: Pro users only
- **Description**: AI-powered market insights and predictions
- **Components**: AI predictions, market analysis, confidence scores
- **Redirects**: Free users → upgrade prompt

#### Options Flow
- **Route**: `/options`
- **Access**: Pro users only
- **Description**: Advanced options flow analysis
- **Components**: Unusual activity, call/put ratios, large trades
- **Redirects**: Free users → upgrade prompt

#### Team Collaboration
- **Route**: `/team`
- **Access**: Pro users only
- **Description**: Team collaboration and sharing features
- **Components**: Team members, shared analytics, collaboration tools
- **Redirects**: Free users → upgrade prompt

#### Priority Support
- **Route**: `/support`
- **Access**: Pro users only
- **Description**: Priority customer support
- **Components**: Support tickets, live chat, priority queue
- **Redirects**: Free users → upgrade prompt

## API Routes

### Public API Routes

#### Health Check
- **Route**: `/api/health`
- **Method**: GET
- **Access**: Public
- **Description**: System health and status check
- **Response**: System status, uptime, API status

#### Stock Data
- **Route**: `/api/stock/multi/[symbol]`
- **Method**: GET
- **Access**: Public
- **Description**: Real-time stock data from multiple sources
- **Parameters**: `symbol` - Stock ticker symbol
- **Response**: Stock quote with price, volume, change

#### Options Flow
- **Route**: `/api/options-flow`
- **Method**: GET
- **Access**: Public
- **Description**: Options flow analysis and unusual activity
- **Response**: Unusual activity, call/put ratios, volume spikes

### Protected API Routes

#### Subscription Management
- **Route**: `/api/subscription/cancel`
- **Method**: POST
- **Access**: Authenticated users only
- **Description**: Cancel user subscription
- **Authentication**: Required
- **Response**: Cancellation confirmation

#### Payment Processing
- **Route**: `/api/razorpay/create-checkout-session`
- **Method**: POST
- **Access**: Authenticated users only
- **Description**: Create payment session for subscription
- **Authentication**: Required
- **Response**: Payment session details

#### Payment Verification
- **Route**: `/api/razorpay/verify-payment`
- **Method**: POST
- **Access**: Authenticated users only
- **Description**: Verify payment completion
- **Authentication**: Required
- **Response**: Payment verification status

### Pro-Only API Routes

#### Insider Trading
- **Route**: `/api/insider-trading`
- **Method**: GET
- **Access**: Pro users only
- **Description**: Insider trading data and SEC filings
- **Authentication**: Required
- **Subscription**: Pro required
- **Response**: Insider trading activities

#### Advanced Analytics
- **Route**: `/api/advanced-analytics`
- **Method**: GET
- **Access**: Pro users only
- **Description**: Advanced portfolio analytics
- **Authentication**: Required
- **Subscription**: Pro required
- **Response**: Risk metrics, performance analysis

#### Team Collaboration
- **Route**: `/api/team-collaboration`
- **Method**: GET/POST
- **Access**: Pro users only
- **Description**: Team management and collaboration
- **Authentication**: Required
- **Subscription**: Pro required
- **Response**: Team data, collaboration features

#### Priority Support
- **Route**: `/api/priority-support`
- **Method**: GET/POST
- **Access**: Pro users only
- **Description**: Priority support system
- **Authentication**: Required
- **Subscription**: Pro required
- **Response**: Support tickets, priority queue

## Access Control Implementation

### Authentication Middleware
- **File**: `middleware.ts`
- **Purpose**: Route protection and access control
- **Features**:
  - Public route access
  - Authentication checks
  - Subscription validation
  - Redirect handling

### Route Guards
- **Component**: `RouteGuard`
- **Purpose**: Client-side route protection
- **Features**:
  - Authentication state checking
  - Subscription status validation
  - Loading states
  - Error handling

### Access Levels
1. **Public**: No authentication required
2. **Authenticated**: User must be logged in
3. **Pro**: User must have Pro subscription
4. **Master**: User must have Master account

## Navigation Structure

### Main Navigation
- **Home**: `/` - Landing page
- **Features**: `/#features` - Feature overview
- **Pricing**: `/#pricing` - Pricing plans
- **Docs**: `/docs` - Documentation
- **Dashboard**: `/dashboard` - User dashboard (authenticated)
- **Auth**: `/auth` - Authentication

### Dashboard Navigation
- **Portfolio**: `/#portfolio-tracker-section` - Portfolio management
- **Watchlist**: `/#watchlist` - Stock watchlist
- **Alerts**: `/#alerts` - Alert management
- **Analytics**: `/analytics` - Advanced analytics (Pro)
- **Insights**: `/insights` - AI insights (Pro)
- **Options**: `/options` - Options flow (Pro)
- **Team**: `/team` - Team collaboration (Pro)
- **Support**: `/support` - Priority support (Pro)

## Error Handling

### 404 Not Found
- **Route**: `/*` (catch-all)
- **Component**: `NotFoundPage`
- **Description**: Custom 404 page with navigation options

### 403 Forbidden
- **Route**: Pro-only routes for free users
- **Component**: `UpgradePrompt`
- **Description**: Upgrade prompt with pricing information

### 401 Unauthorized
- **Route**: Protected routes for unauthenticated users
- **Component**: `AuthRedirect`
- **Description**: Redirect to authentication page

## Development Routes

### API Testing
- **Route**: `/api/test`
- **Method**: GET
- **Access**: Development only
- **Description**: API endpoint testing
- **Environment**: Development

### Health Monitoring
- **Route**: `/api/health`
- **Method**: GET
- **Access**: Public
- **Description**: System health monitoring
- **Response**: System status and metrics

## Security Considerations

### Authentication
- JWT tokens for session management
- Secure cookie storage
- Automatic token refresh
- Session timeout handling

### Authorization
- Role-based access control
- Subscription level validation
- API rate limiting
- Request validation

### Data Protection
- Input sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

## Performance Optimization

### Route Optimization
- Lazy loading for heavy components
- Code splitting by route
- Prefetching for critical routes
- Caching strategies

### API Optimization
- Response caching
- Database query optimization
- Rate limiting
- Error handling

## Monitoring and Analytics

### Route Analytics
- Page view tracking
- User journey analysis
- Performance metrics
- Error tracking

### API Monitoring
- Response time monitoring
- Error rate tracking
- Usage analytics
- Performance optimization

## Testing Strategy

### Route Testing
- Unit tests for route components
- Integration tests for route flows
- E2E tests for user journeys
- Performance testing

### API Testing
- Unit tests for API endpoints
- Integration tests for API flows
- Load testing for performance
- Security testing

## Deployment Considerations

### Environment Variables
- Database connection strings
- API keys and secrets
- Feature flags
- Environment-specific configs

### Route Configuration
- Production route optimization
- CDN configuration
- Caching strategies
- Security headers

## Troubleshooting

### Common Issues
1. **Authentication failures**: Check token validity
2. **Subscription errors**: Verify subscription status
3. **Route not found**: Check route configuration
4. **Permission denied**: Verify user access level

### Debug Tools
- Route debugging logs
- Authentication state inspection
- Subscription status checks
- Performance monitoring

## Future Enhancements

### Planned Routes
- `/settings` - User settings and preferences
- `/billing` - Billing and subscription management
- `/notifications` - Notification center
- `/api-docs` - API documentation

### Advanced Features
- Multi-tenant support
- Custom domain routing
- Advanced analytics
- Real-time collaboration

This comprehensive route documentation ensures all routes are properly documented, secured, and accessible according to user permissions and subscription levels.

