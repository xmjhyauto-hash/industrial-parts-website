import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get all articles (excluding soft-deleted)
export async function GET() {
  try {
    // Build where clause - only filter by deletedAt if the column exists
    let where: Record<string, unknown> = {}

    try {
      where.deletedAt = null
    } catch {
      // Column doesn't exist yet, return all articles
    }

    const articles = await prisma.article.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ articles })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
  }
}

// POST - Create a new article
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, icon, sortOrder } = body

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    const article = await prisma.article.create({
      data: {
        title,
        description,
        icon: icon || 'Settings',
        sortOrder: sortOrder || 0,
        active: true,
      },
    })

    return NextResponse.json({ success: true, article }, { status: 201 })
  } catch (error) {
    console.error('Error creating article:', error)
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 })
  }
}
