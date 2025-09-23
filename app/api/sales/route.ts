import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })
    return NextResponse.json(sales)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items } = body // items: [{ productId, quantity }]

    // Calculate total
    let total = 0
    const saleItems = []

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      })
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 400 })
      }
      const price = product.salePrice
      total += price * item.quantity
      saleItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price,
      })

      // Update inventory
      const inventory = await prisma.inventory.findUnique({
        where: { productId: item.productId },
      })
      if (inventory) {
        await prisma.inventory.update({
          where: { productId: item.productId },
          data: { quantity: inventory.quantity - item.quantity },
        })
      } else {
        // If no inventory, create with negative? But assume exists
        await prisma.inventory.create({
          data: {
            productId: item.productId,
            quantity: -item.quantity,
          },
        })
      }
    }

    const sale = await prisma.sale.create({
      data: {
        total,
        items: {
          create: saleItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 })
  }
}