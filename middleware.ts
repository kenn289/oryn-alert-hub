import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authSessionService } from './src/lib/auth-session-service'

// Define route access levels
const ROUTE_ACCESS = {
  // Public routes - no authentication required
  public: [
    '/',
    '/docs',
    '/auth',
    '/api/health',
    '/api/stock',
    '/api/options-flow'
  ],
  
  // Protected routes - require authentication
  protected: [
    '/dashboard',
    '/api/subscription',
    '/api/payment',
    '/api/razorpay'
  ],
  
  // Pro-only routes - require Pro subscription
  pro: [
    '/api/insider-trading',
    '/api/advanced-analytics',
    '/api/team-collaboration',
    '/api/priority-support'
  ]
}

// Check if route requires authentication
function isProtectedRoute(pathname: string): boolean {
  return ROUTE_ACCESS.protected.some(route => pathname.startsWith(route))
}

// Check if route requires Pro subscription
function isProRoute(pathname: string): boolean {
  return ROUTE_ACCESS.pro.some(route => pathname.startsWith(route))
}

// Check if route is public
function isPublicRoute(pathname: string): boolean {
  return ROUTE_ACCESS.public.some(route => pathname.startsWith(route))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow all API routes to pass through for now
  // Authentication will be handled at the API level
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }
  
  // For protected routes, check JWT authentication
  if (isProtectedRoute(pathname)) {
    // Check for access token in cookies
    const accessToken = request.cookies.get('access_token')?.value
    
    if (!accessToken) {
      // Redirect to auth page with return URL
      const authUrl = new URL('/auth', request.url)
      authUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(authUrl)
    }

    // Verify access token
    const tokenData = authSessionService.verifyAccessToken(accessToken)
    
    if (!tokenData) {
      // Try to refresh the token
      const refreshToken = request.cookies.get('refresh_token')?.value
      
      if (!refreshToken) {
        const authUrl = new URL('/auth', request.url)
        authUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(authUrl)
      }
      
      // If refresh token exists, let the client handle the refresh
      // The client will attempt to refresh and redirect if needed
    }
  }
  
  // For Pro routes, check subscription status
  if (isProRoute(pathname)) {
    const accessToken = request.cookies.get('access_token')?.value
    const subscriptionStatus = request.cookies.get('oryn-subscription-status')
    
    if (!accessToken) {
      const authUrl = new URL('/auth', request.url)
      authUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(authUrl)
    }
    
    // Verify access token
    const tokenData = authSessionService.verifyAccessToken(accessToken)
    
    if (!tokenData) {
      const authUrl = new URL('/auth', request.url)
      authUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(authUrl)
    }
    
    // Check if user has Pro subscription
    if (subscriptionStatus?.value !== 'pro' && subscriptionStatus?.value !== 'master') {
      // Redirect to upgrade page
      const upgradeUrl = new URL('/dashboard', request.url)
      upgradeUrl.searchParams.set('upgrade', 'required')
      return NextResponse.redirect(upgradeUrl)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}


