import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { handleError } from "@/lib/errors"
import { logger } from "@/lib/logger"
import type { OrderWhereInput } from "@/types"
import { z } from "zod"

// Schema de validação para criar ordem
const createOrderSchema = z.object({
  customerId: z.string().optional().nullable(),
  customerName: z.string().min(1, "Nome do cliente é obrigatório"),
  customerPhone: z.string().min(1, "Telefone é obrigatório"),
  customerEmail: z.string().email().optional().nullable(),
  customerAddress: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  promisedAt: z.string().optional().nullable().transform((val) => {
    if (!val) return null
    // Se for apenas data (YYYY-MM-DD), adiciona hora
    if (val.length === 10) {
      return `${val}T12:00:00.000Z`
    }
    return val
  }),
  notes: z.string().optional().nullable(),
  specialRequests: z.string().optional().nullable(),
  deliveryFee: z.number().default(0),
  discountValue: z.number().default(0),
  depositPaid: z.number().default(0),
  source: z.string().optional().nullable(),
  pointOfSaleId: z.string().optional().nullable(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
      discount: z.number().default(0),
      customizations: z.record(z.any()).optional(),
      notes: z.string().optional().nullable(),
    })
  ).min(1, "Pelo menos um item é obrigatório"),
})

// GET /api/orders - Listar encomendas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const statuses = searchParams.getAll("status")
    const priorities = searchParams.getAll("priority")
    const customerId = searchParams.get("customerId")
    const search = searchParams.get("search")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: OrderWhereInput = {}

    if (statuses.length > 0) {
      where.status = { in: statuses }
    }

    if (priorities.length > 0) {
      where.priority = { in: priorities }
    }

    if (customerId) {
      where.customerId = customerId
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
      ]
    }

    if (startDate || endDate) {
      where.orderedAt = {}
      if (startDate) where.orderedAt.gte = new Date(startDate)
      if (endDate) where.orderedAt.lte = new Date(endDate)
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                size: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        pointOfSale: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { priority: "desc" },
        { promisedAt: "asc" },
      ],
    })

    return NextResponse.json(result)
  } catch (error) {
    const { message } = handleError(error)
    logger.error("Erro ao criar pedido", { error })
    return NextResponse.json(
      { error: "Erro ao buscar encomendas" },
      { status: 500 }
    )
  }
}

// POST /api/orders - Criar nova encomenda
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const data = createOrderSchema.parse(body)

    // Validar se todos os produtos existem
    const productIds = data.items.map(item => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true }
    })

    if (products.length !== productIds.length) {
      const foundIds = products.map(p => p.id)
      const missingIds = productIds.filter(id => !foundIds.includes(id))
      return NextResponse.json(
        { error: `Produtos não encontrados: ${missingIds.join(", ")}` },
        { status: 400 }
      )
    }

    // Gerar número da encomenda único
    const year = new Date().getFullYear()
    const lastOrder = await prisma.order.findFirst({
      where: {
        orderNumber: {
          startsWith: `ENC-${year}-`,
        },
      },
      orderBy: { orderNumber: "desc" },
    })

    let orderNumber: string
    if (lastOrder) {
      const lastNumber = parseInt(lastOrder.orderNumber.split("-")[2])
      orderNumber = `ENC-${year}-${String(lastNumber + 1).padStart(3, "0")}`
    } else {
      orderNumber = `ENC-${year}-001`
    }

    // Calcular totais
    const subtotal = data.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice - item.discount)
    }, 0)

    const total = subtotal - data.discountValue + data.deliveryFee
    const balanceDue = total - data.depositPaid

    // Criar ordem com itens
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: data.customerId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        customerAddress: data.customerAddress,
        priority: data.priority,
        promisedAt: data.promisedAt ? new Date(data.promisedAt) : null,
        notes: data.notes,
        specialRequests: data.specialRequests,
        subtotal,
        discountValue: data.discountValue,
        deliveryFee: data.deliveryFee,
        total,
        depositPaid: data.depositPaid,
        balanceDue,
        paymentStatus: data.depositPaid >= total ? "PAID" : data.depositPaid > 0 ? "PARTIAL" : "PENDING",
        source: data.source,
        pointOfSaleId: data.pointOfSaleId,
        createdBy: session.user.id,
        statusHistory: {
          events: [
            {
              status: "PENDING",
              timestamp: new Date().toISOString(),
              userId: session.user.id,
              userName: session.user.name,
            },
          ],
        },
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            subtotal: item.quantity * item.unitPrice - item.discount,
            customizations: item.customizations,
            notes: item.notes,
          })),
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                size: true,
                image: true,
              },
            },
          },
        },
        pointOfSale: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Atualizar total de pedidos do cliente se vinculado
    if (data.customerId) {
      await prisma.customer.update({
        where: { id: data.customerId },
        data: {
          totalOrders: { increment: 1 },
          totalSpend: { increment: total },
          lastPurchaseAt: new Date(),
        },
      })
    }

    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }

    // Erro de Prisma - foreign key violation
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Um ou mais produtos selecionados não existem no banco de dados" },
        { status: 400 }
      )
    }

    console.error("Error creating order:", error)
    return NextResponse.json(
      { error: "Erro ao criar encomenda" },
      { status: 500 }
    )
  }
}
