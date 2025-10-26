import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { startOfDay, subDays, endOfDay } from 'date-fns'

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const now = new Date()
    const todayStart = startOfDay(now)
    const yesterdayStart = startOfDay(subDays(now, 1))
    const yesterdayEnd = endOfDay(subDays(now, 1))

    // Query otimizada: buscar vendas de hoje e ontem em paralelo
    const [todaySales, yesterdaySales, inventories, pendingOrders] = await Promise.all([
      // Vendas de hoje
      prisma.sale.findMany({
        where: {
          date: { gte: todayStart },
          status: { not: 'cancelled' },
        },
        select: {
          total: true,
        },
      }),

      // Vendas de ontem
      prisma.sale.findMany({
        where: {
          date: { gte: yesterdayStart, lte: yesterdayEnd },
          status: { not: 'cancelled' },
        },
        select: {
          total: true,
        },
      }),

      // Buscar todos os inventários para calcular estoque baixo
      prisma.inventory.findMany({
        where: {
          product: {
            isActive: true,
          },
        },
        select: {
          coldRoomQuantity: true,
          coldRoomMinStock: true,
          houseQuantity: true,
          houseMinStock: true,
          salePointQuantity: true,
          salePointMinStock: true,
          lastAuditedAt: true,
        },
      }),

      // Encomendas pendentes
      prisma.order.count({
        where: {
          status: 'PENDING',
        },
      }),
    ])

    // Calcular produtos com estoque baixo
    const lowStockProducts = inventories.filter(inv => {
      const totalStock = inv.coldRoomQuantity + inv.houseQuantity + inv.salePointQuantity
      const totalMinStock = inv.coldRoomMinStock + inv.houseMinStock + inv.salePointMinStock
      return totalStock < totalMinStock
    }).length

    // Calcular estoque baixo de ontem (aproximação usando lastAuditedAt)
    const yesterdayLowStock = inventories.filter(inv => {
      const totalStock = inv.coldRoomQuantity + inv.houseQuantity + inv.salePointQuantity
      const totalMinStock = inv.coldRoomMinStock + inv.houseMinStock + inv.salePointMinStock
      const isLowStock = totalStock < totalMinStock
      const wasAuditedYesterday = inv.lastAuditedAt && inv.lastAuditedAt <= yesterdayEnd
      return isLowStock && wasAuditedYesterday
    }).length

    // Calcular métricas de hoje
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0)
    const todayCount = todaySales.length
    const todayAvgTicket = todayCount > 0 ? todayRevenue / todayCount : 0

    // Calcular métricas de ontem
    const yesterdayRevenue = yesterdaySales.reduce((sum, sale) => sum + sale.total, 0)
    const yesterdayCount = yesterdaySales.length
    const yesterdayAvgTicket = yesterdayCount > 0 ? yesterdayRevenue / yesterdayCount : 0

    // Calcular tendências (comparação com ontem)
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return { value: 0, direction: 'neutral' as const }
      const percentChange = ((current - previous) / previous) * 100
      return {
        value: Math.abs(percentChange),
        direction: percentChange > 0 ? 'up' as const : percentChange < 0 ? 'down' as const : 'neutral' as const,
      }
    }

    const revenueTrend = calculateTrend(todayRevenue, yesterdayRevenue)
    const avgTicketTrend = calculateTrend(todayAvgTicket, yesterdayAvgTicket)

    const lowStockDiff = lowStockProducts - yesterdayLowStock

    return NextResponse.json({
      salesToday: {
        value: todayRevenue,
        formatted: `R$ ${todayRevenue.toFixed(2)}`,
        trend: {
          value: revenueTrend.value.toFixed(1),
          direction: revenueTrend.direction,
          formatted: `${revenueTrend.direction === 'up' ? '+' : revenueTrend.direction === 'down' ? '-' : ''}${revenueTrend.value.toFixed(1)}%`,
        },
      },
      averageTicket: {
        value: todayAvgTicket,
        formatted: `R$ ${todayAvgTicket.toFixed(2)}`,
        trend: {
          value: avgTicketTrend.value.toFixed(1),
          direction: avgTicketTrend.direction,
          formatted: `${avgTicketTrend.direction === 'up' ? '+' : avgTicketTrend.direction === 'down' ? '-' : ''}${avgTicketTrend.value.toFixed(1)}%`,
        },
      },
      lowStockCount: {
        value: lowStockProducts,
        formatted: String(lowStockProducts),
        trend: {
          value: Math.abs(lowStockDiff),
          direction: lowStockDiff > 0 ? 'up' : lowStockDiff < 0 ? 'down' : 'neutral',
          formatted: `${lowStockDiff > 0 ? '+' : ''}${lowStockDiff}`,
        },
      },
      ordersCount: {
        value: pendingOrders,
        formatted: String(pendingOrders),
        trend: null, // Encomendas não têm comparação diária significativa
      },
    })
  } catch (error) {
    logger.error('Error fetching KPIs:', { error })
    return NextResponse.json(
      { error: 'Failed to fetch KPIs' },
      { status: 500 }
    )
  }
}
