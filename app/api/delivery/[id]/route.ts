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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  try {
    const { id } = await params
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleType: true,
            rating: true,
          },
        },
        zone: true,
        sale: {
          select: {
            id: true,
            total: true,
            date: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
          },
        },
        pointOfSale: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    })

    if (!delivery) {
      return NextResponse.json({ error: "Delivery não encontrado" }, { status: 404 })
    }

    return NextResponse.json(delivery)
  } catch (error) {
    console.error("Failed to fetch delivery:", error)
    return NextResponse.json({ error: "Erro ao buscar delivery" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()

    // Atualizar delivery
    const delivery = await prisma.delivery.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(delivery)
  } catch (error) {
    console.error("Failed to update delivery:", error)
    return NextResponse.json({ error: "Erro ao atualizar delivery" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  try {
    const { id } = await params
    await prisma.delivery.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete delivery:", error)
    return NextResponse.json({ error: "Erro ao deletar delivery" }, { status: 500 })
  }
}
