import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import { z } from "zod"
import { softDelete, withoutDeleted } from '@/lib/soft-delete'

const updateOrderSchema = z.object({
  customerId: z.string().optional().nullable(),
  customerName: z.string().min(1).optional(),
  customerPhone: z.string().min(1).optional(),
  customerEmail: z.string().email().optional().nullable(),
  customerAddress: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  promisedAt: z.string().optional().nullable().transform((val) => {
    if (!val) return null
    // Se for apenas data (YYYY-MM-DD), adiciona hora
    if (val.length === 10) {
      return `${val}T12:00:00.000Z`
    }
    return val
  }),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  specialRequests: z.string().optional().nullable(),
  deliveryFee: z.number().optional(),
  discountValue: z.number().optional(),
  depositPaid: z.number().optional(),
  assignedTo: z.string().optional().nullable(),
})

// GET /api/orders/[id] - Buscar encomenda específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const order = await prisma.order.findFirst({
      where: withoutDeleted({ id: id }),
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
                cost: true,
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
    })

    if (!order) {
      return NextResponse.json(
        { error: "Encomenda não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json(
      { error: "Erro ao buscar encomenda" },
      { status: 500 }
    )
  }
}

// PATCH /api/orders/[id] - Atualizar encomenda
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const data = updateOrderSchema.parse(body)

    // Buscar ordem existente
    const existingOrder = await prisma.order.findFirst({
      where: withoutDeleted({ id: id }),
      include: { items: true },
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Encomenda não encontrada" },
        { status: 404 }
      )
    }

    // Recalcular totais se necessário
    const updateData: any = { ...data }

    if (data.deliveryFee !== undefined || data.discountValue !== undefined || data.depositPaid !== undefined) {
      const deliveryFee = data.deliveryFee ?? existingOrder.deliveryFee
      const discountValue = data.discountValue ?? existingOrder.discountValue
      const depositPaid = data.depositPaid ?? existingOrder.depositPaid

      const total = existingOrder.subtotal - discountValue + deliveryFee
      const balanceDue = total - depositPaid

      updateData.deliveryFee = deliveryFee
      updateData.discountValue = discountValue
      updateData.total = total
      updateData.depositPaid = depositPaid
      updateData.balanceDue = balanceDue
      updateData.paymentStatus = depositPaid >= total ? "PAID" : depositPaid > 0 ? "PARTIAL" : "PENDING"
    }

    if (data.promisedAt !== undefined) {
      updateData.promisedAt = data.promisedAt ? new Date(data.promisedAt) : null
    }

    const order = await prisma.order.update({
      where: { id: id },
      data: updateData,
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

    return NextResponse.json(order)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating order:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar encomenda" },
      { status: 500 }
    )
  }
}

// DELETE /api/orders/[id] - Deletar encomenda
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const order = await prisma.order.findUnique({
      where: { id: id },
    })

    if (!order) {
      return NextResponse.json(
        { error: "Encomenda não encontrada" },
        { status: 404 }
      )
    }

    // Não permitir deletar encomendas já entregues
    if (order.status === "DELIVERED") {
      return NextResponse.json(
        { error: "Não é possível deletar encomendas já entregues" },
        { status: 400 }
      )
    }

    await softDelete('order', id, {
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
      sessionUserId: session.user?.id,
    })

    // Atualizar estatísticas do cliente se vinculado
    if (order.customerId) {
      await prisma.customer.update({
        where: { id: order.customerId },
        data: {
          totalOrders: { decrement: 1 },
          totalSpend: { decrement: order.total },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting order:", error)
    return NextResponse.json(
      { error: "Erro ao deletar encomenda" },
      { status: 500 }
    )
  }
}
