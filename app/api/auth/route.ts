import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession, clearSession, verifySession, verifyCSRFToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import {
  recordFailedAttempt,
  clearFailedAttempts,
  checkIpRateLimit,
  getIpFromRequest,
  sanitizeString,
} from '@/lib/security'

// CSRF protected actions require token verification
async function verifyRequest(request: NextRequest, requireCSRF: boolean = false) {
  if (requireCSRF) {
    const isValid = await verifyCSRFToken(request)
    if (!isValid) {
      return { error: 'Invalid CSRF token', status: 403 }
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, action } = body

    // Get client IP
    const ip = getIpFromRequest(request as unknown as Request)

    // Check if IP is blocked
    const ipCheck = checkIpRateLimit(ip)
    if (ipCheck.blocked) {
      const retryAfter = Math.ceil((ipCheck.lockedUntil! - Date.now()) / 1000)
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    if (action === 'login') {
      // Login doesn't require CSRF (public endpoint)
      // Sanitize inputs
      const sanitizedUsername = sanitizeString(username)

      // Find user
      const user = await prisma.adminUser.findUnique({
        where: { username: sanitizedUsername },
      })

      if (!user) {
        // Record failed attempt
        const justLocked = recordFailedAttempt(ip, 5, 30) // 5 attempts, 30 min lock
        if (justLocked) {
          return NextResponse.json(
            { error: 'Too many login attempts. Account locked for 30 minutes.' },
            { status: 429 }
          )
        }
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      const isValid = await bcrypt.compare(password, user.password)
      if (!isValid) {
        // Record failed attempt
        const justLocked = recordFailedAttempt(ip, 5, 30)
        if (justLocked) {
          return NextResponse.json(
            { error: 'Too many login attempts. Account locked for 30 minutes.' },
            { status: 429 }
          )
        }
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      // Login successful - clear failed attempts
      clearFailedAttempts(ip)
      await createSession({ userId: user.id })

      return NextResponse.json({ success: true })
    }

    if (action === 'logout') {
      // Logout requires CSRF protection
      const csrfError = await verifyRequest(request, true)
      if (csrfError) {
        return NextResponse.json({ error: csrfError.error }, { status: csrfError.status })
      }

      await clearSession()
      return NextResponse.json({ success: true })
    }

    if (action === 'check') {
      const session = await verifySession()
      return NextResponse.json({ authenticated: !!session })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 })
  }
}
