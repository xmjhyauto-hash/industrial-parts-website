import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get('categoryId')
  const featured = searchParams.get('featured')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  let orderBy: Record<string, string> = { createdAt: 'desc' }
  let productWhere: Record<string, unknown> = {}
  let countWhere: Record<string, unknown> = {}

  if (categoryId) {
    productWhere.categoryId = categoryId
    countWhere.categoryId = categoryId
  }
  if (featured === 'true') {
    productWhere.featured = true
    countWhere.featured = true
  }

  // Try with deletedAt filter first, fall back to without it if column doesn't exist
  let products: any[] = []
  let total = 0

  try {
    // Try with deletedAt filter
    const withDeletedAt = { ...productWhere, deletedAt: null }
    const withCountDeletedAt = { ...countWhere, deletedAt: null }

    ;[products, total] = await Promise.all([
      prisma.product.findMany({
        where: withDeletedAt,
        include: {
          category: {
            select: { name: true, slug: true },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.product.count({ where: withCountDeletedAt }),
    ])
  } catch (error) {
    // If error (possibly missing deletedAt column), try without it
    console.warn('Query with deletedAt failed, retrying without:', error)
    ;[products, total] = await Promise.all([
      prisma.product.findMany({
        where: productWhere,
        include: {
          category: {
            select: { name: true, slug: true },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.product.count({ where: countWhere }),
    ])
  }

  return NextResponse.json({
    products,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      model,
      brand,
      description,
      specifications,
      images,
      categoryId,
      metaTitle,
      metaDescription,
      featured,
    } = body

    if (!name || !categoryId) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      )
    }

    // Generate slug
    const baseSlug = model ? `${name}-${model}` : name
    const slug = baseSlug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if slug exists and make it unique if needed
    const existingProduct = await prisma.product.findUnique({ where: { slug } })
    const finalSlug = existingProduct ? `${slug}-${Date.now()}` : slug

    const product = await prisma.product.create({
      data: {
        name,
        slug: finalSlug,
        model,
        brand,
        description,
        specifications: specifications ? JSON.stringify(specifications) : null,
        images: JSON.stringify(images || []),
        categoryId,
        metaTitle,
        metaDescription,
        featured: featured || false,
      },
      include: {
        category: {
          select: { name: true, slug: true },
        },
      },
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
