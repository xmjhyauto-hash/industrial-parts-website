import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateMessage, sanitizeString, getHoneypotFieldName, isFormFilledTooFast } from '@/lib/security'
import { sendNotification } from '@/lib/notification'

// GET - List all messages (for admin)
export async function GET() {
  try {
    const messages = await prisma.visitorMessage.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

// POST - Submit a new message (for visitors)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, message, formCreatedAt } = body

    // Honeypot check
    const honeypotField = getHoneypotFieldName()
    if (body[honeypotField]) {
      // Bot detected - silently accept but don't process
      return NextResponse.json({ success: true }, { status: 201 })
    }

    // Time-based bot detection
    if (formCreatedAt && isFormFilledTooFast(formCreatedAt)) {
      return NextResponse.json({ success: true }, { status: 201 })
    }

    // Validate input
    const validation = validateMessage({ name, email, phone, message })
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeString(name),
      email: email ? sanitizeString(email) : null,
      phone: phone ? sanitizeString(phone) : null,
      message: sanitizeString(message),
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    const visitorMessage = await prisma.visitorMessage.create({
      data: {
        name: sanitizedData.name,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        message: sanitizedData.message,
        ip: ip?.substring(0, 100) || null,
        userAgent: userAgent?.substring(0, 500) || null,
      },
    })

    // Send notification
    sendNotification({
      type: 'new_message',
      customerName: sanitizedData.name,
      customerEmail: sanitizedData.email || undefined,
      customerPhone: sanitizedData.phone || undefined,
      message: sanitizedData.message,
      ip: ip || undefined,
    }).catch(err => console.error('Notification error:', err))

    return NextResponse.json({ success: true, message: visitorMessage }, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Failed to submit message' }, { status: 500 })
  }
}
