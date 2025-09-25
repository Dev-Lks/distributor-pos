import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        product: true,
      },
    })
    const inventoryWithAlerts = inventory.map((item) => ({
      ...item,
      // Calcular alertas por local
      coldRoomAlert: item.coldRoomQuantity <= item.coldRoomMinStock,
      houseAlert: item.houseQuantity <= item.houseMinStock,
      salePointAlert: item.salePointQuantity <= item.salePointMinStock,
      totalQuantity: item.coldRoomQuantity + item.houseQuantity + item.salePointQuantity,
    }))
    return NextResponse.json(inventoryWithAlerts)
  } catch (error) {
    console.error('Failed to fetch inventory:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, location, quantity } = body as {
      productId: string
      location: 'coldRoom' | 'house' | 'salePoint'
      quantity: number
    }

    if (!productId || typeof quantity !== 'number' || !location) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    if (!['coldRoom', 'house', 'salePoint'].includes(location)) {
      return NextResponse.json({ error: 'Invalid location' }, { status: 400 })
    }

    const fieldMap: Record<typeof location, 'coldRoomQuantity' | 'houseQuantity' | 'salePointQuantity'> = {
      coldRoom: 'coldRoomQuantity',
      house: 'houseQuantity',
      salePoint: 'salePointQuantity',
    }

    const field = fieldMap[location]

    const inventory = await prisma.inventory.upsert({
      where: { productId },
      update: { [field]: quantity },
      create: { productId, [field]: quantity },
    })

    return NextResponse.json(inventory, { status: 201 })
  } catch (error) {
    console.error('Failed to update inventory:', error)
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 })
  }
}