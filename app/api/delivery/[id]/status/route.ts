import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { logger } from "@/lib/logger"

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

const statusEnum = [
  "PENDING",
  "PREPARING",
  "READY_FOR_PICKUP",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
  "FAILED",
] as const

const updateStatusSchema = z.object({
  status: z.enum(statusEnum),
  notes: z.string().optional(),
})

type DeliveryStatus = (typeof statusEnum)[number]

interface StatusHistoryEntry {
  status: DeliveryStatus
  timestamp: string
  userId: string
  notes?: string | null
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const validated = updateStatusSchema.parse(body)

    const now = new Date()
    const updateData: Prisma.DeliveryUpdateInput = {
      status: validated.status,
      updatedAt: now,
    }
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

    const rawHistory = delivery?.statusHistory as unknown
    const previousHistory: StatusHistoryEntry[] = Array.isArray(rawHistory)
      ? (rawHistory as StatusHistoryEntry[])
      : []

    const statusHistory: StatusHistoryEntry[] = [
      ...previousHistory,
      {
        status: validated.status,
        timestamp: now.toISOString(),
        userId: session.user.id ?? "unknown",
        notes: validated.notes ?? null,
      },
    ]

    updateData.statusHistory = statusHistory as unknown as Prisma.InputJsonValue

    // Atualizar delivery
    const updatedDelivery = await prisma.delivery.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updatedDelivery)
  } catch (error) {
    logger.error("Failed to update delivery status", { error })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Erro ao atualizar status" }, { status: 500 })
  }
}
