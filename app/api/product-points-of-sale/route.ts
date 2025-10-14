import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
const prismaProductPoints = (prisma as unknown as {
  productPointOfSale: {
    findMany: (args?: unknown) => Promise<unknown>
    create: (args: unknown) => Promise<unknown>
    update: (args: unknown) => Promise<unknown>
    delete: (args: unknown) => Promise<unknown>
  }
}).productPointOfSale

export async function GET() {
  try {
    const productPointsOfSale = await prismaProductPoints.findMany({
      include: {
        product: true,
        pointOfSale: true
      }
  }) as unknown[]
    return NextResponse.json(productPointsOfSale)
  } catch (error) {
    logger.error('Failed to fetch product points of sale:', { error })
    return NextResponse.json({ error: 'Failed to fetch product points of sale' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, pointOfSaleId, quantity = 0, minStock = 2 } = body as {
      productId?: string
      pointOfSaleId?: string
      quantity?: number
      minStock?: number
    }

    if (!productId || !pointOfSaleId) {
      return NextResponse.json({ error: 'productId and pointOfSaleId are required' }, { status: 400 })
    }

    const productPointOfSale = await prismaProductPoints.create({
      data: {
        productId,
        pointOfSaleId,
        quantity,
        minStock
      },
      include: {
        product: true,
        pointOfSale: true
      }
  }) as Record<string, unknown>
    return NextResponse.json(productPointOfSale, { status: 201 })
  } catch (error) {
    logger.error('Failed to create product point of sale:', { error })
    return NextResponse.json({ error: 'Failed to create product point of sale' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, quantity, minStock } = body as {
      id?: string
      quantity?: number
      minStock?: number
    }

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const productPointOfSale = await prismaProductPoints.update({
      where: { id },
      data: {
        quantity,
        minStock
      },
      include: {
        product: true,
        pointOfSale: true
      }
  }) as Record<string, unknown>
    return NextResponse.json(productPointOfSale)
  } catch (error) {
    logger.error('Failed to update product point of sale:', { error })
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

  await prismaProductPoints.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to delete product point of sale:', { error })
    return NextResponse.json({ error: 'Failed to delete product point of sale' }, { status: 500 })
  }
}