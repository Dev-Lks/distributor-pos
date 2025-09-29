import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { CashSessionStatus, PaymentStatus, PendingCartStatus, PersonType } from '@prisma/client'
import { detectPersonType, sanitizeDocument, validateCpfCnpj } from '@/lib/documents'
import { markPendingCartConverted } from '@/lib/pendingCarts'

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
  customerId: z.string().optional(),
  channel: z.string().optional(),
  discountValue: z.number().nonnegative().optional(),
  taxValue: z.number().nonnegative().optional(),
  serviceCharge: z.number().optional(),
  notes: z.string().optional(),
  pointOfSaleId: z.string().optional(),
  pendingCartId: z.string().optional(),
  registerCustomer: z.boolean().optional(),
  payments: z.array(
    z.object({
      method: z.string().min(1),
      amount: z.number().nonnegative(),
      receivedAt: z.coerce.date().optional(),
      dueDate: z.coerce.date().optional(),
      status: z.nativeEnum(PaymentStatus).optional(),
      paidAmount: z.number().nonnegative().optional(),
      reference: z.string().optional(),
      notes: z.string().optional(),
      installmentNumber: z.number().int().positive().optional(),
      installmentsTotal: z.number().int().positive().optional(),
    })
  ).optional(),
})

type SalePaymentInputPayload = {
  method: string
  amount: number
  receivedAt?: Date
  dueDate?: Date
  status?: PaymentStatus
  paidAmount?: number
  reference?: string
  notes?: string
  installmentNumber?: number
  installmentsTotal?: number
}

type NormalizedPayment = {
  method: string
  amount: number
  status: PaymentStatus
  paidAmount: number
  dueDate: Date | null
  receivedAt: Date | null
  reference?: string | null
  notes?: string | null
  installmentNumber?: number | null
  installmentsTotal?: number | null
  cashSessionId: string | null
}

