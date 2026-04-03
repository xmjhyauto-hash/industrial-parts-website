import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  rateLimit,
  checkIpRateLimit,
  getIpFromRequest,
  getSecurityHeaders,
  getCSPHeader,
} from '@/lib/security'

export async function middleware(request: NextRequest) {
  const ip = getIpFromRequest(request as unknown as Request)
  const pathname = request.nextUrl.pathname

  // Skip security checks for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check IP rate limit (blocklist check)
  const ipCheck = checkIpRateLimit(ip)
  if (ipCheck.blocked) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((ipCheck.lockedUntil! - Date.now()) / 1000)),
        ...getSecurityHeaders(),
        'Content-Security-Policy': getCSPHeader(),
      },
    })
  }

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    // Different limits for different endpoints
    let limitOptions = { max: 100, windowMs: 60000 } // Default: 100/min

    if (pathname.startsWith('/api/auth')) {
      limitOptions = { max: 10, windowMs: 60000 } // Stricter for auth: 10/min
    } else if (pathname.startsWith('/api/inquiry') || pathname.startsWith('/api/messages')) {
      limitOptions = { max: 20, windowMs: 60000 } // Form submissions: 20/min
    } else if (pathname.startsWith('/api/upload')) {
      limitOptions = { max: 10, windowMs: 60000 } // Uploads: 10/min
    }

    const result = rateLimit(`ip:${ip}`, limitOptions)

    if (!result.success) {
      return new NextResponse('Rate Limit Exceeded', {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.resetAt),
          ...getSecurityHeaders(),
          'Content-Security-Policy': getCSPHeader(),
        },
      })
    }

    // Add rate limit headers to response
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Remaining', String(result.remaining))
    response.headers.set('X-RateLimit-Reset', String(result.resetAt))

    // Add security headers
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    response.headers.set('Content-Security-Policy', getCSPHeader())

    return response
  }

  // Add security headers to all responses
  const response = NextResponse.next()
  Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  response.headers.set('Content-Security-Policy', getCSPHeader())

  // Log the visit (skip for admin routes)
  // Use fire-and-forget to not block the response
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/')) {
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referer = request.headers.get('referer') || ''

    // Use relative URL to call API route (Edge compatible)
    // The API route will handle the actual database write
    fetch(new URL('/api/visitor-log', request.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip: ip.substring(0, 100),
        path: pathname.substring(0, 500),
        method: request.method,
        userAgent: userAgent.substring(0, 500),
        referer: referer.substring(0, 500),
      }),
    }).catch(() => {
      // Silently fail - don't block the request
    })
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
