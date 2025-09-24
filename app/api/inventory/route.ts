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
      totalQuantity: item.coldRoomQuantity + item.houseQuantity + item.salePointQuantity,
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

    if (!location || !['coldRoom', 'house', 'salePoint'].includes(location)) {
      return NextResponse.json({ error: 'Invalid location' }, { status: 400 })
    }

    const fieldMap = {
      coldRoom: 'coldRoomQuantity',
      house: 'houseQuantity',
      salePoint: 'salePointQuantity',
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