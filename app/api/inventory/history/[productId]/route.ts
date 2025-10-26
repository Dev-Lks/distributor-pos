import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/inventory/history/[productId] - Histórico de movimentações
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '100');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {
      productId: productId,
    };

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.occurredAt = {};
      if (startDate) {
        where.occurredAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.occurredAt.lte = new Date(endDate);
      }
    }

    const movements = await prisma.inventoryMovement.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            size: true,
          },
        },
        sale: {
          select: {
            id: true,
            date: true,
            total: true,
          },
        },
        batch: {
          select: {
            id: true,
            batchNumber: true,
          },
        },
      },
      orderBy: {
        occurredAt: 'desc',
      },
      take: limit,
    });

    // Calcular estatísticas
    const stats = {
      totalMovements: movements.length,
      byType: movements.reduce((acc, m) => {
        acc[m.type] = (acc[m.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      totalQuantityIn: movements
        .filter((m) => ['RECEIPT', 'RETURN', 'ADJUSTMENT'].includes(m.type) && m.quantity > 0)
        .reduce((sum, m) => sum + m.quantity, 0),
      totalQuantityOut: movements
        .filter((m) => ['SALE', 'LOSS', 'TRANSFER', 'ADJUSTMENT'].includes(m.type) && m.quantity < 0)
        .reduce((sum, m) => sum + Math.abs(m.quantity), 0),
    };

    return NextResponse.json({
      movements,
      stats,
      product: movements[0]?.product,
    });
  } catch (error) {
    console.error('Error fetching inventory history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory history' },
      { status: 500 }
    );
  }
}
