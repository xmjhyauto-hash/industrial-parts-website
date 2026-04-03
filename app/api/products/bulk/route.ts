import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, productIds, categoryId } = body

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'productIds array is required' },
        { status: 400 }
      )
    }

    if (action === 'updateCategory') {
      if (!categoryId) {
        return NextResponse.json(
          { error: 'categoryId is required for updateCategory action' },
          { status: 400 }
        )
      }

      // Verify category exists
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      })

      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }

      // Update all products
      const result = await prisma.product.updateMany({
        where: {
          id: { in: productIds },
        },
        data: {
          categoryId,
        },
      })

      return NextResponse.json({
        success: true,
        updated: result.count,
        categoryName: category.name,
      })
    }

    if (action === 'delete') {
      // Try soft delete first, fall back to hard delete if column doesn't exist
      try {
        const result = await prisma.product.updateMany({
          where: {
            id: { in: productIds },
          },
          data: {
            deletedAt: new Date(),
          },
        })
        return NextResponse.json({
          success: true,
          deleted: result.count,
        })
      } catch {
        // Column doesn't exist, do hard delete
        const result = await prisma.product.deleteMany({
          where: {
            id: { in: productIds },
          },
        })
        return NextResponse.json({
          success: true,
          deleted: result.count,
        })
      }
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: updateCategory, delete' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Bulk operation error:', error)
    return NextResponse.json(
      { error: 'Bulk operation failed' },
      { status: 500 }
    )
  }
}