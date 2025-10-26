import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/inventory/expiration-alerts - Alertas de vencimento
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const daysAhead = parseInt(searchParams.get('days') || '60'); // Padrão: 60 dias

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    // Buscar lotes com data de vencimento próxima
    const expiringBatches = await prisma.batch.findMany({
      where: {
        status: 'ACTIVE',
        expirationDate: {
          lte: futureDate,
          gte: new Date(), // Ainda não vencidos
        },
        remainingQuantity: {
          gt: 0, // Ainda tem estoque
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            size: true,
            salePrice: true,
          },
        },
      },
      orderBy: {
        expirationDate: 'asc',
      },
    });

    // Transformar em alertas
    const alerts = expiringBatches.map((batch) => {
      if (!batch.expirationDate) return null;

      const expiresAt = new Date(batch.expirationDate);
      const now = new Date();
      const daysUntilExpiration = Math.floor(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Determinar urgência
      let urgency: 'critical' | 'warning' | 'info';
      if (daysUntilExpiration <= 7) {
        urgency = 'critical';
      } else if (daysUntilExpiration <= 30) {
        urgency = 'warning';
      } else {
        urgency = 'info';
      }

      // Calcular sugestão de desconto
      let suggestedDiscount = 0;
      if (daysUntilExpiration <= 3) {
        suggestedDiscount = 50; // 50% off
      } else if (daysUntilExpiration <= 7) {
        suggestedDiscount = 30; // 30% off
      } else if (daysUntilExpiration <= 14) {
        suggestedDiscount = 20; // 20% off
      } else if (daysUntilExpiration <= 30) {
        suggestedDiscount = 10; // 10% off
      }

      const discountedPrice = batch.product.salePrice * (1 - suggestedDiscount / 100);

      return {
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        productId: batch.product.id,
        productName: batch.product.name,
        size: batch.product.size,
        location: batch.location,
        quantity: batch.remainingQuantity,
        expiresAt: batch.expirationDate.toISOString(),
        daysUntilExpiration,
        urgency,
        originalPrice: batch.product.salePrice,
        suggestedDiscount,
        suggestedPrice: discountedPrice,
        estimatedLoss: batch.remainingQuantity * batch.cost,
      };
    }).filter((alert): alert is NonNullable<typeof alert> => alert !== null);

    // Estatísticas
    const summary = {
      totalAlerts: alerts.length,
      critical: alerts.filter((a) => a.urgency === 'critical').length,
      warning: alerts.filter((a) => a.urgency === 'warning').length,
      info: alerts.filter((a) => a.urgency === 'info').length,
      totalQuantity: alerts.reduce((sum, a) => sum + a.quantity, 0),
      potentialLoss: alerts.reduce((sum, a) => sum + a.estimatedLoss, 0),
    };

    return NextResponse.json({
      alerts,
      summary,
      generatedAt: new Date().toISOString(),
      daysAhead,
    });
  } catch (error) {
    console.error('Error fetching expiration alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expiration alerts' },
      { status: 500 }
    );
  }
}
