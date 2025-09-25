import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

const saleItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
})

const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  paymentMethod: z.enum(['cash', 'card', 'pix', 'other']).optional(),
  customerName: z.string().optional(),
  pointOfSaleId: z.string().optional(),
})

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
    console.error('Failed to fetch sales:', error)
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawPayload = await request.json()
    const parsedPayload = createSaleSchema.safeParse(rawPayload)

    if (!parsedPayload.success) {
      const firstError = parsedPayload.error.issues.at(0)
      return NextResponse.json(
        {
          error: 'Invalid sale payload',
          details: firstError?.message,
        },
        { status: 400 }
      )
    }

    const input = parsedPayload.data
    const sanitizedCustomerName = input.customerName?.trim() || undefined
    const pointOfSaleId = input.pointOfSaleId?.trim() || undefined

    const aggregatedItemsMap = new Map<string, { productId: string; quantity: number }>()
    input.items.forEach((item) => {
      const existing = aggregatedItemsMap.get(item.productId)
      if (existing) {
        existing.quantity += item.quantity
      } else {
        aggregatedItemsMap.set(item.productId, { productId: item.productId, quantity: item.quantity })
      }
    })

    const aggregatedItems = Array.from(aggregatedItemsMap.values())
    const productIds = aggregatedItems.map((item) => item.productId)

    type ProductPointStock = {
      id: string
      productId: string
      pointOfSaleId: string
      quantity: number
      minStock: number
    }

    type ProductPointOfSaleDelegate = {
      findMany: (args?: unknown) => Promise<ProductPointStock[]>
      findUnique: (args: unknown) => Promise<{ quantity: number } | null>
      update: (args: unknown) => Promise<unknown>
    }

    type PrismaWithProductPoints = typeof prisma & {
      productPointOfSale: ProductPointOfSaleDelegate
    }

    const prismaWithPoints = prisma as PrismaWithProductPoints

    const [products, productPointStocks] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          inventory: true,
        },
      }),
      prismaWithPoints.productPointOfSale.findMany({
        where: { productId: { in: productIds } },
      }),
    ])

    type ProductWithInventory = (typeof products)[number]
    const productMap = new Map<string, ProductWithInventory>(
      products.map((product) => [product.id, product as ProductWithInventory])
    )
    const missingProducts = aggregatedItems
      .filter((item) => !productMap.has(item.productId))
      .map((item) => item.productId)

    if (missingProducts.length > 0) {
      return NextResponse.json(
        {
          error: `Products not found: ${missingProducts.join(', ')}`,
        },
        { status: 400 }
      )
    }

    const pointStockByProductId = productPointStocks.reduce<
      Map<string, ProductPointStock[]>
    >(
      (acc, stock) => {
        const list = acc.get(stock.productId) ?? []
        list.push(stock)
        acc.set(stock.productId, list)
        return acc
      },
      new Map()
    )

    let total = 0
    const saleItems: Array<{ productId: string; quantity: number; price: number }> = []
    for (const item of aggregatedItems) {
      const product = productMap.get(item.productId)!
      const pointStocks = pointStockByProductId.get(item.productId) ?? []

      let availableStock = product.inventory?.salePointQuantity ?? 0
      if (pointOfSaleId) {
        const pointStock = pointStocks.find((stock) => stock.pointOfSaleId === pointOfSaleId)
        if (pointStock) {
          availableStock = pointStock.quantity
        }
      }

      if (availableStock < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name}. Available: ${availableStock}, requested: ${item.quantity}`,
          },
          { status: 409 }
        )
      }

      const price = product.salePrice
      total += price * item.quantity
      saleItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price,
      })
    }

    const sale = await prisma.$transaction(async (tx) => {
      const transactionalClient = tx as PrismaWithProductPoints

      const saleData = {
        total,
        items: {
          create: saleItems,
        },
      } satisfies Prisma.SaleCreateInput

      const createdSale = await tx.sale.create({
        data: saleData,
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      })

      for (const item of aggregatedItems) {
        if (pointOfSaleId) {
          const pointStock = await transactionalClient.productPointOfSale.findUnique({
            where: {
              productId_pointOfSaleId: {
                productId: item.productId,
                pointOfSaleId,
              },
            },
            select: {
              quantity: true,
            },
          })

          if (pointStock) {
            if (pointStock.quantity < item.quantity) {
              throw new Error('INSUFFICIENT_STOCK')
            }

            await transactionalClient.productPointOfSale.update({
              where: {
                productId_pointOfSaleId: {
                  productId: item.productId,
                  pointOfSaleId,
                },
              },
              data: {
                quantity: {
                  decrement: item.quantity,
                },
              },
            })
            continue
          }
        }

        const inventory = await tx.inventory.findUnique({
          where: { productId: item.productId },
          select: {
            salePointQuantity: true,
          },
        })

        if (!inventory || inventory.salePointQuantity < item.quantity) {
          throw new Error('INSUFFICIENT_STOCK')
        }

        await tx.inventory.update({
          where: { productId: item.productId },
          data: {
            salePointQuantity: {
              decrement: item.quantity,
            },
          },
        })
      }

      return createdSale
    })

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'INSUFFICIENT_STOCK') {
      return NextResponse.json(
        {
          error: 'Insufficient stock to complete sale',
        },
        { status: 409 }
      )
    }

    console.error('Failed to create sale:', error)
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 })
  }
}