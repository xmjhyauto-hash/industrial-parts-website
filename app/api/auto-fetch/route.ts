import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { autoFetchProduct, isAutoFetchAvailable } from '@/lib/auto-fetch'

export async function POST(request: NextRequest) {
  try {
    // Check if auto-fetch is configured
    if (!isAutoFetchAvailable()) {
      return NextResponse.json(
        { error: 'Auto-fetch is not configured. Please set BING_API_KEY environment variable.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { productId, overwrite } = body

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      )
    }

    // Get the product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if we should skip (already has metaTitle and not overwriting)
    if (product.metaTitle && !overwrite) {
      return NextResponse.json(
        {
          success: false,
          status: 'skipped',
          message: 'Product already has metaTitle. Set overwrite=true to replace.',
          product: {
            id: product.id,
            metaTitle: product.metaTitle,
            metaDescription: product.metaDescription,
          }
        },
        { status: 200 }
      )
    }

    // Check if product has model number
    if (!product.model) {
      return NextResponse.json(
        {
          success: false,
          status: 'skipped',
          message: 'Product has no model number to search for.',
        },
        { status: 200 }
      )
    }

    // Perform auto-fetch
    const result = await autoFetchProduct({
      model: product.model,
      brand: product.brand,
      productName: product.name,
    })

    if (result.success && result.enrichedData) {
      // Update product with enriched data
      const updatedProduct = await prisma.product.update({
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

      return NextResponse.json({
        success: true,
        status: result.status, // 'enriched' or 'fallback'
        product: {
          id: updatedProduct.id,
          metaTitle: updatedProduct.metaTitle,
          metaDescription: updatedProduct.metaDescription,
          description: updatedProduct.description,
          specifications: updatedProduct.specifications,
        },
        sources: result.sources,
      })
    } else {
      return NextResponse.json({
        success: false,
        status: result.status,
        error: result.error,
        message: result.status === 'not_found'
          ? `Could not find product information for model "${product.model}"`
          : result.error,
      })
    }
  } catch (error) {
    console.error('Auto-fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to auto-fetch product data' },
      { status: 500 }
    )
  }
}
