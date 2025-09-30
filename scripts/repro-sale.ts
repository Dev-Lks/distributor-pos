import { prisma } from "@/lib/prisma"
import { detectPersonType, sanitizeDocument, validateCpfCnpj } from "@/lib/documents"
import { CashSessionStatus, PaymentStatus, PendingCartStatus, Prisma } from "@prisma/client"

async function main() {
  const sampleProduct = await prisma.product.findFirst({ select: { id: true } })
  if (!sampleProduct) {
    throw new Error('No product available')
  }

  const input = {
    items: [
      { productId: sampleProduct.id, quantity: 3 },
    ],
    paymentMethod: "pix" as const,
    customerName: "Angela",
    customerPhone: "34999070814",
    customerAddress: "Rua bosta",
    discountValue: 0,
    taxValue: 0,
    serviceCharge: 0,
    registerCustomer: true,
  }

  const activeCashSession = await prisma.cashSession.findFirst({
    where: {
      status: CashSessionStatus.OPEN,
    },
    orderBy: {
      openedAt: "desc",
    },
  })

  if (!activeCashSession) {
    throw new Error("No active cash session")
  }

  const pointOfSaleId = activeCashSession.pointOfSaleId ?? undefined

  const sanitizedCustomerName = input.customerName?.trim() || undefined
  const sanitizedCustomerEmail = undefined
  const sanitizedCustomerPhone = input.customerPhone?.trim() || undefined
  const sanitizedCustomerDocument = sanitizeDocument(undefined) || undefined

  if (!validateCpfCnpj(sanitizedCustomerDocument)) {
    throw new Error("Documento inválido")
  }

  const customerPersonType = detectPersonType(sanitizedCustomerDocument)
  const sanitizedCustomerAddress = input.customerAddress?.trim() || undefined
  const sanitizedCustomerId = undefined
  const sanitizedChannel = undefined
  const sanitizedNotes = undefined
  const discountValue = Math.max(input.discountValue ?? 0, 0)
  const taxValue = Math.max(input.taxValue ?? 0, 0)
  const serviceCharge = input.serviceCharge ?? 0
  const shouldRegisterCustomer = input.registerCustomer ?? false

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

  const [products, productPointStocks] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { inventory: true },
    }),
    prisma.productPointOfSale.findMany({
      where: { productId: { in: productIds } },
    }),
  ])

  const productMap = new Map(products.map((product) => [product.id, product]))

  for (const item of aggregatedItems) {
    if (!productMap.has(item.productId)) {
      throw new Error(`Product not found: ${item.productId}`)
    }
  }

  const pointStockByProductId = productPointStocks.reduce<
    Map<string, typeof productPointStocks>
  >((acc, stock) => {
    const list = acc.get(stock.productId) ?? []
    list.push(stock)
    acc.set(stock.productId, list)
    return acc
  }, new Map())

  let subtotal = 0
  let costOfGoods = 0
  const saleItems: Array<{ productId: string; quantity: number; price: number; unitCost: number }> = []
  const movementDrafts: Array<{ productId: string; quantity: number; unitCost: number; fromLocation: string | null }> = []

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

    console.log("Stock", product.name, availableStock)

    if (availableStock < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name}`)
    }

    const fromLocation = pointOfSaleId ? "SALE_POINT" : "HOUSE"
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

  const normalizedPayments = [
    {
      method: input.paymentMethod,
      amount: netTotal,
      status: PaymentStatus.PAID,
      paidAmount: netTotal,
      dueDate: new Date(),
      receivedAt: new Date(),
      reference: null,
      notes: null,
      installmentNumber: null,
      installmentsTotal: null,
      cashSessionId: activeCashSession.id,
    },
  ]

  const openCreditAmount = normalizedPayments.reduce(
    (sum, payment) => sum + Math.max(payment.amount - payment.paidAmount, 0),
    0,
  )

  const sale = await prisma.$transaction(async (tx) => {
  let customerRecordId: string | null = sanitizedCustomerId ?? null

    if (!customerRecordId && shouldRegisterCustomer) {
      const uniqueFilters = [
        sanitizedCustomerDocument ? { document: sanitizedCustomerDocument } : null,
        sanitizedCustomerPhone ? { phone: sanitizedCustomerPhone } : null,
      ].filter(Boolean) as Prisma.CustomerWhereInput[]

      if (uniqueFilters.length > 0) {
        const existingCustomerByUnique = await tx.customer.findFirst({
          where: { OR: uniqueFilters },
          select: { id: true },
        })

        if (existingCustomerByUnique) {
          customerRecordId = existingCustomerByUnique.id
        }
      }
    }

    if (customerRecordId) {
      await tx.customer.update({
        where: { id: customerRecordId },
        data: {
          ...(sanitizedCustomerName ? { name: sanitizedCustomerName } : {}),
          ...(sanitizedCustomerPhone ? { phone: sanitizedCustomerPhone } : {}),
          ...(sanitizedCustomerAddress ? { address: sanitizedCustomerAddress } : {}),
          type: customerPersonType,
          isActive: true,
        },
      })
    } else if (shouldRegisterCustomer && sanitizedCustomerName) {
      const createdCustomer = await tx.customer.create({
        data: {
          name: sanitizedCustomerName,
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
          metadata: { createdFrom: "POS" },
        },
      })
      customerRecordId = createdCustomer.id
    }

    const createdSale = await tx.sale.create({
      data: {
        total: netTotal,
        paymentMethod: input.paymentMethod,
        customerName: sanitizedCustomerName ?? null,
        customerPhone: sanitizedCustomerPhone ?? null,
        customerAddress: sanitizedCustomerAddress ?? null,
        subtotal,
        discountValue,
        taxValue,
        serviceCharge,
        costOfGoods,
        grossMargin: netTotal - costOfGoods,
        notes: sanitizedNotes ?? null,
        cashSession: { connect: { id: activeCashSession.id } },
        items: {
          create: saleItems.map((item) => ({
            product: { connect: { id: item.productId } },
            quantity: item.quantity,
            price: item.price,
            unitCost: item.unitCost,
            discount: saleItems.length > 0 ? discountValue / saleItems.length : 0,
          })),
        },
        customer: customerRecordId ? { connect: { id: customerRecordId } } : undefined,
        metadata: {
          payments: normalizedPayments.map((payment) => ({
            method: payment.method,
            status: payment.status,
            amount: payment.amount,
            paidAmount: payment.paidAmount,
          })),
        },
      },
    })

    for (const item of aggregatedItems) {
      const inventory = await tx.inventory.findUnique({
        where: { productId: item.productId },
        select: { salePointQuantity: true },
      })

      if (!inventory || inventory.salePointQuantity < item.quantity) {
        throw new Error("INSUFFICIENT_STOCK")
      }

      await tx.inventory.update({
        where: { productId: item.productId },
        data: {
          salePointQuantity: { decrement: item.quantity },
        },
      })
    }

    await Promise.all(
      normalizedPayments.map((payment) =>
        tx.salePayment.create({
          data: {
            saleId: createdSale.id,
            method: payment.method,
            amount: payment.amount,
            status: payment.status,
            paidAmount: payment.paidAmount,
            dueDate: payment.dueDate,
            receivedAt: payment.receivedAt,
            cashSessionId: payment.cashSessionId,
          },
        }),
      ),
    )

    if (customerRecordId) {
      const updated = await tx.customer.update({
        where: { id: customerRecordId },
        data: {
          totalSpend: { increment: netTotal },
          totalOrders: { increment: 1 },
          lastPurchaseAt: new Date(),
          isDelinquent: false,
        },
        select: {
          totalSpend: true,
          totalOrders: true,
        },
      })

      await tx.customer.update({
        where: { id: customerRecordId },
        data: {
          averageTicket: updated.totalOrders > 0 ? updated.totalSpend / updated.totalOrders : updated.totalSpend,
        },
      })
    }

    return createdSale
  })

  console.log("Sale created", sale.id)
}

main()
  .catch((error) => {
    console.error("Script failed", error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
