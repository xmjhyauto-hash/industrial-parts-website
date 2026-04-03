import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get all soft-deleted items
// Returns empty results if deletedAt column doesn't exist yet
export async function GET() {
  try {
    const [products, articles] = await Promise.all([
      prisma.product.findMany({
        where: { deletedAt: { not: null } },
        include: {
          category: { select: { name: true } },
        },
        orderBy: { deletedAt: 'desc' },
      }),
      prisma.article.findMany({
        where: { deletedAt: { not: null } },
        orderBy: { deletedAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      products: products.map(p => ({ ...p, type: 'product' })),
      articles: articles.map(a => ({ ...a, type: 'article' })),
    })
  } catch (error) {
    // If the column doesn't exist, return empty results
    // This handles the case where db migration hasn't been run
    console.warn('Recycle bin query failed (possibly missing deletedAt column):', error)
    return NextResponse.json({
      products: [],
      articles: [],
    })
  }
}

// POST - Restore or permanently delete
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, productIds, articleIds } = body

    if (action === 'restore') {
      // Restore products
      if (productIds && productIds.length > 0) {
        await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { deletedAt: null },
        })
      }
      // Restore articles
      if (articleIds && articleIds.length > 0) {
        await prisma.article.updateMany({
          where: { id: { in: articleIds } },
          data: { deletedAt: null },
        })
      }
      return NextResponse.json({ success: true, message: 'Items restored' })
    }

    if (action === 'permanent-delete') {
      // Permanently delete products
      if (productIds && productIds.length > 0) {
        await prisma.product.deleteMany({
          where: { id: { in: productIds }, deletedAt: { not: null } },
        })
      }
      // Permanently delete articles
      if (articleIds && articleIds.length > 0) {
        await prisma.article.deleteMany({
          where: { id: { in: articleIds }, deletedAt: { not: null } },
        })
      }
      return NextResponse.json({ success: true, message: 'Items permanently deleted' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error processing recycle bin action:', error)
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 })
  }
}