import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import type { Prisma } from '@prisma/client';

interface SaleMetrics {
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
  topProducts: Array<{
    product: string;
    quantity: number;
    revenue: number;
  }>;
  salesByHour: Array<{
    hour: number;
    sales: number;
    revenue: number;
  }>;
  salesByPaymentMethod: Array<{
    method: string;
    count: number;
    total: number;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today'; // today, week, month, year
    const type = searchParams.get('type') || 'sales'; // sales, metrics, summary
    const limit = parseInt(searchParams.get('limit') || '50');

    let startDate: Date;
    const endDate = new Date();

    // Define period
    switch (period) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
    }

    if (type === 'metrics') {
      // Return detailed metrics
      const sales = await prisma.sale.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        },
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

      const metrics: SaleMetrics = {
        totalSales: sales.length,
        totalRevenue: sales.reduce((sum: number, sale: any) => sum + Number(sale.total), 0),
        averageTicket: sales.length > 0 ? 
          sales.reduce((sum: number, sale: any) => sum + Number(sale.total), 0) / sales.length : 0,
        topProducts: [],
        salesByHour: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          sales: 0,
          revenue: 0
        })),
        salesByPaymentMethod: []
      };

      // Calculate top products
      const productStats = new Map();
      sales.forEach((sale: any) => {
        sale.items.forEach((item: any) => {
          const key = item.product.name;
          if (productStats.has(key)) {
            const existing = productStats.get(key);
            productStats.set(key, {
              ...existing,
              quantity: existing.quantity + item.quantity,
              revenue: existing.revenue + (Number(item.price) * item.quantity)
            });
          } else {
            productStats.set(key, {
              product: key,
              quantity: item.quantity,
              revenue: Number(item.price) * item.quantity
            });
          }
        });
      });

      metrics.topProducts = Array.from(productStats.values())
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 10);

      // Calculate sales by hour
      sales.forEach((sale: any) => {
        const hour = new Date(sale.date).getHours();
        metrics.salesByHour[hour].sales++;
        metrics.salesByHour[hour].revenue += Number(sale.total);
      });

      // Calculate sales by payment method
      const paymentStats = new Map();
      sales.forEach((sale: any) => {
        const method = sale.paymentMethod || 'not_specified';
        if (paymentStats.has(method)) {
          const existing = paymentStats.get(method);
          paymentStats.set(method, {
            ...existing,
            count: existing.count + 1,
            total: existing.total + Number(sale.total)
          });
        } else {
          paymentStats.set(method, {
            method,
            count: 1,
            total: Number(sale.total)
          });
        }
      });

      metrics.salesByPaymentMethod = Array.from(paymentStats.values());

      return NextResponse.json(metrics);
    }

    if (type === 'summary') {
      // Return quick summary
      const [salesCount, revenue] = await Promise.all([
        prisma.sale.count({
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        prisma.sale.aggregate({
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          },
          _sum: {
            total: true
          }
        })
      ]);

      return NextResponse.json({
        period,
        salesCount,
        totalRevenue: Number(revenue._sum.total || 0),
        averageTicket: salesCount > 0 ? Number(revenue._sum.total || 0) / salesCount : 0
      });
    }

    // Default: return sales list
    const sales = await prisma.sale.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: limit
    });

    // Format response
    const formattedSales = sales.map((sale: any) => ({
      id: parseInt(sale.id),
      date: sale.date.toISOString(),
      status: sale.status,
      paymentMethod: sale.paymentMethod,
      notes: sale.notes,
      items: sale.items.map((item: any) => ({
        product: {
          id: item.product.id,
          name: item.product.name,
          size: item.product.size,
          price: Number(item.price)
        },
        qty: item.quantity
      })),
      total: Number(sale.total),
      itemsCount: sale.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
    }));

    return NextResponse.json(formattedSales);
  } catch (error) {
    console.error('Error in sales API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      items, 
      total, 
      paymentMethod, 
      notes, 
      customerName, 
      discount, 
      status,
      amountReceived,
      change,
      installments 
    } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items are required' },
        { status: 400 }
      );
    }

    // Validate items have sufficient stock
    for (const item of items) {
      const stockLevel = await prisma.stockLevel.findUnique({
        where: {
          productId_location: {
            productId: item.product.id,
            location: 'ponto_venda'
          }
        }
      });

      if (!stockLevel || stockLevel.quantity < item.qty) {
        return NextResponse.json(
          { 
            error: `Insufficient stock for ${item.product.name}`,
            details: `Available: ${stockLevel?.quantity || 0}, Required: ${item.qty}`
          },
          { status: 400 }
        );
      }
    }

    // Create sale in transaction
    const sale = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create sale record
      const newSale = await tx.sale.create({
        data: {
          total: total as unknown as Decimal,
          status: status || 'paid',
          paymentMethod: paymentMethod || null,
          notes: notes || null,
          items: {
            create: items.map((item: any) => ({
              productId: item.product.id,
              quantity: item.qty,
              price: item.product.price as unknown as Decimal,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      // Update stock levels
      for (const item of items) {
        await tx.stockLevel.update({
          where: {
            productId_location: {
              productId: item.product.id,
              location: 'ponto_venda'
            }
          },
          data: {
            quantity: {
              decrement: item.qty
            },
            lastUpdated: new Date()
          }
        });

        // Record stock movement
        await tx.stockMovement.create({
          data: {
            productId: item.product.id,
            fromLocation: 'ponto_venda',
            toLocation: null,
            quantity: item.qty,
            type: 'sale',
            timestamp: new Date(),
            notes: `Sale #${newSale.id}${customerName ? ` - ${customerName}` : ''}`,
            user: 'Sistema de Vendas'
          }
        });
      }

      // Check for low stock alerts
      for (const item of items) {
        const updatedStock = await tx.stockLevel.findUnique({
          where: {
            productId_location: {
              productId: item.product.id,
              location: 'ponto_venda'
            }
          }
        });

        if (updatedStock && updatedStock.quantity <= updatedStock.minStock) {
          await tx.inventoryAlert.create({
            data: {
              productId: item.product.id,
              location: 'ponto_venda',
              type: updatedStock.quantity === 0 ? 'out_of_stock' : 'low_stock',
              message: `${item.product.name} - Estoque ${updatedStock.quantity === 0 ? 'esgotado' : 'baixo'}: ${updatedStock.quantity} unidades`,
              timestamp: new Date(),
              resolved: false
            }
          });
        }
      }

      return newSale;
    });

    // Format response
    const formattedSale = {
      id: parseInt(sale.id),
      date: sale.date.toISOString(),
      status: sale.status,
      paymentMethod: sale.paymentMethod,
      notes: sale.notes,
      items: sale.items.map((item: any) => ({
        product: {
          id: item.product.id,
          name: item.product.name,
          size: item.product.size,
          price: Number(item.price)
        },
        qty: item.quantity
      })),
      total: Number(sale.total),
      customerName,
      paymentDetails: {
        method: paymentMethod,
        amountReceived,
        change,
        installments
      }
    };

    return NextResponse.json(formattedSale);
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json(
      { error: 'Failed to create sale', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Delete sales (with optional filters)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const saleId = searchParams.get('id');
    const confirmAll = searchParams.get('confirmAll') === 'true';

    if (saleId) {
      // Delete specific sale
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.saleItem.deleteMany({
          where: { saleId }
        });
        await tx.sale.delete({
          where: { id: saleId }
        });
      });

      return NextResponse.json({ message: `Sale #${saleId} deleted successfully` });
    } else if (confirmAll) {
      // Delete all sales
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.saleItem.deleteMany();
        await tx.sale.deleteMany();
      });

      return NextResponse.json({ message: 'All sales deleted successfully' });
    } else {
      return NextResponse.json(
        { error: 'Sale ID required or confirmAll=true for bulk delete' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error deleting sales:', error);
    return NextResponse.json(
      { error: 'Failed to delete sales', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}