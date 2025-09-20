import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const {
      productId,
      fromLocation,
      toLocation,
      quantity,
      type,
      notes
    } = await request.json();

    if (!productId || !type || quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Create the movement record
    const movement = await prisma.stockMovement.create({
      data: {
        productId,
        fromLocation: fromLocation || null,
        toLocation: toLocation || null,
        quantity,
        type,
        timestamp: new Date(),
        notes,
        user: 'Sistema' // TODO: implement logged user
      }
    });

    // Update stock levels
    await prisma.$transaction(async (tx) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      // Decrease from location if specified
      if (fromLocation) {
        const stockLevel = await tx.stockLevel.findUnique({
          where: {
            productId_location: {
              productId,
              location: fromLocation as 'camara_fria' | 'casa' | 'ponto_venda'
            }
          }
        });

        if (stockLevel) {
          await tx.stockLevel.update({
            where: {
              productId_location: {
                productId,
                location: fromLocation as 'camara_fria' | 'casa' | 'ponto_venda'
              }
            },
            data: {
              quantity: Math.max(0, stockLevel.quantity - quantity),
              lastUpdated: new Date()
            }
          });
        }
      }

      // Increase to location if specified
      if (toLocation) {
        const stockLevel = await tx.stockLevel.findUnique({
          where: {
            productId_location: {
              productId,
              location: toLocation as 'camara_fria' | 'casa' | 'ponto_venda'
            }
          }
        });

        if (stockLevel) {
          await tx.stockLevel.update({
            where: {
              productId_location: {
                productId,
                location: toLocation as 'camara_fria' | 'casa' | 'ponto_venda'
              }
            },
            data: {
              quantity: stockLevel.quantity + quantity,
              lastUpdated: new Date()
            }
          });
        } else {
          // Create new stock level if it doesn't exist
          await tx.stockLevel.create({
            data: {
              productId,
              location: toLocation as 'camara_fria' | 'casa' | 'ponto_venda',
              quantity,
              minStock: 0,
              lastUpdated: new Date()
            }
          });
        }
      }

      // Check for alerts on affected locations
      if (fromLocation) {
        await checkAlerts(tx, productId, fromLocation);
      }
      if (toLocation) {
        await checkAlerts(tx, productId, toLocation);
      }
    });

    return NextResponse.json(movement);
  } catch (error) {
    console.error('Error recording movement:', error);
    return NextResponse.json(
      { error: 'Failed to record movement' },
      { status: 500 }
    );
  }
}

async function checkAlerts(tx: any, productId: string, location: string) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const stock = await tx.stockLevel.findUnique({
    where: {
      productId_location: {
        productId,
        location: location as 'camara_fria' | 'casa' | 'ponto_venda'
      }
    }
  });

  if (!stock) return;

  const existingAlert = await tx.inventoryAlert.findFirst({
    where: {
      productId,
      location: location as 'camara_fria' | 'casa' | 'ponto_venda',
      resolved: false
    }
  });

  if (stock.quantity <= 0) {
    // Out of stock
    if (!existingAlert || existingAlert.type !== 'out_of_stock') {
      await tx.inventoryAlert.create({
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
      await tx.inventoryAlert.create({
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
    await tx.inventoryAlert.updateMany({
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