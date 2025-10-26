import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sumBy } from '@/lib/utils/calculations';

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/inventory/forecast - Previsão de demanda
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Período de análise: últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    // Buscar produtos ativos com inventário e vendas recentes
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        inventory: true,
        saleItems: {
          where: {
            sale: {
              date: {
                gte: thirtyDaysAgo,
              },
            },
          },
          include: {
            sale: {
              select: {
                date: true,
              },
            },
          },
        },
      },
    });

    const forecasts: Array<{
      productId: string;
      productName: string;
      size: string;
      averageDailyConsumption: number;
      currentStock: number;
      daysUntilStockout: number;
      suggestedReorderPoint: number;
      suggestedOrderQuantity: number;
      seasonalTrend: 'up' | 'down' | 'stable';
      confidence: number;
      needsReorder: boolean;
      urgency: 'critical' | 'high' | 'medium' | 'low';
    }> = [];

    const inventoryUpdates: Array<{
      productId: string;
      data: {
        averageDailyConsumption: number;
        reorderPoint: number;
        economicOrderQuantity: number;
      };
    }> = [];

    for (const product of products) {
      if (!product.inventory) {
        continue;
      }

      const saleItems = product.saleItems;
      const totalSold = sumBy(saleItems, (item) => item.quantity);
      const averageDailyConsumption = totalSold / 30;

      const currentStock =
        (product.inventory.coldRoomQuantity ?? 0) +
        (product.inventory.houseQuantity ?? 0) +
        (product.inventory.salePointQuantity ?? 0);

      const daysUntilStockout = averageDailyConsumption > 0 ? Math.floor(currentStock / averageDailyConsumption) : 999;
      const suggestedReorderPoint = Math.ceil(averageDailyConsumption * 7);
      const suggestedOrderQuantity = Math.ceil(averageDailyConsumption * 14);

      const firstHalf = sumBy(saleItems, (item) => {
        const date = new Date(item.sale.date);
        return date >= thirtyDaysAgo && date < fifteenDaysAgo ? item.quantity : 0;
      });

      const secondHalf = sumBy(saleItems, (item) => {
        const date = new Date(item.sale.date);
        return date >= fifteenDaysAgo ? item.quantity : 0;
      });

      let seasonalTrend: 'up' | 'down' | 'stable' = 'stable';
      if (secondHalf > firstHalf * 1.2) {
        seasonalTrend = 'up';
      } else if (secondHalf < firstHalf * 0.8) {
        seasonalTrend = 'down';
      }

      const confidence = totalSold > 10 ? 90 : totalSold > 5 ? 70 : 50;

      inventoryUpdates.push({
        productId: product.id,
        data: {
          averageDailyConsumption,
          reorderPoint: suggestedReorderPoint,
          economicOrderQuantity: suggestedOrderQuantity,
        },
      });

      if (totalSold > 0) {
        forecasts.push({
          productId: product.id,
          productName: product.name,
          size: product.size,
          averageDailyConsumption: Number(averageDailyConsumption.toFixed(2)),
          currentStock,
          daysUntilStockout,
          suggestedReorderPoint,
          suggestedOrderQuantity,
          seasonalTrend,
          confidence,
          needsReorder: currentStock <= suggestedReorderPoint,
          urgency:
            daysUntilStockout <= 3
              ? 'critical'
              : daysUntilStockout <= 7
              ? 'high'
              : daysUntilStockout <= 14
              ? 'medium'
              : 'low',
        });
      }
    }

    if (inventoryUpdates.length > 0) {
      await prisma.$transaction(
        inventoryUpdates.map((update) =>
          prisma.inventory.update({
            where: { productId: update.productId },
            data: update.data,
          }),
        ),
      );
    }

    // Ordenar por urgência (menor dias até esgotar primeiro)
    forecasts.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);

    const response = NextResponse.json({
      forecasts,
      summary: {
        totalProducts: forecasts.length,
        needsReorder: forecasts.filter((f) => f.needsReorder).length,
        critical: forecasts.filter((f) => f.urgency === 'critical').length,
        high: forecasts.filter((f) => f.urgency === 'high').length,
      },
      generatedAt: new Date().toISOString(),
      periodAnalyzed: {
        start: thirtyDaysAgo.toISOString(),
        end: new Date().toISOString(),
      },
    });

    response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=900');
    response.headers.set('Vary', 'Cookie, Authorization, Origin');

    return response;
  } catch (error) {
    console.error('Error generating demand forecast:', error);
    return NextResponse.json(
      { error: 'Failed to generate demand forecast' },
      { status: 500 }
    );
  }
}
