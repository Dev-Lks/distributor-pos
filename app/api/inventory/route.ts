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
      alert: item.quantity <= item.minStock,
    }))
    return NextResponse.json(inventoryWithAlerts)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, quantity } = body

    const inventory = await prisma.inventory.upsert({
      where: { productId },
      update: { quantity },
      create: { productId, quantity },
    })

    return NextResponse.json(inventory, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 })
  }
}