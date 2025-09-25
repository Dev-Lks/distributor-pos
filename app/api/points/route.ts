import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const points = await prisma.pointOfSale.findMany({
      orderBy: { createdAt: 'asc' }
    })
    return NextResponse.json(points)
  } catch (error) {
    console.error('Failed to fetch points of sale:', error)
    return NextResponse.json({ error: 'Failed to fetch points of sale' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, isActive = true } = body as { name?: string; isActive?: boolean }

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const point = await prisma.pointOfSale.create({
      data: { name, isActive }
    })
    return NextResponse.json(point, { status: 201 })
  } catch (error) {
    console.error('Failed to create point of sale:', error)
    return NextResponse.json({ error: 'Failed to create point of sale' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, isActive } = body as { id?: string; name?: string; isActive?: boolean }

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const point = await prisma.pointOfSale.update({
      where: { id },
      data: { name, isActive }
    })
    return NextResponse.json(point)
  } catch (error) {
    console.error('Failed to update point of sale:', error)
    return NextResponse.json({ error: 'Failed to update point of sale' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    await prisma.pointOfSale.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete point of sale:', error)
    return NextResponse.json({ error: 'Failed to delete point of sale' }, { status: 500 })
  }
}