function normalizePayments(params: {
  payments: SalePaymentInputPayload[]
  fallbackMethod?: string
  netTotal: number
  cashSessionId: string
}): NormalizedPayment[] {
  const basePayments = params.payments.length > 0
    ? params.payments
    : (params.fallbackMethod
        ? [
            {
              method: params.fallbackMethod,
              amount: params.netTotal,
              status: PaymentStatus.PAID,
              receivedAt: new Date(),
              paidAmount: params.netTotal,
            } as SalePaymentInputPayload,
          ]
        : [])

  return basePayments.map((payment) => {
    const status = payment.status ?? (payment.dueDate ? PaymentStatus.PENDING : PaymentStatus.PAID)
    const paidAmount = Math.min(
      payment.paidAmount ?? (status === PaymentStatus.PAID ? payment.amount : 0),
      payment.amount,
    )
    const dueDate = payment.dueDate ?? (status === PaymentStatus.PAID ? (payment.receivedAt ?? new Date()) : null)
    const receivedAt = paidAmount > 0 ? (payment.receivedAt ?? new Date()) : null

    return {
      method: payment.method,
      amount: payment.amount,
      status,
      paidAmount,
      dueDate,
      receivedAt,
      reference: payment.reference,
      notes: payment.notes,
      installmentNumber: payment.installmentNumber ?? null,
      installmentsTotal: payment.installmentsTotal ?? null,
      cashSessionId: paidAmount > 0 ? params.cashSessionId : null,
    }
  })
}

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
  const sanitizedCustomerDocument = sanitizeDocument(input.customerDocument) || undefined
  if (!validateCpfCnpj(sanitizedCustomerDocument)) {
    return NextResponse.json({ error: 'Documento do cliente inválido' }, { status: 400 })
  }
  const customerPersonType = detectPersonType(sanitizedCustomerDocument)
  const sanitizedCustomerAddress = input.customerAddress?.trim() || undefined
  const sanitizedCustomerId = input.customerId?.trim() || undefined
  const sanitizedChannel = input.channel?.trim() || undefined
  const sanitizedNotes = input.notes?.trim() || undefined
  const pointOfSaleId = pointOfSaleIdFromPayload || activeCashSession.pointOfSaleId || undefined
  const discountValue = Math.max(input.discountValue ?? 0, 0)
  const taxValue = Math.max(input.taxValue ?? 0, 0)
  const serviceCharge = input.serviceCharge ?? 0
  const paymentsPayload: SalePaymentInputPayload[] = []
  for (const payment of (input.payments ?? []) as SalePaymentInputPayload[]) {
    if (payment.amount >= 0) {
      paymentsPayload.push(payment)
    }
  }
  const shouldRegisterCustomer = input.registerCustomer ?? false
  const pendingCartId = input.pendingCartId?.trim() || undefined

  let pendingCartRecord: { id: string; status: PendingCartStatus; pointOfSaleId: string | null } | null = null
  if (pendingCartId) {
    pendingCartRecord = await prisma.pendingCart.findUnique({
      where: { id: pendingCartId },
      select: {
        id: true,
        status: true,
        pointOfSaleId: true,
      },
    })

    if (!pendingCartRecord) {
      return NextResponse.json({ error: 'Carrinho em espera não encontrado' }, { status: 404 })
    }

    if (pendingCartRecord.status !== PendingCartStatus.ACTIVE) {
      return NextResponse.json({ error: 'Carrinho não está mais disponível para conversão' }, { status: 409 })
    }

    if (pendingCartRecord.pointOfSaleId && pointOfSaleId && pendingCartRecord.pointOfSaleId !== pointOfSaleId) {
      return NextResponse.json({ error: 'Carrinho pertence a outro ponto de venda' }, { status: 409 })
    }
  }

  let existingCustomerRecord: (Awaited<ReturnType<typeof prisma.customer.findUnique>>) | null = null
  if (sanitizedCustomerId) {
    existingCustomerRecord = await prisma.customer.findUnique({
      where: { id: sanitizedCustomerId },
      select: {
        id: true,
        name: true,
        creditLimit: true,
        creditUsed: true,
        isBlocked: true,
        totalOrders: true,
        totalSpend: true,
        email: true,
        phone: true,
        address: true,
      },
    })

    if (!existingCustomerRecord) {
      return NextResponse.json({ error: 'Cliente informado não encontrado' }, { status: 404 })
    }

    if (existingCustomerRecord.isBlocked) {
      return NextResponse.json({ error: 'Cliente bloqueado para compras' }, { status: 403 })
    }
  }

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
      update: (args: unknown) => Promise<any>
    }

    type PendingCartDelegate = {
      update: (args: unknown) => Promise<unknown>
    }

    type PrismaWithProductPoints = typeof prisma & {
      productPointOfSale: ProductPointOfSaleDelegate
      inventoryMovement: InventoryMovementDelegate
      salePayment: SalePaymentDelegate
      customer: CustomerDelegate
      pendingCart: PendingCartDelegate
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
    const normalizedPayments = normalizePayments({
      payments: paymentsPayload,
      fallbackMethod: input.paymentMethod ?? undefined,
      netTotal,
      cashSessionId: activeCashSession.id,
    })
    const openCreditAmount = normalizedPayments.reduce((sum, payment) => sum + Math.max(payment.amount - payment.paidAmount, 0), 0)

    if (existingCustomerRecord?.creditLimit != null) {
      const projectedCredit = (existingCustomerRecord.creditUsed ?? 0) + openCreditAmount
      if (projectedCredit > existingCustomerRecord.creditLimit) {
        return NextResponse.json(
          {
            error: 'Limite de crédito ultrapassado para este cliente',
          },
          { status: 409 },
        )
      }
    }

    const sale = await prisma.$transaction(async (tx) => {
      const transactionalClient = tx as PrismaWithProductPoints

      let customerRecordId = sanitizedCustomerId ?? null

      if (customerRecordId) {
        await transactionalClient.customer.update({
          where: { id: customerRecordId },
          data: {
            ...(sanitizedCustomerName ? { name: sanitizedCustomerName } : {}),
            ...(sanitizedCustomerEmail ? { email: sanitizedCustomerEmail } : {}),
            ...(sanitizedCustomerPhone ? { phone: sanitizedCustomerPhone } : {}),
            ...(sanitizedCustomerAddress ? { address: sanitizedCustomerAddress } : {}),
            ...(sanitizedCustomerDocument ? { document: sanitizedCustomerDocument } : {}),
            type: customerPersonType,
            isActive: true,
          },
        })
      } else if (shouldRegisterCustomer && sanitizedCustomerName) {
        const createdCustomer = await transactionalClient.customer.create({
          data: {
            name: sanitizedCustomerName,
            email: sanitizedCustomerEmail,
            phone: sanitizedCustomerPhone,
            document: sanitizedCustomerDocument ?? null,
            type: customerPersonType,
            address: sanitizedCustomerAddress,
            notes: sanitizedNotes,
            totalSpend: netTotal,
            totalOrders: 1,
            averageTicket: netTotal,
            lastPurchaseAt: new Date(),
            creditUsed: openCreditAmount,
            isActive: true,
            metadata: {
              createdFrom: 'POS',
            },
          },
        })
        customerRecordId = createdCustomer.id
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
        pendingCart: pendingCartId ? { connect: { id: pendingCartId } } : undefined,
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
        customer: customerRecordId ? { connect: { id: customerRecordId } } : undefined,
        metadata: {
          pendingCartId,
          customerId: customerRecordId,
          payments: normalizedPayments.map((payment) => ({
            method: payment.method,
            status: payment.status,
            amount: payment.amount,
            paidAmount: payment.paidAmount,
          })),
        },
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

      if (normalizedPayments.length > 0) {
        await Promise.all(
          normalizedPayments.map((payment) =>
            transactionalClient.salePayment.create({
              data: {
                saleId: createdSale.id,
                method: payment.method,
                amount: payment.amount,
                status: payment.status,
                paidAmount: payment.paidAmount,
                dueDate: payment.dueDate,
                receivedAt: payment.receivedAt,
                reference: payment.reference,
                notes: payment.notes,
                cashSessionId: payment.cashSessionId ?? undefined,
                installmentNumber: payment.installmentNumber ?? undefined,
                installmentsTotal: payment.installmentsTotal ?? undefined,
                customerId: customerRecordId ?? undefined,
              },
            })
          )
        )
      }

      if (pendingCartId) {
        await transactionalClient.pendingCart.update({
          where: { id: pendingCartId },
          data: {
            status: PendingCartStatus.CONVERTED,
            sale: {
              connect: { id: createdSale.id },
            },
            metadata: {
              convertedAt: new Date().toISOString(),
            },
          },
        })
      }

      if (customerRecordId) {
        const updated = await transactionalClient.customer.update({
          where: { id: customerRecordId },
          data: {
            totalSpend: { increment: netTotal },
            totalOrders: { increment: 1 },
            lastPurchaseAt: new Date(),
            ...(openCreditAmount > 0 ? { creditUsed: { increment: openCreditAmount } } : {}),
            isDelinquent: false,
          },
          select: {
            totalSpend: true,
            totalOrders: true,
          },
        })

        await transactionalClient.customer.update({
          where: { id: customerRecordId },
          data: {
            averageTicket: updated.totalOrders > 0 ? updated.totalSpend / updated.totalOrders : updated.totalSpend,
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