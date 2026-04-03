import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import * as XLSX from 'xlsx'
import { isAutoFetchAvailable, autoFetchProduct } from '@/lib/auto-fetch'
import { processImage } from '@/lib/image-processing'

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

interface ExcelRow {
  序号?: string | number
  产品名称?: string
  型号?: string
  品牌?: string
  规格参数?: string
  描述?: string
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const excelFile = formData.get('excel') as File
    const imageFile = formData.get('image') as File
    const autoFetch = formData.get('autoFetch') === 'true'

    if (!excelFile) {
      return NextResponse.json({ error: 'Excel file is required' }, { status: 400 })
    }

    // Get category name from Excel filename (remove extension)
    const categoryName = excelFile.name.replace(/\.(xlsx|xls)$/i, '').trim()
    const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    // Find or create category based on Excel filename
    let category = await prisma.category.findUnique({
      where: { slug: categorySlug },
    })

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: categoryName,
          slug: categorySlug,
        },
      })
    }

    // Create uploads directory
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Parse Excel
    const excelBytes = await excelFile.arrayBuffer()
    const excelBuffer = Buffer.from(excelBytes)

    let workbook
    try {
      workbook = XLSX.read(excelBuffer, { type: 'buffer' })
    } catch (err) {
      return NextResponse.json({ error: 'Invalid Excel file format' }, { status: 400 })
    }

    if (workbook.SheetNames.length === 0) {
      return NextResponse.json({ error: 'Excel file has no sheets' }, { status: 400 })
    }

    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json<ExcelRow>(worksheet)

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Excel file is empty or has no valid data rows' }, { status: 400 })
    }

    // Get watermark settings
    const wmSettings = await getWatermarkSettings()

    // Save image if provided
    let imageUrl = '/placeholder-product.png'
    if (imageFile) {
      const imageBytes = await imageFile.arrayBuffer()
      const imageBuffer = Buffer.from(imageBytes)
      const ext = imageFile.name.split('.').pop() || 'jpg'
      const imageName = `virtual-${Date.now()}.${ext}`
      const imagePath = join(uploadDir, imageName)
      // Process image (compress + watermark)
      const processedData = await processImage(imageBuffer, {
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
      await writeFile(imagePath, processedData)
      imageUrl = `/uploads/${imageName}`
    }

    // Process rows
    const results: {
      success: string[]
      errors: { product: string; error: string }[]
      autoFetch?: {
        total: number
        enriched: number
        notFound: number
        skipped: number
        failed: number
      }
    } = {
      success: [],
      errors: [],
    }

    // Track created product IDs for auto-fetch
    const createdProductIds: string[] = []

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 2 // Excel row number (1-indexed + header row)

      // Validate required fields
      if (!row.产品名称) {
        results.errors.push({ product: `Row ${rowNum}`, error: 'Missing product name (产品名称)' })
        continue
      }

      if (!row.型号) {
        results.errors.push({ product: `Row ${rowNum}`, error: 'Missing model number (型号)' })
        continue
      }

      // Generate slug
      const modelStr = String(row.型号).replace(/[^a-z0-9]+/gi, '-')
      const baseSlug = `${String(row.产品名称)}-${modelStr}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

      // Check for existing slug
      const existing = await prisma.product.findUnique({ where: { slug: baseSlug } })
      const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug

      // Parse specifications
      let specifications: string | null = null
      if (row.规格参数) {
        try {
          const specLines = String(row.规格参数).split('\n')
          const specObj: Record<string, string> = {}
          for (const line of specLines) {
            const colonIdx = line.indexOf(':')
            if (colonIdx > 0) {
              const key = line.substring(0, colonIdx).trim()
              const value = line.substring(colonIdx + 1).trim()
              if (key && value) specObj[key] = value
            }
          }
          if (Object.keys(specObj).length > 0) {
            specifications = JSON.stringify(specObj)
          }
        } catch {}
      }

      // Create product
      try {
        const product = await prisma.product.create({
          data: {
            name: String(row.产品名称),
            slug,
            model: row.型号 ? String(row.型号) : null,
            brand: row.品牌 ? String(row.品牌) : null,
            description: row.描述 ? String(row.描述) : null,
            specifications,
            images: JSON.stringify([imageUrl]),
            categoryId: category.id,
          },
        })

        createdProductIds.push(product.id)
        results.success.push(String(row.产品名称))
      } catch (err) {
        results.errors.push({
          product: `Row ${rowNum}: ${row.产品名称}`,
          error: `Database error: ${err instanceof Error ? err.message : 'Unknown'}`,
        })
      }
    }

    // Auto-fetch SEO data if enabled
    if (autoFetch && createdProductIds.length > 0) {
      console.log('Excel upload: autoFetch is enabled, checking SERPER_API_KEY...')
      if (!isAutoFetchAvailable()) {
        console.log('Excel upload: SERPER_API_KEY not available')
        // SERPER_API_KEY not set, skip auto-fetch
      } else {
        console.log('Excel upload: SERPER_API_KEY is available, starting auto-fetch for', createdProductIds.length, 'products')
        const autoFetchResults = {
          total: createdProductIds.length,
          enriched: 0,
          notFound: 0,
          skipped: 0,
          failed: 0,
        }

        // Process each product with model number
        for (const productId of createdProductIds) {
          const product = await prisma.product.findUnique({ where: { id: productId } })
          if (!product || !product.model) {
            autoFetchResults.skipped++
            continue
          }

          // Skip if already has metaTitle
          if (product.metaTitle) {
            autoFetchResults.skipped++
            continue
          }

          try {
            const result = await autoFetchProduct({
              model: product.model,
              brand: product.brand,
              productName: product.name,
            })

            if (result.success && result.enrichedData) {
              await prisma.product.update({
                where: { id: productId },
                data: {
                  description: result.enrichedData.description || product.description,
                  specifications: result.enrichedData.specifications
                    ? JSON.stringify(result.enrichedData.specifications)
                    : product.specifications,
                  metaTitle: result.enrichedData.metaTitle,
                  metaDescription: result.enrichedData.metaDescription,
                },
              })
              // Count both 'enriched' (from search) and 'fallback' (local generation) as successful
              autoFetchResults.enriched++
            } else if (result.status === 'not_found') {
              autoFetchResults.notFound++
            } else {
              autoFetchResults.failed++
            }
          } catch {
            autoFetchResults.failed++
          }
        }

        results.autoFetch = autoFetchResults
      }
    }

    return NextResponse.json({
      message: 'Excel upload processed',
      results,
      category: category.name,
    })
  } catch (error) {
    console.error('Excel upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
