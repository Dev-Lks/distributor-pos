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
  console.time('Sale Creation')
  try {
    const body = await request.json()
    const { items } = body // items: [{ productId, quantity }]

    // Fetch all products and inventory in one query
    const productIds = items.map((item: any) => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { inventory: true },
    })

    // Create a map for quick lookup
    const productMap = new Map(products.map(p => [p.id, p]))

    // Validate all products exist and have sufficient stock
    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) {
        return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 })
      }
      const availableStock = product.inventory?.salePointQuantity ?? 0
      if (availableStock < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${item.quantity}` }, { status: 400 })
      }
    }

    // Calculate total and prepare sale items
    let total = 0
    const saleItems = items.map((item: any) => {
      const product = productMap.get(item.productId)!
      const price = product.salePrice
      total += price * item.quantity
      return {
        productId: item.productId,
        quantity: item.quantity,
        price,
      }
    })

    // Use transaction for atomicity
    const sale = await prisma.$transaction(async (tx) => {
      // Create the sale
      const newSale = await tx.sale.create({
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

      // Update inventory for each item
      for (const item of items) {
        const inventory = await tx.inventory.findUnique({
          where: { productId: item.productId },
        })
        if (inventory) {
          await tx.inventory.update({
            where: { productId: item.productId },
            data: { salePointQuantity: inventory.salePointQuantity - item.quantity },
          })
        } else {
          // Create inventory with negative quantity if doesn't exist
          await tx.inventory.create({
            data: {
              productId: item.productId,
              salePointQuantity: -item.quantity,
            },
          })
        }
      }

      return newSale
    })

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 })
  } finally {
    console.timeEnd('Sale Creation')
  }
}