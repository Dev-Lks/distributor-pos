import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { addDays, startOfDay, endOfDay } from 'date-fns'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')

    const now = new Date()
    const endDate = endOfDay(addDays(now, days))

    const events: any[] = []

    // 1. Encomendas com prazo próximo
    const upcomingOrders = await prisma.order.findMany({
      where: {
        status: {
          in: ['PENDING', 'CONFIRMED', 'PREPARING'],
        },
        promisedAt: {
          gte: now,
          lte: endDate,
        },
      },
      select: {
        id: true,
        orderNumber: true,
        promisedAt: true,
        priority: true,
        customerName: true,
        status: true,
      },
      orderBy: {
        promisedAt: 'asc',
      },
    })

    upcomingOrders.forEach(order => {
      const daysUntil = Math.ceil(
        (new Date(order.promisedAt!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      let priority: 'high' | 'medium' | 'low' = 'medium'
      
      if (daysUntil <= 1 || order.priority === 'URGENT' || order.priority === 'HIGH') {
        priority = 'high'
      } else if (daysUntil <= 3 || order.priority === 'MEDIUM') {
        priority = 'medium'
      } else {
        priority = 'low'
      }

      events.push({
        id: `order-${order.id}`,
        date: order.promisedAt!.toISOString(),
        type: 'order',
        title: `Encomenda ${order.orderNumber} - ${order.customerName}`,
        priority,
        relatedId: order.id,
        status: order.status,
        daysUntil,
      })
    })

    // 2. Auditorias de inventário agendadas (em progresso)
    const upcomingAudits = await prisma.inventoryAudit.findMany({
      where: {
        startedAt: {
          gte: now,
          lte: endDate,
        },
        status: 'IN_PROGRESS',
      },
      select: {
        id: true,
        startedAt: true,
        status: true,
        location: true,
      },
      orderBy: {
        startedAt: 'asc',
      },
    })

    upcomingAudits.forEach(audit => {
      const daysUntil = Math.ceil(
        (new Date(audit.startedAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      events.push({
        id: `audit-${audit.id}`,
        date: audit.startedAt.toISOString(),
        type: 'audit',
        title: `Auditoria de Inventário${audit.location ? ` - ${audit.location}` : ''}`,
        priority: daysUntil <= 1 ? 'high' : 'medium',
        relatedId: audit.id,
        status: audit.status,
        daysUntil,
      })
    })

    // 3. Relatórios diários (próximo fechamento)
    const lastReport = await prisma.dailyReport.findFirst({
      orderBy: {
        reportDate: 'desc',
      },
      select: {
        reportDate: true,
      },
    })

    if (lastReport) {
      const nextReportDate = addDays(startOfDay(new Date(lastReport.reportDate)), 1)
      
      if (nextReportDate <= endDate) {
        const daysUntil = Math.ceil(
          (nextReportDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        events.push({
          id: 'report-next',
          date: nextReportDate.toISOString(),
          type: 'report',
          title: 'Fechamento Diário (Relatório Z)',
          priority: daysUntil === 0 ? 'high' : 'medium',
          relatedId: null,
          daysUntil,
        })
      }
    }

    // 4. Produtos próximos da validade (se tiver expirationDate)
    const expiringProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        expirationDate: {
          gte: now,
          lte: endDate,
        },
      },
      select: {
        id: true,
        name: true,
        expirationDate: true,
      },
      orderBy: {
        expirationDate: 'asc',
      },
      take: 10,
    })

    expiringProducts.forEach(product => {
      const daysUntil = Math.ceil(
        (new Date(product.expirationDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      events.push({
        id: `expiration-${product.id}`,
        date: product.expirationDate!.toISOString(),
        type: 'delivery',
        title: `Validade: ${product.name}`,
        priority: daysUntil <= 2 ? 'high' : daysUntil <= 5 ? 'medium' : 'low',
        relatedId: product.id,
        daysUntil,
      })
    })

    // Ordenar por data
    events.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    return NextResponse.json(events)
  } catch (error) {
    logger.error('Error fetching upcoming events:', { error })
    return NextResponse.json(
      { error: 'Failed to fetch upcoming events' },
      { status: 500 }
    )
  }
}
