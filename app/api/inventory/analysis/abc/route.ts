import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sumBy } from '@/lib/utils/calculations';

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
    const productRevenues = products.map((product) => ({
      productId: product.id,
      name: product.name,
      size: product.size,
      totalRevenue: sumBy(product.saleItems, (item) => item.quantity * item.price),
    }));

    // Ordenar por receita (maior para menor)
    productRevenues.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Calcular receita total
    const totalRevenue = sumBy(productRevenues, (p) => p.totalRevenue);

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

    const upsertOperations = abcAnalysis.map((item) =>
      prisma.inventory.upsert({
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
      }),
    );

    if (upsertOperations.length > 0) {
      await prisma.$transaction(upsertOperations);
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
        percentage: abcAnalysis.length > 0 ? (classA.length / abcAnalysis.length) * 100 : 0,
        revenue: sumBy(classA, (p) => p.totalRevenue),
        revenuePercentage: sumBy(classA, (p) => p.revenueContribution),
      },
      classB: {
        count: classB.length,
        percentage: abcAnalysis.length > 0 ? (classB.length / abcAnalysis.length) * 100 : 0,
        revenue: sumBy(classB, (p) => p.totalRevenue),
        revenuePercentage: sumBy(classB, (p) => p.revenueContribution),
      },
      classC: {
        count: classC.length,
        percentage: abcAnalysis.length > 0 ? (classC.length / abcAnalysis.length) * 100 : 0,
        revenue: sumBy(classC, (p) => p.totalRevenue),
        revenuePercentage: sumBy(classC, (p) => p.revenueContribution),
      },
    };

    const response = NextResponse.json({
      analysis: abcAnalysis,
      summary,
      generatedAt: new Date().toISOString(),
    });

    response.headers.set('Cache-Control', 'private, max-age=600, stale-while-revalidate=1800');
    response.headers.set('Vary', 'Cookie, Authorization, Origin');

    return response;
  } catch (error) {
    console.error('Error generating ABC analysis:', error);
    return NextResponse.json(
      { error: 'Failed to generate ABC analysis' },
      { status: 500 }
    );
  }
}
