import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { processImage } from '@/lib/image-processing'
import { prisma } from '@/lib/prisma'

async function getWatermarkSettings() {
  try {
    const settings = await prisma.siteSettings.findMany({
      where: { key: { startsWith: 'watermark_' } },
    })
    const config: Record<string, string> = {}
    for (const s of settings) {
      config[s.key] = s.value
    }
    if (config.watermark_enabled === 'true') {
      return {
        enabled: true,
        type: (config.watermark_type as 'text' | 'image') || 'text',
        text: config.watermark_text || '',
        imagePath: config.watermark_image || '',
        position: (config.watermark_position as 'center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left') || 'bottom-right',
        opacity: parseFloat(config.watermark_opacity || '0.3'),
      }
    }
  } catch {
    // Database not ready or table doesn't exist
  }
  return { enabled: false }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Validate file size (10MB max before compression)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Create uploads directory
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `product-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
    const filepath = join(uploadDir, filename)

    // Get watermark settings
    const wmSettings = await getWatermarkSettings()

    // Process image (compress + watermark)
    const buffer = Buffer.from(await file.arrayBuffer())
    const processedBuffer = await processImage(buffer, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
      watermark: wmSettings.enabled && wmSettings.type ? {
        type: wmSettings.type as 'text' | 'image',
        text: wmSettings.text,
        imagePath: wmSettings.imagePath,
        position: wmSettings.position,
        opacity: wmSettings.opacity,
      } : undefined,
    })

    await writeFile(filepath, processedBuffer)

    const url = `/uploads/${filename}`

    return NextResponse.json({ url, filename })
  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Only allow deleting files from /uploads/
    if (!url.startsWith('/uploads/')) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }

    const filepath = join(process.cwd(), 'public', url)

    if (existsSync(filepath)) {
      await unlink(filepath)
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Image delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
