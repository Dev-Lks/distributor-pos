import { NextRequest, NextResponse } from "next/server"
import { logger } from '@/lib/logger'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema de validação
const createDriverSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email("Email inválido").optional().nullable(),
  document: z.string().optional().nullable(),
  vehicleType: z.enum(["BICYCLE", "MOTORCYCLE", "CAR", "FOOT"]),
  vehiclePlate: z.string().optional().nullable(),
  vehicleModel: z.string().optional().nullable(),
  vehicleColor: z.string().optional().nullable(),
  isAvailable: z.boolean().default(true),
  notes: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
})

// GET /api/delivery-drivers - Listar entregadores
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get("activeOnly") === "true"
    const availableOnly = searchParams.get("availableOnly") === "true"

    const where: any = {}
    if (availableOnly) {
      where.isAvailable = true
    }

    const drivers = await prisma.deliveryDriver.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { deliveries: true },
        },
      },
    })

    // Calcular estatísticas adicionais
    const driversWithStats = drivers.map((driver) => ({
      ...driver,
      totalDeliveries: driver._count.deliveries,
    }))

    return NextResponse.json(driversWithStats)
  } catch (error) {
    logger.error("Failed to fetch drivers:", { error })
    return NextResponse.json(
      { error: "Erro ao buscar entregadores" },
      { status: 500 }
    )
  }
}

// POST /api/delivery-drivers - Criar entregador
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const data = createDriverSchema.parse(body)

    // Verificar se já existe entregador com mesmo documento
    if (data.document) {
      const existing = await prisma.deliveryDriver.findFirst({
        where: { document: data.document },
      })
      if (existing) {
        return NextResponse.json(
          { error: "Já existe um entregador com este CPF/CNPJ" },
          { status: 400 }
        )
      }
    }

    // Verificar se já existe entregador com mesmo telefone
    const existingPhone = await prisma.deliveryDriver.findFirst({
      where: { phone: data.phone },
    })
    if (existingPhone) {
      return NextResponse.json(
        { error: "Já existe um entregador com este telefone" },
        { status: 400 }
      )
    }

    // Criar entregador
    const driver = await prisma.deliveryDriver.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        document: data.document,
        vehicleType: data.vehicleType,
        vehiclePlate: data.vehiclePlate,
        vehicleModel: data.vehicleModel,
        vehicleColor: data.vehicleColor,
        isAvailable: data.isAvailable,
        isActive: true,
        notes: data.notes,
        photo: data.photo,
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
      },
    })

    return NextResponse.json(driver, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }
    logger.error("Failed to create driver:", { error })
    return NextResponse.json(
      { error: "Erro ao criar entregador" },
      { status: 500 }
    )
  }
}
