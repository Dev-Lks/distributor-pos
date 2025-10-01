import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/inventory/analysis/abc - Gerar análise ABC
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar todos os produtos com suas vendas
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        saleItems: {
          select: {
            quantity: true,
            price: true,
          },
        },
        inventory: true,
      },
    });

    // Calcular receita por produto
    const productRevenues = products.map((product) => {
      const totalRevenue = product.saleItems.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );
      return {
        productId: product.id,
        name: product.name,
        size: product.size,
        totalRevenue,
      };
    });

    // Ordenar por receita (maior para menor)
    productRevenues.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Calcular receita total
    const totalRevenue = productRevenues.reduce((sum, p) => sum + p.totalRevenue, 0);

    // Classificar em ABC
    let cumulativeRevenue = 0;
    const abcAnalysis = productRevenues.map((product, index) => {
      cumulativeRevenue += product.totalRevenue;
      const revenueContribution = totalRevenue > 0 ? (product.totalRevenue / totalRevenue) * 100 : 0;
      const cumulativePercentage = totalRevenue > 0 ? (cumulativeRevenue / totalRevenue) * 100 : 0;

      // Classificação ABC
      let abcClass: 'A' | 'B' | 'C';
      if (cumulativePercentage <= 80) {
        abcClass = 'A'; // Top 20% dos produtos = 80% da receita
      } else if (cumulativePercentage <= 95) {
        abcClass = 'B'; // Próximos 30% = 15% da receita
      } else {
        abcClass = 'C'; // Últimos 50% = 5% da receita
      }

      return {
        productId: product.productId,
        name: product.name,
        size: product.size,
        totalRevenue: product.totalRevenue,
        revenueContribution,
        cumulativePercentage,
        abcClass,
        rank: index + 1,
      };
    });

    // Atualizar a classificação ABC no inventário
    for (const item of abcAnalysis) {
      await prisma.inventory.upsert({
        where: { productId: item.productId },
        create: {
          productId: item.productId,
          abcClass: item.abcClass,
          revenueContribution: item.revenueContribution,
        },
        update: {
          abcClass: item.abcClass,
          revenueContribution: item.revenueContribution,
        },
      });
    }

    // Estatísticas por classe
    const classA = abcAnalysis.filter((p) => p.abcClass === 'A');
    const classB = abcAnalysis.filter((p) => p.abcClass === 'B');
    const classC = abcAnalysis.filter((p) => p.abcClass === 'C');

    const summary = {
      totalProducts: abcAnalysis.length,
      totalRevenue,
      classA: {
        count: classA.length,
        percentage: (classA.length / abcAnalysis.length) * 100,
        revenue: classA.reduce((sum, p) => sum + p.totalRevenue, 0),
        revenuePercentage: classA.reduce((sum, p) => sum + p.revenueContribution, 0),
      },
      classB: {
        count: classB.length,
        percentage: (classB.length / abcAnalysis.length) * 100,
        revenue: classB.reduce((sum, p) => sum + p.totalRevenue, 0),
        revenuePercentage: classB.reduce((sum, p) => sum + p.revenueContribution, 0),
      },
      classC: {
        count: classC.length,
        percentage: (classC.length / abcAnalysis.length) * 100,
        revenue: classC.reduce((sum, p) => sum + p.totalRevenue, 0),
        revenuePercentage: classC.reduce((sum, p) => sum + p.revenueContribution, 0),
      },
    };

    return NextResponse.json({
      analysis: abcAnalysis,
      summary,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating ABC analysis:', error);
    return NextResponse.json(
      { error: 'Failed to generate ABC analysis' },
      { status: 500 }
    );
  }
}
