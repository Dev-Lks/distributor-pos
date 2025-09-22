import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/inventory/stock - Starting request');

  const { productId, location, quantity, minStock } = await request.json();
    console.log('Request body:', { productId, location, quantity, minStock });

    if (!productId || !location || quantity === undefined) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Checking if product exists...');
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      console.log(`Product not found: ${productId}`);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    console.log('Updating stock level...');
    const stockLevel = await prisma.stockLevel.upsert({
      where: {
        productId_location: {
          productId,
          location
        }
      },
      update: {
        quantity,
        lastUpdated: new Date(),
        ...(typeof minStock === 'number' ? { minStock } : {})
      },
      create: {
        productId,
        location,
        quantity,
        minStock: typeof minStock === 'number' ? minStock : 0,
        lastUpdated: new Date()
      }
    });

    console.log('Checking for alerts...');
    // Check for alerts
    await checkAlerts(prisma, productId, location);

    console.log('Stock level updated successfully');
    return NextResponse.json(stockLevel);
  } catch (error) {
    console.error('Error updating stock level:', error);
    return NextResponse.json(
      { error: 'Failed to update stock level', details: error instanceof Error ? error.message : 'Unknown error' },
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