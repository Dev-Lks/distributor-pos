import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/orders/stats - Estatísticas de encomendas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Buscar todas as ordens
    const allOrders = await prisma.order.findMany({
      select: {
        status: true,
        total: true,
        orderedAt: true,
        promisedAt: true,
        deliveredAt: true,
      },
    })

    // Calcular estatísticas
    const totalOrders = allOrders.length
    const pendingOrders = allOrders.filter(o => o.status === "PENDING").length
    const confirmedOrders = allOrders.filter(o => o.status === "CONFIRMED").length
    const preparingOrders = allOrders.filter(o => o.status === "PREPARING").length
    const readyOrders = allOrders.filter(o => o.status === "READY").length
    const deliveredOrders = allOrders.filter(o => o.status === "DELIVERED").length
    const cancelledOrders = allOrders.filter(o => o.status === "CANCELLED").length

    // Ordens atrasadas (promisedAt passou e status não é DELIVERED ou CANCELLED)
    const overdueOrders = allOrders.filter(
      o => o.promisedAt && 
      new Date(o.promisedAt) < now && 
      o.status !== "DELIVERED" && 
      o.status !== "CANCELLED"
    ).length

    // Receita total (apenas ordens entregues)
    const totalRevenue = allOrders
      .filter(o => o.status === "DELIVERED")
      .reduce((sum, o) => sum + o.total, 0)

    // Ticket médio
    const avgOrderValue = deliveredOrders > 0 ? totalRevenue / deliveredOrders : 0

    // Lead time médio (tempo entre pedido e entrega)
    const deliveredWithDates = allOrders.filter(
      o => o.status === "DELIVERED" && o.deliveredAt
    )
    
    const totalLeadTime = deliveredWithDates.reduce((sum, o) => {
      const ordered = new Date(o.orderedAt).getTime()
      const delivered = new Date(o.deliveredAt!).getTime()
      return sum + (delivered - ordered) / (1000 * 60 * 60 * 24) // Em dias
    }, 0)
    
    const avgLeadTime = deliveredWithDates.length > 0 
      ? totalLeadTime / deliveredWithDates.length 
      : 0

    // Taxa de entrega no prazo
    const deliveredWithPromise = deliveredWithDates.filter(o => o.promisedAt)
    const onTimeDeliveries = deliveredWithPromise.filter(o => {
      const promised = new Date(o.promisedAt!).getTime()
      const delivered = new Date(o.deliveredAt!).getTime()
      return delivered <= promised
    }).length
    
    const onTimeDeliveryRate = deliveredWithPromise.length > 0
      ? (onTimeDeliveries / deliveredWithPromise.length) * 100
      : 100

    return NextResponse.json({
      totalOrders,
      pendingOrders,
      confirmedOrders,
      preparingOrders,
      readyOrders,
      deliveredOrders,
      cancelledOrders,
      overdueOrders,
      totalRevenue,
      avgOrderValue,
      avgLeadTime: Math.round(avgLeadTime * 10) / 10, // 1 casa decimal
      onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 10) / 10,
    })
  } catch (error) {
    console.error("Error fetching order stats:", error)
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas" },
      { status: 500 }
    )
  }
}
