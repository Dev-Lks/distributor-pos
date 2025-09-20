import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Define types manually since Prisma client generation has issues
interface Sale {
  id: string;
  date: Date;
  total: Decimal;
  createdAt: Date;
  updatedAt: Date;
}

interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  price: Decimal;
  product: {
    id: string;
    name: string;
    size: string;
    price: Decimal;
  };
}

interface SaleItemInput {
  product: {
    id: string;
    name: string;
    size: string;
    price: number;
  };
  qty: number;
}

type SaleWithItems = Sale & {
  items: SaleItem[];
};

export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Transform to match the expected format
    const formattedSales = sales.map((sale: SaleWithItems) => ({
      id: parseInt(sale.id),
      date: sale.date.toISOString(),
      items: sale.items.map(item => ({
        product: {
          id: item.product.id,
          name: item.product.name,
          size: item.product.size,
          price: Number(item.price)
        },
        qty: item.quantity
      })),
      total: Number(sale.total)
    }));

    return NextResponse.json(formattedSales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { items, total } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid items data' },
        { status: 400 }
      );
    }

    // Create sale and items in a transaction
    const sale = await prisma.$transaction(async (tx: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const newSale = await tx.sale.create({
        data: {
          total: total || items.reduce((sum: number, item: SaleItemInput) => sum + (item.product.price * item.qty), 0),
          items: {
            create: items.map((item: SaleItemInput) => ({
              productId: item.product.id,
              quantity: item.qty,
              price: item.product.price
            }))
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      // Update inventory for sold items (assuming sales come from 'ponto_venda')
      for (const item of items) {
        const stockLevel = await tx.stockLevel.findUnique({
          where: {
            productId_location: {
              productId: item.product.id,
              location: 'ponto_venda'
            }
          }
        });

        if (stockLevel) {
          await tx.stockLevel.update({
            where: {
              productId_location: {
                productId: item.product.id,
                location: 'ponto_venda'
              }
            },
            data: {
              quantity: Math.max(0, stockLevel.quantity - item.qty),
              lastUpdated: new Date()
            }
          });

          // Record the sale movement
          await tx.stockMovement.create({
            data: {
              productId: item.product.id,
              fromLocation: 'ponto_venda',
              toLocation: null,
              quantity: item.qty,
              type: 'sale',
              timestamp: new Date(),
              notes: `Venda #${newSale.id}`,
              user: 'Sistema'
            }
          });
        }
      }

      return newSale;
    });

    // Transform response to match expected format
    const formattedSale = {
      id: parseInt(sale.id),
      date: sale.date.toISOString(),
      items: sale.items.map((item: SaleItem) => ({
        product: {
          id: item.product.id,
          name: item.product.name,
          size: item.product.size,
          price: Number(item.price)
        },
        qty: item.quantity
      })),
      total: Number(sale.total)
    };

    return NextResponse.json(formattedSale);
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json(
      { error: 'Failed to create sale' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.saleItem.deleteMany();
      await tx.sale.deleteMany();
    });

    return NextResponse.json({ message: 'Sales history cleared successfully' });
  } catch (error) {
    console.error('Error clearing sales:', error);
    return NextResponse.json(
      { error: 'Failed to clear sales history' },
      { status: 500 }
    );
  }
}