import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { subDays, startOfDay, subWeeks, startOfWeek, subMonths, startOfMonth } from 'date-fns'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'today'

    // Determinar intervalo de datas
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'week':
        startDate = startOfWeek(now)
        break
      case 'month':
        startDate = startOfMonth(now)
        break
      case 'today':
      default:
        startDate = startOfDay(now)
    }

    // Buscar usuários e suas vendas (todos os usuários ativos)
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        cashSessions: {
          where: {
            openedAt: {
              gte: startDate,
            },
          },
          select: {
            id: true,
            sales: {
              where: {
                status: {
                  not: 'cancelled',
                },
              },
              select: {
                id: true,
                total: true,
              },
            },
          },
        },
      },
    })

    // Calcular performance de cada usuário
    const performance = users
      .map(user => {
        const salesCount = user.cashSessions.reduce(
          (acc, session) => acc + session.sales.length,
          0
        )
        const revenue = user.cashSessions.reduce(
          (acc, session) =>
            acc + session.sales.reduce((sum, sale) => sum + sale.total, 0),
          0
        )

        return {
          id: user.id,
          name: user.name || 'Usuário',
          email: user.email,
          avatar: getInitials(user.name || user.email),
          salesCount,
          revenue,
        }
      })
      .filter(u => u.salesCount > 0) // Só incluir quem tem vendas
      .sort((a, b) => b.revenue - a.revenue) // Ordenar por receita
      .map((member, index) => ({
        ...member,
        rank: index + 1,
      }))

    return NextResponse.json(performance)
  } catch (error) {
    logger.error('Error fetching team performance:', { error })
    return NextResponse.json(
      { error: 'Failed to fetch team performance' },
      { status: 500 }
    )
  }
}
