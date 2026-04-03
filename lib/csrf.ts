import { NextRequest, NextResponse } from 'next/server'
import { verifyCSRFToken } from './auth'

/**
 * CSRF protection middleware for API routes
 * Use this as a wrapper for POST/PUT/DELETE handlers
 */
export async function withCSRF(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Only check CSRF for state-changing methods
  const csrfSafeMethods = ['GET', 'HEAD', 'OPTIONS', 'TRACE']

  if (csrfSafeMethods.includes(request.method)) {
    return handler(request)
  }

  // Check CSRF token for state-changing requests
  const isValid = await verifyCSRFToken(request)

  if (!isValid) {
    console.warn('[CSRF] Invalid or missing CSRF token')
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    )
  }

  return handler(request)
}

/**
 * Validate origin header to prevent cross-site requests
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')

  // In development, allow localhost
  if (process.env.NODE_ENV !== 'production') {
    return true
  }

  // In production, verify origin matches host
  if (origin) {
    try {
      const url = new URL(origin)
      return url.host === host
    } catch {
      return false
    }
  }

  // If no origin header, check referer
  const referer = request.headers.get('referer')
  if (referer) {
    try {
      const url = new URL(referer)
      return url.host === host
    } catch {
      return false
    }
  }

  // Allow if we can't determine origin (might be a direct API call)
  return true
}
