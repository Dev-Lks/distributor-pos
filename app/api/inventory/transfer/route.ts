import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

const VALID_LOCATIONS = ['coldRoom', 'house', 'salePoint'] as const

type InventoryLocation = (typeof VALID_LOCATIONS)[number]

type TransferPayload = {
  productId: string
  fromLocation: InventoryLocation
  toLocation: InventoryLocation
  quantity: number
}

const LOCATION_FIELD_MAP: Record<InventoryLocation, 'coldRoomQuantity' | 'houseQuantity' | 'salePointQuantity'> = {
  coldRoom: 'coldRoomQuantity',
  house: 'houseQuantity',
  salePoint: 'salePointQuantity',
}

class InsufficientStockError extends Error {
  constructor(public readonly available: number) {
    super('INSUFFICIENT_STOCK')
  }
}

function isValidLocation(value: unknown): value is InventoryLocation {
  return typeof value === 'string' && (VALID_LOCATIONS as readonly string[]).includes(value)
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Partial<TransferPayload>

    const productId = payload?.productId?.trim()

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    if (!isValidLocation(payload.fromLocation) || !isValidLocation(payload.toLocation)) {
      return NextResponse.json({ error: 'Invalid locations provided' }, { status: 400 })
    }

    if (payload.fromLocation === payload.toLocation) {
      return NextResponse.json({ error: 'Source and destination locations must differ' }, { status: 400 })
    }

    const quantity = Number(payload.quantity)
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be a positive number' }, { status: 400 })
    }

    const updatedInventory = await prisma.$transaction(async (tx) => {
      let inventory = await tx.inventory.findUnique({
        where: { productId },
      })

      if (!inventory) {
        inventory = await tx.inventory.create({
          data: { productId },
        })
      }

      const fromField = LOCATION_FIELD_MAP[payload.fromLocation!]
      const toField = LOCATION_FIELD_MAP[payload.toLocation!]

      const available = inventory[fromField]
      if (available < quantity) {
        throw new InsufficientStockError(available)
      }

      return tx.inventory.update({
        where: { productId },
        data: {
          [fromField]: available - quantity,
          [toField]: inventory[toField] + quantity,
        },
      })
    })

    return NextResponse.json(updatedInventory)
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return NextResponse.json(
        {
          error: 'Quantidade indisponível no local de origem',
          available: error.available,
        },
        { status: 409 }
      )
    }

    console.error('Failed to transfer inventory:', error)
    return NextResponse.json({ error: 'Failed to transfer inventory' }, { status: 500 })
  }
}
