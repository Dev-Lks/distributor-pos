import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/inventory/audits/[id] - Buscar auditoria específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const audit = await prisma.inventoryAudit.findUnique({
      where: { id: id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                size: true,
                inventory: true,
              },
            },
            batch: true,
          },
          orderBy: {
            countedAt: 'desc',
          },
        },
      },
    });

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    return NextResponse.json(audit);
  } catch (error) {
    console.error('Error fetching audit:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit' },
      { status: 500 }
    );
  }
}

// PATCH /api/inventory/audits/[id] - Atualizar auditoria
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Se estiver completando a auditoria, calcular estatísticas
    if (data.status === 'COMPLETED') {
      const items = await prisma.inventoryAuditItem.findMany({
        where: { auditId: id },
      });

      const totalItems = items.length;
      const itemsWithDifference = items.filter((item) => item.difference !== 0).length;
      const accuracyRate = totalItems > 0 ? ((totalItems - itemsWithDifference) / totalItems) * 100 : 0;
      
      const totalValueDifference = await prisma.inventoryAuditItem.aggregate({
        where: { auditId: id },
        _sum: {
          difference: true,
        },
      });

      const audit = await prisma.inventoryAudit.update({
        where: { id: id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          totalItems,
          itemsWithDifference,
          accuracyRate,
          totalValueDifference: totalValueDifference._sum.difference || 0,
          notes: data.notes,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  size: true,
                },
              },
            },
          },
        },
      });

      // Atualizar última data de auditoria nos produtos
      for (const item of items) {
        await prisma.inventory.update({
          where: { productId: item.productId },
          data: {
            lastAuditedAt: new Date(),
          },
        });
      }

      return NextResponse.json(audit);
    }

    const audit = await prisma.inventoryAudit.update({
      where: { id: id },
      data: {
        status: data.status,
        notes: data.notes,
      },
    });

    return NextResponse.json(audit);
  } catch (error) {
    console.error('Error updating audit:', error);
    return NextResponse.json(
      { error: 'Failed to update audit' },
      { status: 500 }
    );
  }
}
