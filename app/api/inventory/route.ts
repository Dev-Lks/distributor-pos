import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const stockLevels = await prisma.stockLevel.findMany({
      include: {
        product: true
      }
    });

    const movements = await prisma.stockMovement.findMany({
      include: {
        product: true
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 100
    });

    const alerts = await prisma.inventoryAlert.findMany({
      include: {
        product: true
      },
      where: {
        resolved: false
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    return NextResponse.json({
      stockLevels,
      movements,
      alerts
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}