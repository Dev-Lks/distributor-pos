import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        product: true,
      },
    })
    const inventoryWithAlerts = inventory.map((item: any) => ({
      ...item,
      // Calcular alertas por local
      coldRoomAlert: item.coldRoomQuantity <= item.coldRoomMinStock,
      houseAlert: item.houseQuantity <= item.houseMinStock,
      salePointAlert: item.salePointQuantity <= item.salePointMinStock,
      point1Alert: item.point1Quantity <= item.point1MinStock,
      point2Alert: item.point2Quantity <= item.point2MinStock,
      point3Alert: item.point3Quantity <= item.point3MinStock,
      totalQuantity: item.coldRoomQuantity + item.houseQuantity + item.salePointQuantity + item.point1Quantity + item.point2Quantity + item.point3Quantity,
    }))
    return NextResponse.json(inventoryWithAlerts)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, location, quantity } = body

    if (!location || !['coldRoom', 'house', 'salePoint', 'point1', 'point2', 'point3'].includes(location)) {
      return NextResponse.json({ error: 'Invalid location' }, { status: 400 })
    }

    const fieldMap = {
      coldRoom: 'coldRoomQuantity',
      house: 'houseQuantity',
      salePoint: 'salePointQuantity',
      point1: 'point1Quantity',
      point2: 'point2Quantity',
      point3: 'point3Quantity',
    }

    const field = fieldMap[location as keyof typeof fieldMap]

    const inventory = await prisma.inventory.upsert({
      where: { productId },
      update: { [field]: quantity },
      create: { productId, [field]: quantity },
    })

    return NextResponse.json(inventory, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 })
  }
}