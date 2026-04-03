import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateInquiry, sanitizeString, getHoneypotFieldName, isFormFilledTooFast } from '@/lib/security'
import { sendNotification } from '@/lib/notification'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, productName, productModel, productBrand, customerEmail, customerMessage, formCreatedAt } = body

    // Honeypot check
    const honeypotField = getHoneypotFieldName()
    if (body[honeypotField]) {
      // Bot detected - silently accept but don't process
      return NextResponse.json({ success: true }, { status: 201 })
    }

    // Time-based bot detection (honey pot based on timing)
    if (formCreatedAt && isFormFilledTooFast(formCreatedAt)) {
      // Too fast - likely a bot
      return NextResponse.json({ success: true }, { status: 201 })
    }

    // Validate input
    const validation = validateInquiry({
      email: customerEmail,
      message: customerMessage,
      productId,
    })

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // Sanitize string inputs
    const sanitizedData = {
      productId: sanitizeString(productId),
      productName: sanitizeString(productName),
      productModel: productModel ? sanitizeString(productModel) : null,
      productBrand: productBrand ? sanitizeString(productBrand) : null,
      customerEmail: sanitizeString(customerEmail),
      customerMessage: customerMessage ? sanitizeString(customerMessage) : null,
    }

    // Get client info
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               null
    const userAgent = request.headers.get('user-agent') || null

    // Create inquiry in database
    const inquiry = await prisma.inquiry.create({
      data: {
        productId: sanitizedData.productId,
        productName: sanitizedData.productName,
        productModel: sanitizedData.productModel,
        productBrand: sanitizedData.productBrand,
        customerEmail: sanitizedData.customerEmail,
        customerMessage: sanitizedData.customerMessage,
        ip,
        userAgent,
        status: 'new',
      },
    })

    // Send notification
    sendNotification({
      type: 'new_inquiry',
      productName: sanitizedData.productName,
      productModel: sanitizedData.productModel || undefined,
      customerEmail: sanitizedData.customerEmail,
      customerPhone: undefined,
      message: sanitizedData.customerMessage || undefined,
      ip: ip || undefined,
    }).catch(err => console.error('Notification error:', err))

    return NextResponse.json(
      { success: true, inquiry },
      { status: 201 }
    )
  } catch (error) {
    console.error('Inquiry submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit inquiry' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get all inquiries, newest first
    const inquiries = await prisma.inquiry.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ inquiries })
  } catch (error) {
    console.error('Error fetching inquiries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inquiries' },
      { status: 500 }
    )
  }
}
