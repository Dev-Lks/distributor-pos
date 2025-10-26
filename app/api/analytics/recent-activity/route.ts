import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Buscar últimas vendas
    // Query otimizada: select apenas campos necessários (id, date, total, customerName, user)
    const recentSales = await prisma.sale.findMany({
      take: Math.ceil(limit / 2),
      orderBy: {
        date: 'desc',
      },
      select: {
        id: true,
        date: true,
        total: true,
        customerName: true,
        cashSession: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    // Buscar últimas transações de caixa
    const recentTransactions = await prisma.cashTransaction.findMany({
      take: Math.ceil(limit / 2),
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        createdAt: true,
        performedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // Buscar últimas movimentações de inventário
    const recentMovements = await prisma.inventoryMovement.findMany({
      take: Math.ceil(limit / 3),
      orderBy: {
        occurredAt: 'desc',
      },
      select: {
        id: true,
        type: true,
        quantity: true,
        occurredAt: true,
        performedBy: true,
        product: {
          select: {
            name: true,
          },
        },
      },
      where: {
        performedBy: {
          not: null,
        },
      },
    })

    // Mapear atividades
    const activities: any[] = []

    // Adicionar vendas
    recentSales.forEach(sale => {
      const userName = sale.cashSession?.user?.name || 'Sistema'
      const userEmail = sale.cashSession?.user?.email || ''
      
      activities.push({
        id: `sale-${sale.id}`,
        type: 'sale',
        description: `Venda de R$ ${sale.total.toFixed(2)}${sale.customerName ? ` para ${sale.customerName}` : ''}`,
        userName,
        userAvatar: getInitials(userName),
        timestamp: sale.date.toISOString(),
        relatedId: sale.id,
      })
    })

    // Adicionar transações
    recentTransactions.forEach(tx => {
      const userName = tx.performedBy?.name || 'Sistema'
      const typeMap: Record<string, string> = {
        OPENING: 'Abertura de caixa',
        CLOSING: 'Fechamento de caixa',
        CASH_IN: 'Entrada de dinheiro',
        CASH_OUT: 'Sangria',
        ADJUSTMENT: 'Ajuste',
      }
      
      activities.push({
        id: `cash-${tx.id}`,
        type: 'cash',
        description: `${typeMap[tx.type] || tx.type}: R$ ${tx.amount.toFixed(2)}${tx.description ? ` - ${tx.description}` : ''}`,
        userName,
        userAvatar: getInitials(userName),
        timestamp: tx.createdAt.toISOString(),
        relatedId: tx.id,
      })
    })

    // Adicionar movimentações
    recentMovements.forEach(mov => {
      const userName = mov.performedBy || 'Sistema'
      const typeMap: Record<string, string> = {
        RECEIPT: 'Entrada',
        TRANSFER: 'Transferência',
        ADJUSTMENT: 'Ajuste',
        SALE: 'Venda',
        LOSS: 'Perda',
        RETURN: 'Devolução',
      }
      
      activities.push({
        id: `inventory-${mov.id}`,
        type: 'inventory',
        description: `${typeMap[mov.type] || mov.type} de ${Math.abs(mov.quantity)} un. de ${mov.product.name}`,
        userName,
        userAvatar: getInitials(userName),
        timestamp: mov.occurredAt.toISOString(),
        relatedId: mov.id,
      })
    })

    // Ordenar por timestamp e limitar
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    const limitedActivities = activities.slice(0, limit)

    return NextResponse.json(limitedActivities)
  } catch (error) {
    logger.error('Error fetching recent activity:', { error })
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    )
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
