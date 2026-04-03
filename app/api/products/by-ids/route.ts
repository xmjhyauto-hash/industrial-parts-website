import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'IDs array is required' }, { status: 400 })
    }

    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      include: {
        category: { select: { name: true, slug: true } },
      },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error fetching products by IDs:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
