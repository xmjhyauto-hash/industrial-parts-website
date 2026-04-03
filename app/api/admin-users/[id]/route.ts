import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// GET - Get single admin user
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const user = await prisma.adminUser.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching admin user:', error)
    return NextResponse.json({ error: 'Failed to fetch admin user' }, { status: 500 })
  }
}

// PUT - Update admin user
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { username, password, role, isActive } = body

    const updateData: Record<string, unknown> = {}

    if (username) {
      // Check if username is taken by another user
      const existing = await prisma.adminUser.findFirst({
        where: { username, NOT: { id } },
      })
      if (existing) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
      }
      updateData.username = username
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    if (role) {
      updateData.role = role
    }

    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive
    }

    const user = await prisma.adminUser.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error updating admin user:', error)
    return NextResponse.json({ error: 'Failed to update admin user' }, { status: 500 })
  }
}

// DELETE - Delete admin user
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Prevent deleting yourself
    const users = await prisma.adminUser.findMany()
    if (users.length <= 1) {
      return NextResponse.json({ error: 'Cannot delete the last admin user' }, { status: 400 })
    }

    await prisma.adminUser.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting admin user:', error)
    return NextResponse.json({ error: 'Failed to delete admin user' }, { status: 500 })
  }
}
