import { NextResponse } from 'next/server'
import { verifySession, getCSRFToken } from '@/lib/auth'

// GET - Get CSRF token for the current session
export async function GET() {
  const session = await verifySession()

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const csrfToken = await getCSRFToken()

  return NextResponse.json({ csrfToken })
}
