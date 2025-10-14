import { NextRequest, NextResponse } from "next/server"
import { logger } from '@/lib/logger'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateDriverSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  document: z.string().optional().nullable(),
  vehicleType: z.enum(["BICYCLE", "MOTORCYCLE", "CAR", "FOOT"]).optional(),
  vehiclePlate: z.string().optional().nullable(),
  vehicleModel: z.string().optional().nullable(),
  vehicleColor: z.string().optional().nullable(),
  isAvailable: z.boolean().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
})

// GET /api/delivery-drivers/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params

    const driver = await prisma.deliveryDriver.findUnique({
      where: { id },
      include: {
        deliveries: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: { deliveries: true },
        },
      },
    })

    if (!driver) {
      return NextResponse.json(
        { error: "Entregador não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(driver)
  } catch (error) {
    logger.error("Failed to fetch driver:", { error })
    return NextResponse.json(
      { error: "Erro ao buscar entregador" },
      { status: 500 }
    )
  }
}

// PATCH /api/delivery-drivers/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const data = updateDriverSchema.parse(body)

    // Verificar se entregador existe
    const existing = await prisma.deliveryDriver.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Entregador não encontrado" },
        { status: 404 }
      )
    }

    // Atualizar
    const driver = await prisma.deliveryDriver.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(driver)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }
    logger.error("Failed to update driver:", { error })
    return NextResponse.json(
      { error: "Erro ao atualizar entregador" },
      { status: 500 }
    )
  }
}

// DELETE /api/delivery-drivers/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params

    // Verificar se tem entregas vinculadas
    const deliveriesCount = await prisma.delivery.count({
      where: { driverId: id },
    })

    if (deliveriesCount > 0) {
      return NextResponse.json(
        {
          error: `Não é possível deletar. Este entregador possui ${deliveriesCount} entrega(s) vinculada(s).`,
        },
        { status: 400 }
      )
    }

    await prisma.deliveryDriver.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Failed to delete driver:", { error })
    return NextResponse.json(
      { error: "Erro ao deletar entregador" },
      { status: 500 }
    )
  }
}
