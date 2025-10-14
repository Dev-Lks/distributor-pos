import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { subDays, startOfDay, endOfDay, subWeeks, subMonths, startOfWeek, startOfMonth } from 'date-fns'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'today'

    // Determinar intervalo de datas
    const now = new Date()
    let startDate: Date
    let previousStartDate: Date
    let previousEndDate: Date

    switch (period) {
      case 'week':
        startDate = startOfWeek(now)
        previousStartDate = startOfWeek(subWeeks(now, 1))
        previousEndDate = endOfDay(subDays(startDate, 1))
        break
      case 'month':
        startDate = startOfMonth(now)
        previousStartDate = startOfMonth(subMonths(now, 1))
        previousEndDate = endOfDay(subDays(startDate, 1))
        break
      case 'today':
      default:
        startDate = startOfDay(now)
        previousStartDate = startOfDay(subDays(now, 1))
        previousEndDate = endOfDay(subDays(now, 1))
    }

    // Buscar vendas do período atual
    // Query otimizada: groupBy com agregações específicas
    const currentSales = await prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          date: {
            gte: startDate,
          },
          status: {
            not: 'cancelled',
          },
        },
      },
      _sum: {
        quantity: true,
        price: true,
      },
      orderBy: {
        _sum: {
          price: 'desc',
        },
      },
      take: 5,
    })

    // Buscar vendas do período anterior para calcular tendência
    const previousSales = await prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          date: {
            gte: previousStartDate,
            lte: previousEndDate,
          },
          status: {
            not: 'cancelled',
          },
        },
      },
      _sum: {
        price: true,
      },
    })

    // Criar mapa de vendas anteriores
    const previousRevenueMap = new Map(
      previousSales.map(item => [item.productId, item._sum.price || 0])
    )

    // Buscar detalhes dos produtos
    const productIds = currentSales.map(item => item.productId)
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
    })

    const productMap = new Map(products.map(p => [p.id, p]))

    // Montar resposta com tendência
    const topProducts = currentSales.map(item => {
      const product = productMap.get(item.productId)
      const currentRevenue = item._sum.price || 0
      const previousRevenue = previousRevenueMap.get(item.productId) || 0
      
      let trend: 'up' | 'down' | 'neutral' = 'neutral'
      let trendPercentage = 0

      if (previousRevenue > 0) {
        const change = ((currentRevenue - previousRevenue) / previousRevenue) * 100
        trendPercentage = Math.abs(change)
        
        if (change > 5) trend = 'up'
        else if (change < -5) trend = 'down'
        else trend = 'neutral'
      } else if (currentRevenue > 0) {
        trend = 'up'
        trendPercentage = 100
      }

      return {
        id: item.productId,
        name: product?.name || 'Produto Desconhecido',
        image: product?.image || null,
        sold: item._sum.quantity || 0,
        revenue: currentRevenue,
        trend,
        trendPercentage: Math.round(trendPercentage),
      }
    })

    return NextResponse.json(topProducts)
  } catch (error) {
    logger.error('Error fetching top products:', { error })
    return NextResponse.json(
      { error: 'Failed to fetch top products' },
      { status: 500 }
    )
  }
}
