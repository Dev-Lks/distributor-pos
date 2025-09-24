import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const productPointsOfSale = await (prisma as any).productPointOfSale.findMany({
      include: {
        product: true,
        pointOfSale: true
      }
    })
    return NextResponse.json(productPointsOfSale)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch product points of sale' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, pointOfSaleId, quantity, minStock } = body

    const productPointOfSale = await (prisma as any).productPointOfSale.create({
      data: {
        productId,
        pointOfSaleId,
        quantity: quantity || 0,
        minStock: minStock || 2
      },
      include: {
        product: true,
        pointOfSale: true
      }
    })
    return NextResponse.json(productPointOfSale, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product point of sale' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, quantity, minStock } = body

    const productPointOfSale = await (prisma as any).productPointOfSale.update({
      where: { id },
      data: {
        quantity,
        minStock
      },
      include: {
        product: true,
        pointOfSale: true
      }
    })
    return NextResponse.json(productPointOfSale)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product point of sale' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    await (prisma as any).productPointOfSale.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product point of sale' }, { status: 500 })
  }
}