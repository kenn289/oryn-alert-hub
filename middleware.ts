import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
  
  // For protected routes, redirect to auth if not authenticated
  if (isProtectedRoute(pathname)) {
    // Check for authentication token in cookies
    const authToken = request.cookies.get('oryn-auth-token')
    
    if (!authToken) {
      // Redirect to auth page with return URL
      const authUrl = new URL('/auth', request.url)
      authUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(authUrl)
    }
  }
  
  // For Pro routes, check subscription status
  if (isProRoute(pathname)) {
    const authToken = request.cookies.get('oryn-auth-token')
    const subscriptionStatus = request.cookies.get('oryn-subscription-status')
    
    if (!authToken) {
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
