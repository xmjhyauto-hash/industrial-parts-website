import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
      },
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, parentId, image, showInMenu, sortOrder } = body

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    // Generate new slug if name changed
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Ensure showInMenu is explicitly boolean
    const showInMenuValue = typeof showInMenu === 'boolean' ? showInMenu : true

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        parentId: parentId || null,
        image,
        showInMenu: showInMenuValue,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ error: `Failed to update category: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Try soft delete first, fall back to hard delete if column doesn't exist
    try {
      // Soft delete all products in this category
      await prisma.product.updateMany({
        where: { categoryId: id },
        data: { deletedAt: new Date() },
      })

      // Soft delete subcategories' products
      const subcategories = await prisma.category.findMany({
        where: { parentId: id },
        select: { id: true },
      })

      for (const sub of subcategories) {
        await prisma.product.updateMany({
          where: { categoryId: sub.id },
          data: { deletedAt: new Date() },
        })
      }

      // Delete subcategories (soft delete if possible)
      for (const sub of subcategories) {
        await prisma.category.delete({
          where: { id: sub.id },
        })
      }

      // Delete the category
      await prisma.category.delete({
        where: { id },
      })
    } catch {
      // Fall back to hard delete (if deletedAt column doesn't exist)
      await prisma.category.delete({
        where: { id },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
