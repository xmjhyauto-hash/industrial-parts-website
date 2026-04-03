import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secretKey = process.env.NEXTAUTH_SECRET
if (!secretKey) {
  throw new Error('NEXTAUTH_SECRET environment variable is not set')
}
const encodedKey = new TextEncoder().encode(secretKey)

// CSRF Token Methods
const CSRF_TOKEN_LENGTH = 32

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Create a session with CSRF token
 */
export async function createSession(payload: { userId: string }) {
  const csrfToken = generateCSRFToken()

  const token = await new SignJWT({ ...payload, csrfToken })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(encodedKey)

  cookies().set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  // Store CSRF token in a separate cookie (not httpOnly for JS access)
  cookies().set('csrf_token', csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  return token
}

export async function verifySession() {
  const token = cookies().get('session')?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, encodedKey)
    return payload
  } catch {
    return null
  }
}

/**
 * Verify CSRF token from request against session
 */
export async function verifyCSRFToken(request: Request): Promise<boolean> {
  // Get token from header or form body
  const requestToken = request.headers.get('x-csrf-token') ||
                       request.headers.get('x-xsrf-token') ||
                       new URL(request.url).searchParams.get('csrf_token')

  if (!requestToken) {
    return false
  }

  const session = await verifySession()
  if (!session || typeof session !== 'object' || !('csrfToken' in session)) {
    return false
  }

  // Constant-time comparison to prevent timing attacks
  const storedToken = session.csrfToken as string
  if (!storedToken || storedToken.length !== requestToken.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < storedToken.length; i++) {
    result |= storedToken.charCodeAt(i) ^ requestToken.charCodeAt(i)
  }
  return result === 0
}

/**
 * Get CSRF token for the current session (for including in forms)
 */
export async function getCSRFToken(): Promise<string | null> {
  const session = await verifySession()
  if (!session || typeof session !== 'object' || !('csrfToken' in session)) {
    return null
  }
  return session.csrfToken as string
}

export async function clearSession() {
  cookies().delete('session')
  cookies().delete('csrf_token')
}
