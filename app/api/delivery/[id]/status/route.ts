import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "PREPARING",
    "READY_FOR_PICKUP",
    "IN_TRANSIT",
    "DELIVERED",
    "CANCELLED",
    "FAILED",
  ]),
  notes: z.string().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const validated = updateStatusSchema.parse(body)

    // Preparar dados de atualização baseado no status
    const updateData: any = {
      status: validated.status,
      updatedAt: new Date(),
    }

    // Adicionar timestamps baseado no status
    const now = new Date()
    switch (validated.status) {
      case "PREPARING":
        updateData.preparedAt = now
        break
      case "READY_FOR_PICKUP":
        // Mantém preparedAt se já existe
        break
      case "IN_TRANSIT":
        updateData.departedAt = now
        break
      case "DELIVERED":
        updateData.deliveredAt = now
        break
      case "CANCELLED":
        updateData.cancelledAt = now
        if (validated.notes) {
          updateData.cancellationReason = validated.notes
        }
        break
    }

    // Adicionar ao histórico de status
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      select: { statusHistory: true },
    })

    const statusHistory = (delivery?.statusHistory as any) || []
    statusHistory.push({
      status: validated.status,
      timestamp: now.toISOString(),
      userId: session.user.id,
      notes: validated.notes,
    })

    updateData.statusHistory = statusHistory

    // Atualizar delivery
    const updatedDelivery = await prisma.delivery.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updatedDelivery)
  } catch (error) {
    console.error("Failed to update delivery status:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Erro ao atualizar status" }, { status: 500 })
  }
}
