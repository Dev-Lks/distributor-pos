import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { CashSessionStatus } from '@prisma/client'

const saleItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
})

const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  paymentMethod: z.enum(['cash', 'card', 'pix', 'other']).optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().email('E-mail inválido').optional(),
  customerPhone: z.string().optional(),
  customerDocument: z.string().optional(),
  customerAddress: z.string().optional(),
  channel: z.string().optional(),
  discountValue: z.number().nonnegative().optional(),
  taxValue: z.number().nonnegative().optional(),
  serviceCharge: z.number().optional(),
  notes: z.string().optional(),
  pointOfSaleId: z.string().optional(),
  registerCustomer: z.boolean().optional(),
  payments: z.array(
    z.object({
      method: z.string().min(1),
      amount: z.number().nonnegative(),
      receivedAt: z.coerce.date().optional(),
      reference: z.string().optional(),
      notes: z.string().optional(),
    })
  ).optional(),
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
        pointOfSale: true,
        payments: true,
        customer: true,
      } as any,
      orderBy: {
        date: 'desc',
      },
    })
    return NextResponse.json(sales as any)
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

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const pointOfSaleIdFromPayload = input.pointOfSaleId?.trim()

    const activeCashSession = await prisma.cashSession.findFirst({
      where: {
        userId: session.user.id,
        status: CashSessionStatus.OPEN,
        ...(pointOfSaleIdFromPayload
          ? {
              OR: [
                { pointOfSaleId: pointOfSaleIdFromPayload },
                { pointOfSaleId: null },
              ],
            }
          : {}),
      },
      orderBy: {
        openedAt: 'desc',
      },
    })

    if (!activeCashSession) {
      return NextResponse.json(
        {
          error: 'Nenhum turno de caixa aberto',
          details: 'Abra o caixa antes de registrar vendas.',
        },
        { status: 409 }
      )
    }
  const sanitizedCustomerName = input.customerName?.trim() || undefined
  const sanitizedCustomerEmail = input.customerEmail?.trim() || undefined
  const sanitizedCustomerPhone = input.customerPhone?.trim() || undefined
  const sanitizedCustomerDocument = input.customerDocument?.trim() || undefined
  const sanitizedCustomerAddress = input.customerAddress?.trim() || undefined
  const sanitizedChannel = input.channel?.trim() || undefined
  const sanitizedNotes = input.notes?.trim() || undefined
  const pointOfSaleId = pointOfSaleIdFromPayload || activeCashSession.pointOfSaleId || undefined
  const discountValue = Math.max(input.discountValue ?? 0, 0)
  const taxValue = Math.max(input.taxValue ?? 0, 0)
  const serviceCharge = input.serviceCharge ?? 0
  const paymentsPayload = input.payments?.filter((payment) => payment.amount >= 0) ?? []
  const shouldRegisterCustomer = input.registerCustomer ?? false

  if (shouldRegisterCustomer && !sanitizedCustomerName) {
    return NextResponse.json(
      {
        error: 'Nome do cliente é obrigatório para cadastro',
      },
      { status: 400 }
    )
  }

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

    type InventoryMovementDelegate = {
      create: (args: unknown) => Promise<unknown>
    }

    type SalePaymentDelegate = {
      create: (args: unknown) => Promise<unknown>
    }

      type CustomerDelegate = {
        upsert: (args: unknown) => Promise<{ id: string }>
        create: (args: unknown) => Promise<{ id: string }>
      }

    type PrismaWithProductPoints = typeof prisma & {
      productPointOfSale: ProductPointOfSaleDelegate
      inventoryMovement: InventoryMovementDelegate
      salePayment: SalePaymentDelegate
        customer: CustomerDelegate
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

    let subtotal = 0
    let costOfGoods = 0
    const saleItems: Array<{ productId: string; quantity: number; price: number; unitCost: number }> = []
    const movementDrafts: Array<{
      productId: string
      quantity: number
      unitCost: number
      fromLocation: string | null
    }> = []
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

      const fromLocation = pointOfSaleId ? 'SALE_POINT' : 'HOUSE'
      const price = product.salePrice
      subtotal += price * item.quantity
      costOfGoods += (product.cost ?? 0) * item.quantity
      saleItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price,
        unitCost: product.cost ?? 0,
      })
      movementDrafts.push({
        productId: item.productId,
        quantity: item.quantity,
        unitCost: product.cost ?? 0,
        fromLocation,
      })
    }

    const netTotal = subtotal - discountValue + taxValue + serviceCharge
    const grossMarginValue = netTotal - costOfGoods

    const sale = await prisma.$transaction(async (tx) => {
      const transactionalClient = tx as PrismaWithProductPoints

      let customerRecord: { id: string } | null = null

      if (shouldRegisterCustomer && sanitizedCustomerName) {
        if (sanitizedCustomerPhone) {
          customerRecord = await transactionalClient.customer.upsert({
            where: { phone: sanitizedCustomerPhone },
            create: {
              name: sanitizedCustomerName,
              phone: sanitizedCustomerPhone,
              email: sanitizedCustomerEmail,
              address: sanitizedCustomerAddress,
            },
            update: {
              name: sanitizedCustomerName,
              email: sanitizedCustomerEmail,
              address: sanitizedCustomerAddress,
            },
          })
        } else {
          customerRecord = await transactionalClient.customer.create({
            data: {
              name: sanitizedCustomerName,
              email: sanitizedCustomerEmail,
              address: sanitizedCustomerAddress,
              phone: sanitizedCustomerPhone,
            },
          })
        }
      }

      const saleData = {
        total: netTotal,
        paymentMethod: input.paymentMethod ?? null,
        customerName: sanitizedCustomerName ?? null,
        customerEmail: sanitizedCustomerEmail ?? null,
        customerPhone: sanitizedCustomerPhone ?? null,
        customerDocument: sanitizedCustomerDocument ?? null,
        customerAddress: sanitizedCustomerAddress ?? null,
        channel: sanitizedChannel ?? null,
        subtotal,
        discountValue,
        taxValue,
        serviceCharge,
        costOfGoods,
        grossMargin: grossMarginValue,
        notes: sanitizedNotes ?? null,
  pointOfSale: pointOfSaleId ? { connect: { id: pointOfSaleId } } : undefined,
  cashSession: { connect: { id: activeCashSession.id } },
        items: {
          create: saleItems.map((item) => ({
            product: {
              connect: {
                id: item.productId,
              },
            },
            quantity: item.quantity,
            price: item.price,
            unitCost: item.unitCost,
            discount: saleItems.length > 0 ? discountValue / saleItems.length : 0,
          })),
        },
        customer: customerRecord ? { connect: { id: customerRecord.id } } : undefined,
      } as any

      const createdSale = await tx.sale.create({
        data: saleData,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          pointOfSale: true,
          payments: true,
          customer: true,
        } as any,
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

      if (movementDrafts.length > 0) {
        await Promise.all(
          movementDrafts.map((movement) =>
            transactionalClient.inventoryMovement.create({
              data: {
                productId: movement.productId,
                saleId: createdSale.id,
                pointOfSaleId,
                type: 'SALE',
                quantity: movement.quantity,
                unitCost: movement.unitCost,
                fromLocation: movement.fromLocation,
                notes: sanitizedNotes ?? 'Venda registrada',
                performedBy: 'dashboard-pos',
                occurredAt: new Date(),
              } as any,
            })
          )
        )
      }

      const paymentsToPersist = paymentsPayload.length
        ? paymentsPayload
        : (input.paymentMethod
            ? [
                {
                  method: input.paymentMethod,
                  amount: netTotal,
                  receivedAt: new Date(),
                },
              ]
            : [])

      if (paymentsToPersist.length > 0) {
        await Promise.all(
          paymentsToPersist.map((payment) =>
            transactionalClient.salePayment.create({
              data: {
                saleId: createdSale.id,
                method: payment.method,
                amount: payment.amount,
                receivedAt: payment.receivedAt ?? new Date(),
                reference: payment.reference,
                notes: payment.notes,
                cashSessionId: activeCashSession.id,
              } as any,
            })
          )
        )
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