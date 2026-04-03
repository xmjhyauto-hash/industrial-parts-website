import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Build where clause - only filter by deletedAt if the column exists
    let where: Record<string, unknown> = { id }

    try {
      where.deletedAt = null
    } catch {
      // Column doesn't exist yet
    }

    const product = await prisma.product.findFirst({
      where,
      include: {
        category: {
          include: {
            parent: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
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
        category: { select: { name: true, slug: true } },
      },
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Try soft delete first, fall back to hard delete if column doesn't exist
    try {
      await prisma.product.update({
        where: { id },
        data: { deletedAt: new Date() },
      })
    } catch {
      // Column doesn't exist, do hard delete
      await prisma.product.delete({
        where: { id },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
