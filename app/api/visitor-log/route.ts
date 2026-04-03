import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ip, path, method, userAgent, referer } = body

    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 })
    }

    await prisma.visitorLog.create({
      data: {
        ip: ip?.substring(0, 100) || null,
        path: path.substring(0, 500),
        method: method || 'GET',
        userAgent: userAgent?.substring(0, 500) || null,
        referer: referer?.substring(0, 500) || null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Visitor log error:', error)
    return NextResponse.json({ error: 'Failed to log visit' }, { status: 500 })
  }
}