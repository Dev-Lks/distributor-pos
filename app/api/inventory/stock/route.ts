import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { productId, location, quantity, minStock = 0 } = await request.json();

    if (!productId || !location || quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const stockLevel = await prisma.stockLevel.upsert({
      where: {
        productId_location: {
          productId,
          location
        }
      },
      update: {
        quantity,
        lastUpdated: new Date()
      },
      create: {
        productId,
        location,
        quantity,
        minStock,
        lastUpdated: new Date()
      }
    });

    // Check for alerts
    await checkAlerts(prisma, productId, location);

    return NextResponse.json(stockLevel);
  } catch (error) {
    console.error('Error updating stock level:', error);
    return NextResponse.json(
      { error: 'Failed to update stock level' },
      { status: 500 }
    );
  }
}

async function checkAlerts(tx: any, productId: string, location: string) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const stock = await prisma.stockLevel.findUnique({
    where: {
      productId_location: {
        productId,
        location: location as 'camara_fria' | 'casa' | 'ponto_venda'
      }
    }
  });

  if (!stock) return;

  const existingAlert = await prisma.inventoryAlert.findFirst({
    where: {
      productId,
      location: location as 'camara_fria' | 'casa' | 'ponto_venda',
      resolved: false
    }
  });

  if (stock.quantity <= 0) {
    // Out of stock
    if (!existingAlert || existingAlert.type !== 'out_of_stock') {
      await prisma.inventoryAlert.create({
        data: {
          productId,
          location: location as 'camara_fria' | 'casa' | 'ponto_venda',
          type: 'out_of_stock',
          message: `Produto sem estoque em ${location}`,
          timestamp: new Date(),
          resolved: false
        }
      });
    }
  } else if (stock.quantity <= stock.minStock) {
    // Low stock
    if (!existingAlert || existingAlert.type !== 'low_stock') {
      await prisma.inventoryAlert.create({
        data: {
          productId,
          location: location as 'camara_fria' | 'casa' | 'ponto_venda',
          type: 'low_stock',
          message: `Estoque baixo (${stock.quantity}) em ${location}`,
          timestamp: new Date(),
          resolved: false
        }
      });
    }
  } else if (existingAlert) {
    // Resolve alert if stock normalized
    await prisma.inventoryAlert.updateMany({
      where: {
        productId,
        location: location as 'camara_fria' | 'casa' | 'ponto_venda',
        resolved: false
      },
      data: {
        resolved: true
      }
    });
  }
}