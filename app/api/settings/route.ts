import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findMany()

    const result: Record<string, string> = {}
    for (const s of settings) {
      result[s.key] = s.value
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()

    const allowedKeys = [
      'site_name',
      'site_logo',
      'hero_title',
      'hero_subtitle',
      'hero_image',
      'seller_email',
      'seller_phone',
      'seller_address',
      'showcase_products',
      'watermark_enabled',
      'watermark_type',
      'watermark_text',
      'watermark_image',
      'watermark_position',
      'watermark_opacity',
      // Notification settings
      'notification_email_enabled',
      'notification_email_recipients',
      'notification_sms_enabled',
      'notification_sms_webhook',
      'notification_new_message',
      'notification_new_inquiry',
    ]

    for (const [key, value] of Object.entries(body)) {
      if (allowedKeys.includes(key)) {
        await prisma.siteSettings.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
