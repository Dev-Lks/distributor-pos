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
  status: string;
  paymentMethod: string | null;
  notes: string | null;
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
    console.log('GET /api/sales - Starting request');

    // Check database connection
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set');
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }

    console.log('Database URL configured, fetching sales...');

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

    console.log(`Found ${sales.length} sales`);

    // Transform to match the expected format
    const formattedSales = sales.map((sale: SaleWithItems) => ({
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
      total: Number(sale.total),
      status: (sale as any).status || 'paid',
      paymentMethod: (sale as any).paymentMethod || null,
      notes: (sale as any).notes || null
    }));

    console.log('Sales formatted successfully');
    return NextResponse.json(formattedSales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/sales - Starting request');

  const { items, total, paymentMethod, notes, status } = await request.json();
    console.log('Request body parsed:', { itemsCount: items?.length, total });

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log('Invalid items data provided');
      return NextResponse.json(
        { error: 'Invalid items data' },
        { status: 400 }
      );
    }

    console.log('Creating sale with transaction...');

    // Create sale and items in a transaction
    const sale = await prisma.$transaction(async (tx: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.log('Transaction started');

      const newSale = await tx.sale.create({
        data: {
          total: total || items.reduce((sum: number, item: SaleItemInput) => sum + (item.product.price * item.qty), 0),
          status: status || 'paid',
          paymentMethod: paymentMethod || null,
          notes: notes || null,
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

      console.log('Sale created with ID:', newSale.id);

      // Update inventory for sold items (assuming sales come from 'ponto_venda')
      for (const item of items) {
        console.log(`Updating inventory for product ${item.product.id}, quantity: ${item.qty}`);

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

          console.log(`Updated stock for ${item.product.id}: ${stockLevel.quantity} -> ${Math.max(0, stockLevel.quantity - item.qty)}`);

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
        } else {
          console.warn(`No stock level found for product ${item.product.id} at ponto_venda`);
        }
      }

      console.log('Transaction completed successfully');
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
      total: Number(sale.total),
      status: (sale as any).status || 'paid',
      paymentMethod: (sale as any).paymentMethod || null,
      notes: (sale as any).notes || null
    };

    console.log('Sale formatted and ready to return');
    return NextResponse.json(formattedSale);
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json(
      { error: 'Failed to create sale', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    console.log('DELETE /api/sales - Starting request');

    await prisma.$transaction(async (tx: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.log('Starting transaction to clear sales history');

      await tx.saleItem.deleteMany();
      console.log('Deleted all sale items');

      await tx.sale.deleteMany();
      console.log('Deleted all sales');

      console.log('Transaction completed successfully');
    });

    console.log('Sales history cleared successfully');
    return NextResponse.json({ message: 'Sales history cleared successfully' });
  } catch (error) {
    console.error('Error clearing sales:', error);
    return NextResponse.json(
      { error: 'Failed to clear sales history', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}