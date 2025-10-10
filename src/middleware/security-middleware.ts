import { NextRequest, NextResponse } from 'next/server'
import { ComprehensiveSecurityService } from '@/lib/comprehensive-security-service'

const securityService = new ComprehensiveSecurityService()

export async function securityMiddleware(request: NextRequest): Promise<NextResponse | null> {
  try {
    const ipAddress = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const endpoint = request.nextUrl.pathname
    
    // Check if IP is blocked
    const { data: isBlocked } = await supabase.rpc('is_ip_blocked', { ip_to_check: ipAddress })
    if (isBlocked) {
      await securityService.logSecurityEvent({
        type: 'security_violation',
        ipAddress,
        userAgent,
        riskScore: 1.0,
        details: 'Blocked IP attempted access'
      })
      
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Check rate limiting
    const rateLimitInfo = await securityService.checkRateLimit(ipAddress, endpoint)
    if (rateLimitInfo.isBlocked) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimitInfo.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      )
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\.\./,  // Directory traversal
      /<script/i,  // XSS attempts
      /union.*select/i,  // SQL injection
      /javascript:/i,  // JavaScript injection
      /onload=/i,  // Event handler injection
    ]
    
    const url = request.url
    const body = request.method !== 'GET' ? await request.text() : ''
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url) || pattern.test(body)) {
        await securityService.logSecurityEvent({
          type: 'security_violation',
          ipAddress,
          userAgent,
          riskScore: 0.9,
          details: `Suspicious pattern detected: ${pattern.source}`,
          metadata: { url, pattern: pattern.source }
        })
        
        return NextResponse.json(
          { error: 'Suspicious activity detected' },
          { status: 400 }
        )
      }
    }
    
    // Add security headers
    const response = NextResponse.next()
    
    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
    
    // CSP header
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
    )
    
    // HSTS header
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
    
    return response
    
  } catch (error) {
    console.error('Security middleware error:', error)
    return NextResponse.next()
  }
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('x-remote-addr')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (remoteAddr) {
    return remoteAddr
  }
  
  return '127.0.0.1'
}

export async function authSecurityMiddleware(request: NextRequest): Promise<NextResponse | null> {
  try {
    const ipAddress = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    
    // Check for brute force attempts
    const { data: recentAttempts } = await supabase
      .from('security_events')
      .select('*')
      .eq('ip_address', ipAddress)
      .eq('type', 'login_attempt')
      .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
    
    if (recentAttempts && recentAttempts.length > 10) {
      await securityService.logSecurityEvent({
        type: 'security_violation',
        ipAddress,
        userAgent,
        riskScore: 0.9,
        details: 'Brute force attempt detected'
      })
      
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }
    
    // Check for suspicious user agents
    const suspiciousAgents = [
      'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python', 'java'
    ]
    
    const isSuspicious = suspiciousAgents.some(agent => 
      userAgent.toLowerCase().includes(agent)
    )
    
    if (isSuspicious) {
      await securityService.logSecurityEvent({
        type: 'suspicious_activity',
        ipAddress,
        userAgent,
        riskScore: 0.6,
        details: 'Suspicious user agent detected'
      })
    }
    
    return null
    
  } catch (error) {
    console.error('Auth security middleware error:', error)
    return null
  }
}
