import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT - Update an article
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, icon, sortOrder, active } = body

    const article = await prisma.article.update({
      where: { id },
      data: {
        title,
        description,
        icon,
        sortOrder: sortOrder !== undefined ? sortOrder : undefined,
        active: active !== undefined ? active : undefined,
      },
    })

    return NextResponse.json({ success: true, article })
  } catch (error) {
    console.error('Error updating article:', error)
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 })
  }
}

// DELETE - Soft delete an article (fall back to hard delete if column doesn't exist)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    try {
      await prisma.article.update({
        where: { id },
        data: { deletedAt: new Date() },
      })
    } catch {
      // Column doesn't exist, do hard delete
      await prisma.article.delete({
        where: { id },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 })
  }
}
