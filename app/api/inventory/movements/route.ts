import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { InventoryMovementWhereInput } from '@/types';

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/inventory/movements - Todas as movimentações de inventário
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const productId = searchParams.get('productId');
    const location = searchParams.get('location');
    const limit = parseInt(searchParams.get('limit') || '50');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: InventoryMovementWhereInput = {};

    if (type) {
      where.type = type as any; // Type assertion necessária para enum do Prisma
    }

    if (productId) {
      where.productId = productId;
    }

    if (location) {
      where.OR = [
        { fromLocation: location as any },
        { toLocation: location as any },
      ];
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
            category: true,
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
            expirationDate: true,
          },
        },
        pointOfSale: {
          select: {
            id: true,
            name: true,
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
      byLocation: movements.reduce((acc, m) => {
        if (m.fromLocation) {
          acc[m.fromLocation] = (acc[m.fromLocation] || 0) + 1;
        }
        if (m.toLocation) {
          acc[m.toLocation] = (acc[m.toLocation] || 0) + 1;
        }
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
      filters: {
        type,
        productId,
        location,
        startDate,
        endDate,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching inventory movements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory movements' },
      { status: 500 }
    );
  }
}
