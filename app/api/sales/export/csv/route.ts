import { NextRequest, NextResponse } from 'next/server';
import { getAllSales } from '@/lib/salesDB';

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const sales = await getAllSales();

    const data = sales.map((sale) => ({
      ID: sale.id,
      Data: sale.date.toISOString().split('T')[0],
      Total: sale.total,
      Itens: sale.items
        .map((item) => `${item.productName} (${item.quantity}x R$${item.price})`)
        .join('; '),
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map((row) => Object.values(row).join(',')),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="vendas_${new Date().toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao exportar vendas para CSV' },
      { status: 500 }
    );
  }
}
