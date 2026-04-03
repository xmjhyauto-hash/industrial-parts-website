import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autoFetchProduct, isAutoFetchAvailable } from '@/lib/auto-fetch'

export interface BatchAutoFetchRequest {
  productIds: string[]
  overwrite?: boolean
}

export interface BatchAutoFetchResult {
  total: number
  enriched: number
  notFound: number
  skipped: number
  failed: number
  errors: Array<{ productId: string; productName: string; error: string }>
}

/**
 * Process a batch of products for auto-fetch enrichment
 */
export async function POST(request: NextRequest) {
  try {
    // Check if auto-fetch is configured
    if (!isAutoFetchAvailable()) {
      return NextResponse.json(
        { error: 'Auto-fetch is not configured. Please set BING_API_KEY environment variable.' },
        { status: 503 }
      )
    }

    const body: BatchAutoFetchRequest = await request.json()
    const { productIds, overwrite = false } = body

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'productIds array is required' },
        { status: 400 }
      )
    }

    const result: BatchAutoFetchResult = {
      total: productIds.length,
      enriched: 0,
      notFound: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    }

    // Process each product sequentially (rate limiting is handled in autoFetchProduct)
    for (const productId of productIds) {
      try {
        // Get the product
        const product = await prisma.product.findUnique({
          where: { id: productId },
        })

        if (!product) {
          result.errors.push({
            productId,
            productName: 'Unknown',
            error: 'Product not found',
          })
          result.failed++
          continue
        }

        // Check if we should skip (already has metaTitle and not overwriting)
        if (product.metaTitle && !overwrite) {
          result.skipped++
          continue
        }

        // Check if product has model number
        if (!product.model) {
          result.skipped++
          continue
        }

        // Perform auto-fetch
        const fetchResult = await autoFetchProduct({
          model: product.model,
          brand: product.brand,
          productName: product.name,
        })

        if (fetchResult.success && fetchResult.enrichedData) {
          // Update product with enriched data
          await prisma.product.update({
            where: { id: productId },
            data: {
              description: fetchResult.enrichedData.description || product.description,
              specifications: fetchResult.enrichedData.specifications
                ? JSON.stringify(fetchResult.enrichedData.specifications)
                : product.specifications,
              metaTitle: fetchResult.enrichedData.metaTitle,
              metaDescription: fetchResult.enrichedData.metaDescription,
            },
          })
          // Count both 'enriched' (from search) and 'fallback' (local generation) as successful
          result.enriched++
        } else if (fetchResult.status === 'not_found') {
          result.notFound++
        } else if (fetchResult.status === 'skipped') {
          result.skipped++
        } else {
          result.errors.push({
            productId,
            productName: product.name,
            error: fetchResult.error || 'Unknown error',
          })
          result.failed++
        }
      } catch (error) {
        result.errors.push({
          productId,
          productName: 'Unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        result.failed++
      }
    }

    return NextResponse.json({
      success: true,
      result,
      message: `Processed ${result.total} products: ${result.enriched} enriched, ${result.notFound} not found online, ${result.skipped} skipped, ${result.failed} failed`,
    })
  } catch (error) {
    console.error('Batch auto-fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to process batch auto-fetch' },
      { status: 500 }
    )
  }
}
