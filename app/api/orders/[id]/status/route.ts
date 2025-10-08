import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import { z } from "zod"

const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERED", "CANCELLED"]),
  notes: z.string().optional(),
})

// Mapa de transições permitidas
const allowedTransitions: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["DELIVERED", "PREPARING"], // Pode voltar se necessário
  DELIVERED: [], // Estado final
  CANCELLED: [], // Estado final
}

// PATCH /api/orders/[id]/status - Atualizar status da encomenda
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
    const { status, notes } = updateStatusSchema.parse(body)

    // Buscar ordem existente
    const existingOrder = await prisma.order.findUnique({
      where: { id: id },
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Encomenda não encontrada" },
        { status: 404 }
      )
    }

    // Validar transição de status
    const currentStatus = existingOrder.status
    const allowed = allowedTransitions[currentStatus] || []
    
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { 
          error: `Transição de ${currentStatus} para ${status} não é permitida`,
          allowedTransitions: allowed
        },
        { status: 400 }
      )
    }

    // Preparar dados de atualização
    const updateData: any = { status }

    // Atualizar timestamps baseado no novo status
    const now = new Date()
    switch (status) {
      case "CONFIRMED":
        updateData.confirmedAt = now
        break
      case "READY":
        updateData.readyAt = now
        break
      case "DELIVERED":
        updateData.deliveredAt = now
        // Atualizar todos os itens como entregues
        await prisma.orderItem.updateMany({
          where: { orderId: id },
          data: { status: "delivered" },
        })
        break
      case "CANCELLED":
        updateData.cancelledAt = now
        break
    }

    // Adicionar ao histórico de status
    const statusHistory = existingOrder.statusHistory as any || { events: [] }
    statusHistory.events.push({
      status,
      timestamp: now.toISOString(),
      userId: session.user.id,
      userName: session.user.name,
      notes,
    })
    updateData.statusHistory = statusHistory

    // Registrar notificação (para log)
    const notifications = existingOrder.notifications as any || { sent: [] }
    notifications.sent.push({
      type: "status_change",
      status,
      timestamp: now.toISOString(),
      // Em produção, aqui chamaria API de WhatsApp/Email
    })
    updateData.notifications = notifications

    // Se tiver notas, adicionar às notas internas
    if (notes) {
      const currentNotes = existingOrder.internalNotes || ""
      updateData.internalNotes = currentNotes
        ? `${currentNotes}\n\n[${now.toLocaleString("pt-BR")}] ${session.user.name}: ${notes}`
        : `[${now.toLocaleString("pt-BR")}] ${session.user.name}: ${notes}`
    }

    // Atualizar ordem
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

    console.error("Error updating order status:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar status da encomenda" },
      { status: 500 }
    )
  }
}
