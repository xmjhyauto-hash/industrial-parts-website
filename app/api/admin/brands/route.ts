import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ brands })
  } catch (error) {
    console.error('Brands fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, logo, url, sortOrder, active } = body

    const brand = await prisma.brand.create({
      data: {
        name: name || 'New Brand',
        logo: logo || '',
        url: url || '',
        sortOrder: sortOrder || 0,
        active: active !== undefined ? active : true,
      },
    })

    return NextResponse.json({ brand })
  } catch (error) {
    console.error('Brand create error:', error)
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, logo, url, sortOrder, active } = body

    const brand = await prisma.brand.update({
      where: { id },
      data: {
        name,
        logo,
        url,
        sortOrder,
        active,
      },
    })

    return NextResponse.json({ brand })
  } catch (error) {
    console.error('Brand update error:', error)
    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Brand ID required' }, { status: 400 })
    }

    await prisma.brand.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Brand delete error:', error)
    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 })
  }
}
