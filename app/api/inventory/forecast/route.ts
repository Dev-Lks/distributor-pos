import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

    const forecasts = [];

    for (const product of products) {
      if (!product.inventory) continue;

      // Calcular consumo diário médio
      const totalSold = product.saleItems.reduce((sum, item) => sum + item.quantity, 0);
      const averageDailyConsumption = totalSold / 30;

      // Estoque atual total
      const currentStock =
        product.inventory.coldRoomQuantity +
        product.inventory.houseQuantity +
        product.inventory.salePointQuantity;

      // Dias até esgotar
      const daysUntilStockout =
        averageDailyConsumption > 0 ? Math.floor(currentStock / averageDailyConsumption) : 999;

      // Ponto de reposição (quando o estoque durar apenas 7 dias)
      const suggestedReorderPoint = Math.ceil(averageDailyConsumption * 7);

      // Quantidade econômica de pedido (para 14 dias)
      const suggestedOrderQuantity = Math.ceil(averageDailyConsumption * 14);

      // Calcular tendência (comparar primeira quinzena vs segunda quinzena)
      const firstHalf = product.saleItems
        .filter((item) => {
          const date = new Date(item.sale.date);
          const fifteenDaysAgo = new Date();
          fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
          return date >= thirtyDaysAgo && date < fifteenDaysAgo;
        })
        .reduce((sum, item) => sum + item.quantity, 0);

      const secondHalf = product.saleItems
        .filter((item) => {
          const date = new Date(item.sale.date);
          const fifteenDaysAgo = new Date();
          fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
          return date >= fifteenDaysAgo;
        })
        .reduce((sum, item) => sum + item.quantity, 0);

      let seasonalTrend: 'up' | 'down' | 'stable' = 'stable';
      if (secondHalf > firstHalf * 1.2) {
        seasonalTrend = 'up';
      } else if (secondHalf < firstHalf * 0.8) {
        seasonalTrend = 'down';
      }

      // Confiança (baseado na variabilidade das vendas)
      const confidence = totalSold > 10 ? 90 : totalSold > 5 ? 70 : 50;

      // Atualizar campos de previsão no inventário
      await prisma.inventory.update({
        where: { productId: product.id },
        data: {
          averageDailyConsumption,
          reorderPoint: suggestedReorderPoint,
          economicOrderQuantity: suggestedOrderQuantity,
        },
      });

      // Adicionar ao resultado se relevante (tem movimentação)
      if (totalSold > 0) {
        forecasts.push({
          productId: product.id,
          productName: product.name,
          size: product.size,
          averageDailyConsumption: parseFloat(averageDailyConsumption.toFixed(2)),
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

    // Ordenar por urgência (menor dias até esgotar primeiro)
    forecasts.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);

    return NextResponse.json({
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
  } catch (error) {
    console.error('Error generating demand forecast:', error);
    return NextResponse.json(
      { error: 'Failed to generate demand forecast' },
      { status: 500 }
    );
  }
}
