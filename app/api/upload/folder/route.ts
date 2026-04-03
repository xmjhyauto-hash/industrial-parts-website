import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import JSZip from 'jszip'
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

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const autoFetch = formData.get('autoFetch') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Get watermark settings once for all images
    const wmSettings = await getWatermarkSettings()

    // Read ZIP
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const zip = await JSZip.loadAsync(buffer)

    // Get ZIP filename (without extension) as category name
    const zipFileName = file.name.replace(/\.zip$/i, '')
    const categoryName = zipFileName.trim()
    const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    // Find or create category
    let category = await prisma.category.findUnique({ where: { slug: categorySlug } })
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: categoryName,
          slug: categorySlug,
        },
      })
    }

    const results: {
      success: string[]
      errors: { product: string; error: string }[]
      autoFetch: {
        total: number
        enriched: number
        notFound: number
        skipped: number
        failed: number
      } | null
    } = {
      success: [],
      errors: [],
      autoFetch: null,
    }

    // Track created product IDs for auto-fetch
    const createdProductIds: string[] = []

    // Find all subfolders (products)
    const folders: Record<string, string[]> = {}
    zip.forEach((relativePath, zipEntry) => {
      if (zipEntry.dir) return
      const parts = relativePath.split('/')
      if (parts.length >= 2) {
        const folderName = parts[0]
        if (!folders[folderName]) folders[folderName] = []
        folders[folderName].push(relativePath)
      }
    })

    // Process each product folder
    for (const [productName, filePaths] of Object.entries(folders)) {
      // Get image files
      const imagePaths = filePaths
        .filter(p => /\.(jpg|jpeg|png|webp|gif)$/i.test(p))
        .slice(0, 10) // Max 10 images

      if (imagePaths.length === 0) {
        results.errors.push({ product: productName, error: 'No valid images' })
        continue
      }

      // Save images
      const productImages: string[] = []
      for (let i = 0; i < imagePaths.length; i++) {
        const originalPath = imagePaths[i]
        const ext = originalPath.split('.').pop()?.toLowerCase() || 'jpg'
        const imageName = `${productName}-${Date.now()}-${i + 1}.${ext}`
        const destPath = join(uploadDir, imageName)

        const fileData = await zip.file(originalPath)?.async('nodebuffer')
        if (fileData) {
          try {
            // Process image (compress + watermark)
            const processedData = await processImage(fileData, {
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
            await writeFile(destPath, processedData)
          } catch (imageError) {
            // Fall back to original file if processing fails
            console.warn('Image processing failed, saving original:', imageError)
            await writeFile(destPath, fileData)
          }
          productImages.push(`/uploads/${imageName}`)
        }
      }

      // Create product
      const baseSlug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const existing = await prisma.product.findUnique({ where: { slug: baseSlug } })
      const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug

      // Extract model from product name (assume product name IS the model for folder upload)
      const model = productName.trim()

      try {
        const product = await prisma.product.create({
          data: {
            name: productName,
            slug,
            model,
            images: JSON.stringify(productImages),
            categoryId: category.id,
          },
        })
        createdProductIds.push(product.id)
        results.success.push(productName)
      } catch (err) {
        results.errors.push({
          product: productName,
          error: `Failed to create: ${err instanceof Error ? err.message : 'Unknown error'}`,
        })
      }
    }

    // Auto-fetch SEO data if enabled
    if (autoFetch && createdProductIds.length > 0) {
      if (!isAutoFetchAvailable()) {
        // SERPER_API_KEY not set, skip auto-fetch
      } else {
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
              // Count 'enriched' (from search), 'fallback' (local generation), and other success as enriched
              autoFetchResults.enriched++
            } else if (result.status === 'not_found') {
              autoFetchResults.notFound++
            } else {
              autoFetchResults.failed++
            }
          } catch (err) {
            console.error('Auto-fetch error for product', productId, ':', err)
            autoFetchResults.failed++
          }
        }

        results.autoFetch = autoFetchResults
      }
    }

    return NextResponse.json({ message: 'Upload complete', results })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
