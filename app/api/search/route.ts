import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    // Use FTS5 for fast full-text search
    // Escape special FTS5 characters and prepare search term
    const ftsQuery = query
      .replace(/"/g, '""')
      .split(/\s+/)
      .filter(term => term.length > 0)
      .map(term => `"${term}"*`)
      .join(' ')

    let productSlugs: string[] = []

    try {
      // Search using FTS5 virtual table
      const ftsResults = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM product_fts WHERE product_fts MATCH ? LIMIT 20`,
        ftsQuery
      )
      productSlugs = ftsResults.map(r => r.id)
    } catch (ftsError) {
      // Fallback to LIKE if FTS5 table doesn't exist or error
      console.warn('FTS5 search failed, falling back to LIKE:', ftsError)

      const products = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { model: { contains: query } },
            { brand: { contains: query } },
            { description: { contains: query } },
          ],
        },
        select: { slug: true },
        take: 20,
      })
      productSlugs = products.map(p => p.slug)
    }

    // Fetch product details
    const products = await prisma.product.findMany({
      where: { slug: { in: productSlugs } },
      select: {
        name: true,
        slug: true,
        brand: true,
        model: true,
      },
      take: 10,
    })

    // Search categories with LIKE (categories are typically small)
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { description: { contains: query } },
        ],
      },
      select: {
        name: true,
        slug: true,
      },
      take: 5,
    })

    // Format results
    const results = [
      ...products.map((p) => ({
        type: 'product' as const,
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        model: p.model,
      })),
      ...categories.map((c) => ({
        type: 'category' as const,
        name: c.name,
        slug: c.slug,
      })),
    ]

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
