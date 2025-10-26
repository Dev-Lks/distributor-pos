import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
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

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendas');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="vendas_${new Date().toISOString().split('T')[0]}.xlsx"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao exportar vendas para XLSX' },
      { status: 500 }
    );
  }
}
