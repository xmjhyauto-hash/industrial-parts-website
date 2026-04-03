import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET - List all admin users
export async function GET() {
  try {
    const users = await prisma.adminUser.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching admin users:', error)
    return NextResponse.json({ error: 'Failed to fetch admin users' }, { status: 500 })
  }
}

// POST - Create new admin user
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password, role } = body

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    // Check if username exists
    const existing = await prisma.adminUser.findUnique({
      where: { username },
    })

    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    console.log('Creating admin user with data:', { username, role })

    const user = await prisma.adminUser.create({
      data: {
        username,
        password: hashedPassword,
        role: role || 'staff',
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Error creating admin user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to create admin user: ${errorMessage}` }, { status: 500 })
  }
}
