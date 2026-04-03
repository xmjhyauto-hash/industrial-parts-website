/**
 * Security utilities for website protection
 */

import { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies'

// ============================================================================
// Rate Limiter (In-Memory)
// ============================================================================

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Simple in-memory rate limiter
 * For production, use Redis or similar
 */
export function rateLimit(
  key: string,
  options: { max: number; windowMs: number }
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    Array.from(rateLimitStore.entries()).forEach(([k, v]) => {
      if (v.resetAt < now) rateLimitStore.delete(k)
    })
  }

  if (!entry || entry.resetAt < now) {
    // New or expired entry
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    })
    return { success: true, remaining: options.max - 1, resetAt: now + options.windowMs }
  }

  if (entry.count >= options.max) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { success: true, remaining: options.max - entry.count, resetAt: entry.resetAt }
}

// ============================================================================
// IP-based Rate Limiting
// ============================================================================

const ipRateLimits = new Map<string, { attempts: number; lockedUntil: number }>()

/**
 * Check if IP is rate limited
 */
export function checkIpRateLimit(ip: string): { blocked: boolean; lockedUntil?: number } {
  const now = Date.now()
  const record = ipRateLimits.get(ip)

  if (!record) return { blocked: false }

  if (record.lockedUntil > now) {
    return { blocked: true, lockedUntil: record.lockedUntil }
  }

  if (record.lockedUntil > 0 && record.lockedUntil <= now) {
    // Lock expired, reset
    ipRateLimits.delete(ip)
    return { blocked: false }
  }

  return { blocked: false }
}

/**
 * Record a failed attempt and lock IP if needed
 */
export function recordFailedAttempt(ip: string, maxAttempts: number = 5, lockMinutes: number = 30): boolean {
  const now = Date.now()
  let record = ipRateLimits.get(ip)

  if (!record) {
    record = { attempts: 0, lockedUntil: 0 }
  }

  // If not locked, increment attempts
  if (record.lockedUntil <= now) {
    record.attempts++

    if (record.attempts >= maxAttempts) {
      record.lockedUntil = now + lockMinutes * 60 * 1000
      ipRateLimits.set(ip, record)
      return true // Just got locked
    }

    ipRateLimits.set(ip, record)
  }

  return false
}

/**
 * Clear failed attempts on successful login
 */
export function clearFailedAttempts(ip: string): void {
  ipRateLimits.delete(ip)
}

/**
 * Get IP from request headers
 */
export function getIpFromRequest(request: Request): string {
  // Check various headers for IP (handles proxies)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return 'unknown'
}

// ============================================================================
// XSS Protection
// ============================================================================

/**
 * Sanitize string to prevent XSS
 */
export function sanitizeString(str: string): string {
  if (!str) return ''

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone format (basic)
 */
export function isValidPhone(phone: string): boolean {
  // Allow digits, spaces, dashes, parentheses, and leading +
  const phoneRegex = /^[\d\s\-\(\)\+]{7,20}$/
  return phoneRegex.test(phone)
}

/**
 * Sanitize object fields recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T, fields: string[]): T {
  const sanitized = { ...obj }

  for (const field of fields) {
    if (typeof sanitized[field] === 'string') {
      (sanitized as Record<string, unknown>)[field] = sanitizeString(sanitized[field] as string)
    }
  }

  return sanitized
}

// ============================================================================
// Honeypot Protection
// ============================================================================

/**
 * Check if request is from a bot (honeypot field)
 */
export function isHoneypotTriggered(formData: FormData, honeypotField: string): boolean {
  const value = formData.get(honeypotField)
  // If honeypot field has any value, it's likely a bot
  return value !== null && value !== ''
}

/**
 * Generate honeypot field name (obfuscated)
 */
export function getHoneypotFieldName(): string {
  // Use a common field name that bots might fill
  return 'website'
}

/**
 * Time-based bot detection (honey pot based on timing)
 * Legitimate users take at least a certain time to fill forms
 */
export function isFormFilledTooFast(createdAt: number, minTimeMs: number = 2000): boolean {
  const timeTaken = Date.now() - createdAt
  return timeTaken < minTimeMs
}

// ============================================================================
// Request Validation
// ============================================================================

interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate inquiry form data
 */
export function validateInquiry(data: {
  email?: string
  message?: string
  productId?: string
}): ValidationResult {
  const errors: string[] = []

  if (!data.email) {
    errors.push('Email is required')
  } else if (!isValidEmail(data.email)) {
    errors.push('Invalid email format')
  }

  if (data.message && data.message.length > 2000) {
    errors.push('Message is too long')
  }

  if (!data.productId) {
    errors.push('Product ID is required')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validate visitor message
 */
export function validateMessage(data: {
  name?: string
  email?: string
  phone?: string
  message?: string
}): ValidationResult {
  const errors: string[] = []

  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters')
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.push('Invalid email format')
  }

  if (data.phone && !isValidPhone(data.phone)) {
    errors.push('Invalid phone format')
  }

  if (!data.message || data.message.trim().length < 5) {
    errors.push('Message must be at least 5 characters')
  }

  if (data.message && data.message.length > 5000) {
    errors.push('Message is too long')
  }

  return { valid: errors.length === 0, errors }
}

// ============================================================================
// Security Headers
// ============================================================================

/**
 * Get security headers for response
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }
}

/**
 * Content Security Policy header value
 *
 * NOTE: Production CSP should be stricter. This is a balanced policy
 * that allows Next.js features while providing reasonable protection.
 * For production, consider removing 'unsafe-inline' after auditing all components.
 */
export function getCSPHeader(): string {
  // Check if strict mode is enabled
  const isProduction = process.env.NODE_ENV === 'production'
  const strictMode = process.env.CSP_STRICT === 'true'

  const directives = [
    "default-src 'self'",
    // Scripts: self + Next.js runtime + inline for development
    strictMode
      ? "script-src 'self' 'nonce-{NONCE}'"
      : isProduction
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'unsafe-hashes'",
    // Styles: self + inline (required for Tailwind/Next.js)
    "style-src 'self' 'unsafe-inline'",
    // Images: self + data URIs + blob + https (for CDN/external images)
    "img-src 'self' data: blob: https:",
    // Fonts: self + data URIs
    "font-src 'self' data:",
    // Connections: self + common API endpoints
    "connect-src 'self' https://www.google.com https://www.google-analytics.com",
    // Frames: same origin only
    "frame-ancestors 'self'",
    // Forms: self only
    "form-action 'self'",
    // Base URI: restrict to self
    "base-uri 'self'",
    // Objects: none
    "object-src 'none'",
    // Upgrade insecure requests (production only)
    isProduction ? "upgrade-insecure-requests" : "",
  ].filter(Boolean)

  return directives.join('; ')
}

/**
 * Get strict CSP header (for areas requiring extra security)
 */
export function getStrictCSPHeader(): string {
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "block-all-mixed-content",
  ].join('; ')
}
