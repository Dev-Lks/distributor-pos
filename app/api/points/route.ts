import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const points = await prisma.pointOfSale.findMany({
      orderBy: { createdAt: 'asc' }
    })
    return NextResponse.json(points)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch points of sale' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, isActive = true } = body

    const point = await prisma.pointOfSale.create({
      data: { name, isActive }
    })
    return NextResponse.json(point, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create point of sale' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, isActive } = body

    const point = await prisma.pointOfSale.update({
      where: { id },
      data: { name, isActive }
    })
    return NextResponse.json(point)
  } catch (error) {
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
    return NextResponse.json({ error: 'Failed to delete point of sale' }, { status: 500 })
  }
}