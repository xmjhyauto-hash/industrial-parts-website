import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const menuOnly = searchParams.get('menu') === 'true'

    const where: Record<string, unknown> = { parentId: null }
    if (menuOnly) {
      where.showInMenu = true
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        children: {
          where: menuOnly ? { showInMenu: true } : undefined,
          include: {
            children: true,
            _count: {
              select: { products: true },
            },
          },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, parentId, image, showInMenu, sortOrder } = body

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        parentId: parentId || null,
        image,
        showInMenu: showInMenu !== false,
        sortOrder: sortOrder || 0,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

// PATCH - Batch update sort orders
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { categories } = body

    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json({ error: 'Categories array is required' }, { status: 400 })
    }

    // Update each category's sortOrder
    await Promise.all(
      categories.map(({ id, sortOrder }: { id: string; sortOrder: number }) =>
        prisma.category.update({
          where: { id },
          data: { sortOrder },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating sort orders:', error)
    return NextResponse.json({ error: 'Failed to update sort orders' }, { status: 500 })
  }
}
