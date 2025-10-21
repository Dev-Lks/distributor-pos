import { NextRequest, NextResponse } from "next/server"
import { logger } from '@/lib/logger'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema de validação
const createDeliverySchema = z.object({
  saleId: z.string().optional().nullable(),
  orderId: z.string().optional().nullable(),
  customerId: z.string().min(1, "ID do cliente é obrigatório"),
  zoneId: z.string().optional().nullable(),
  driverId: z.string().optional().nullable(),
  pointOfSaleId: z.string().optional().nullable(),
  
  // Endereço
  deliveryAddress: z.string().min(1, "Endereço é obrigatório"),
  addressNumber: z.string().optional().nullable(),
  addressComplement: z.string().optional().nullable(),
  district: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  postalCode: z.string().optional().nullable(),
  referencePoint: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  
  // Agendamento
  scheduledFor: z.preprocess(
    (val) => val === "" || val === null || val === undefined ? null : val,
    z.string().datetime().nullable().optional()
  ),
  
  // Financeiro
  subtotal: z.number().min(0),
  deliveryFee: z.number().min(0),
  discountValue: z.number().default(0),
  
  // Cálculos
  distance: z.number().optional().nullable(),
  vehicleUsed: z.enum(["MOTORCYCLE", "CAR", "BICYCLE", "FOOT"]).optional().nullable(),
  estimatedTime: z.number().optional().nullable(),
  
  // Observações
  notes: z.string().optional().nullable(),
  deliveryInstructions: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  
  // Pagamento
  paymentMethod: z.string().optional().nullable(),
  paidInAdvance: z.boolean().default(false),
  changeFor: z.number().optional().nullable(),
})

// GET /api/delivery - Listar deliveries
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const driverId = searchParams.get("driverId")
    const customerId = searchParams.get("customerId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: any = {}

    if (status) where.status = status
    if (driverId) where.driverId = driverId
    if (customerId) where.customerId = customerId
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            vehicleType: true,
          },
        },
        zone: {
          select: {
            id: true,
            name: true,
          },
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
        { scheduledFor: "asc" },
        { createdAt: "desc" },
      ],
    })

    // Mapear para formato summary
    const deliverySummaries = deliveries.map((delivery: any) => ({
      id: delivery.id,
      deliveryNumber: delivery.deliveryNumber,
      customerName: delivery.customer.name,
      customerPhone: delivery.customer.phone,
      deliveryAddress: delivery.deliveryAddress,
      district: delivery.district,
      city: delivery.city,
  state: delivery.state,
      status: delivery.status,
      subtotal: delivery.subtotal ?? 0,
      total: delivery.total ?? 0,
      deliveryFee: delivery.deliveryFee ?? 0,
      scheduledFor: delivery.scheduledFor,
      deliveredAt: delivery.deliveredAt,
      driverName: delivery.driver?.name ?? null,
      vehicleType: delivery.vehicleUsed,
      rating: delivery.rating,
      pointOfSaleName: delivery.pointOfSale?.name ?? null,
      distance: delivery.distance,
      estimatedTime: delivery.estimatedTime,
      createdAt: delivery.createdAt,
    }))

    return NextResponse.json(deliverySummaries)
  } catch (error) {
    logger.error("Error fetching deliveries:", { error })
    return NextResponse.json(
      { error: "Erro ao buscar deliveries" },
      { status: 500 }
    )
  }
}

// POST /api/delivery - Criar novo delivery
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const data = createDeliverySchema.parse(body)

    // Verificar se cliente existe
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    })

    if (!customer) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      )
    }

    // Gerar número do delivery
    const year = new Date().getFullYear()
    const lastDelivery = await prisma.delivery.findFirst({
      where: {
        deliveryNumber: {
          startsWith: `DEL-${year}-`,
        },
      },
      orderBy: { deliveryNumber: "desc" },
    })

    let deliveryNumber: string
    if (lastDelivery) {
      const lastNumber = parseInt(lastDelivery.deliveryNumber.split("-")[2])
      deliveryNumber = `DEL-${year}-${String(lastNumber + 1).padStart(4, "0")}`
    } else {
      deliveryNumber = `DEL-${year}-0001`
    }

    // Calcular total
    const total = data.subtotal + data.deliveryFee - data.discountValue

    // Criar delivery
    const delivery = await prisma.delivery.create({
      data: {
        deliveryNumber,
        saleId: data.saleId,
        orderId: data.orderId,
        customerId: data.customerId,
        zoneId: data.zoneId,
        driverId: data.driverId,
        pointOfSaleId: data.pointOfSaleId,
        createdById: session.user.id, // ✅ Adicionado
        
        // Endereço
        deliveryAddress: data.deliveryAddress,
        addressNumber: data.addressNumber,
        addressComplement: data.addressComplement,
        district: data.district,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        referencePoint: data.referencePoint,
        latitude: data.latitude,
        longitude: data.longitude,
        
        // Status
        status: "PENDING",
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        
        // Financeiro
        subtotal: data.subtotal,
        deliveryFee: data.deliveryFee,
        discountValue: data.discountValue,
        total,
        
        // Cálculos
        distance: data.distance,
        vehicleUsed: data.vehicleUsed,
        estimatedTime: data.estimatedTime,
        
        // Observações
        notes: data.notes,
        deliveryInstructions: data.deliveryInstructions,
        internalNotes: data.internalNotes,
        
        // Pagamento
        paymentMethod: data.paymentMethod,
        paidInAdvance: data.paidInAdvance,
        paymentStatus: data.paidInAdvance ? "PAID" : "PENDING",
        changeFor: data.changeFor,
        
        // Histórico
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
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
          },
        },
        zone: true,
        driver: true,
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
      },
    })

    return NextResponse.json(delivery, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }
    
    logger.error("Error creating delivery:", { error })
    return NextResponse.json(
      { error: "Erro ao criar delivery" },
      { status: 500 }
    )
  }
}
