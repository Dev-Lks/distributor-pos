import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Buscar produtos com inventário baixo ou crítico
    // Query otimizada: select apenas campos necessários
    const inventories = await prisma.inventory.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            isActive: true,
          },
        },
      },
      where: {
        product: {
          isActive: true,
        },
      },
    })

    // Calcular alertas
    const alerts = inventories
      .map(inv => {
        const totalStock =
          inv.coldRoomQuantity + inv.houseQuantity + inv.salePointQuantity
        const totalMinStock =
          inv.coldRoomMinStock + inv.houseMinStock + inv.salePointMinStock

        let level: 'critical' | 'low' | null = null

        if (totalStock === 0) {
          level = 'critical'
        } else if (totalStock < totalMinStock * 0.5) {
          level = 'critical'
        } else if (totalStock < totalMinStock) {
          level = 'low'
        }

        if (!level) return null

        return {
          productId: inv.product.id,
          productName: inv.product.name,
          sku: inv.product.sku,
          totalStock,
          minStock: totalMinStock,
          level,
          locations: {
            coldRoom: {
              quantity: inv.coldRoomQuantity,
              minStock: inv.coldRoomMinStock,
            },
            house: {
              quantity: inv.houseQuantity,
              minStock: inv.houseMinStock,
            },
            salePoint: {
              quantity: inv.salePointQuantity,
              minStock: inv.salePointMinStock,
            },
          },
        }
      })
      .filter(Boolean)
      .sort((a, b) => {
        // Críticos primeiro
        if (a!.level === 'critical' && b!.level !== 'critical') return -1
        if (a!.level !== 'critical' && b!.level === 'critical') return 1
        // Depois por menor quantidade
        return a!.totalStock - b!.totalStock
      })

    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Error fetching stock alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock alerts' },
      { status: 500 }
    )
  }
}
