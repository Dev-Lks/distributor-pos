import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { LIMITS } from '@/lib/constants/limits'

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
    logger.error('Failed to fetch inventory', { error })
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

    // Validar range de quantidade
    if (quantity < 0) {
      return NextResponse.json(
        { error: 'Quantidade não pode ser negativa' },
        { status: 400 }
      )
    }

    if (quantity > LIMITS.MAX_QUANTITY) {
      return NextResponse.json(
        { error: `Quantidade excede limite máximo (${LIMITS.MAX_QUANTITY})` },
        { status: 400 }
      )
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
    logger.error('Failed to update inventory', { error })
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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

    // Validar range de quantidade
    if (quantity < 0) {
      return NextResponse.json(
        { error: 'Quantidade não pode ser negativa' },
        { status: 400 }
      )
    }

    if (quantity > LIMITS.MAX_QUANTITY) {
      return NextResponse.json(
        { error: `Quantidade excede limite máximo (${LIMITS.MAX_QUANTITY})` },
        { status: 400 }
      )
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

    return NextResponse.json(inventory)
  } catch (error) {
    logger.error('Failed to update inventory', { error })
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 })
  }
}