import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('GET /api/inventory - Starting request');

    console.log('Fetching stock levels...');
    const stockLevels = await prisma.stockLevel.findMany({
      include: {
        product: true
      }
    });
    console.log(`Found ${stockLevels.length} stock levels`);

    console.log('Fetching movements...');
    const movements = await prisma.stockMovement.findMany({
      include: {
        product: true
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 100
    });
    console.log(`Found ${movements.length} movements`);

    console.log('Fetching alerts...');
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
    console.log(`Found ${alerts.length} unresolved alerts`);

    console.log('Inventory data fetched successfully');
    return NextResponse.json({
      stockLevels,
      movements,
      alerts
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}