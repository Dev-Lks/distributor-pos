import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { inventoryUpdateCurrentSchema } from '@/lib/validations'

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
    
    // Validar com Zod
    const validatedData = inventoryUpdateCurrentSchema.parse(body)
    
    const { productId, location, quantity } = validatedData

    const fieldMap = {
      coldRoom: 'coldRoomQuantity',
      house: 'houseQuantity',
      salePoint: 'salePointQuantity',
    } as const

    const field = fieldMap[location]

    const inventory = await prisma.inventory.upsert({
      where: { productId },
      update: { [field]: quantity },
      create: { productId, [field]: quantity },
    })
    
    logger.info('Inventory updated', {
      productId,
      location,
      quantity,
    })

    return NextResponse.json(inventory, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }
    
    logger.error('Failed to update inventory', { error })
    return NextResponse.json({ error: 'Erro ao atualizar inventário' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar com Zod
    const validatedData = inventoryUpdateCurrentSchema.parse(body)
    
    const { productId, location, quantity } = validatedData

    const fieldMap = {
      coldRoom: 'coldRoomQuantity',
      house: 'houseQuantity',
      salePoint: 'salePointQuantity',
    } as const

    const field = fieldMap[location]

    const inventory = await prisma.inventory.upsert({
      where: { productId },
      update: { [field]: quantity },
      create: { productId, [field]: quantity },
    })
    
    logger.info('Inventory patched', {
      productId,
      location,
      quantity,
    })

    return NextResponse.json(inventory)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }
    
    logger.error('Failed to update inventory', { error })
    return NextResponse.json({ error: 'Erro ao atualizar inventário' }, { status: 500 })
  }
}