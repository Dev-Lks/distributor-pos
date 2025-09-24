import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Vendas';

if (!SPREADSHEET_ID) {
  throw new Error('GOOGLE_SHEET_ID environment variable is not set');
}

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(process.cwd(), 'service-account.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pointOfSale = 'default', ...sale } = body;

    // Prepare the row data
    const formattedDate = new Date(sale.date).toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const formattedTotal = `R$ ${sale.total.toFixed(2).replace('.', ',')}`;
    const formattedItems = sale.items.map((item: any) => 
      `${item.productName} x${item.quantity} @R$ ${item.price.toFixed(2).replace('.', ',')}`
    ).join(', ');

    const row = [
      sale.id,
      formattedDate,
      formattedTotal,
      formattedItems,
      sale.paymentMethod || 'Não informado',
      sale.customerName || '',
      pointOfSale, // Adicionar coluna para ponto de venda
    ];

    // Use aba específica para o ponto de venda
    const sheetName = pointOfSale === 'default' ? SHEET_NAME : `${SHEET_NAME}_${pointOfSale}`;

    // Append to sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${sheetName}'!A:F`, // Agora até F
      valueInputOption: 'RAW',
      requestBody: {
        values: [row],
      },
    });

    return NextResponse.json({ success: true, saleId: sale.id });
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    return NextResponse.json({ error: 'Failed to save sale' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pointOfSale = searchParams.get('pointOfSale') || 'all';

    let allSales: any[] = [];
    let sheetNames: string[] = [];

    if (pointOfSale === 'all') {
      // Listar todas as abas e ler
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      });
      sheetNames = spreadsheet.data.sheets?.map(sheet => sheet.properties?.title || '').filter(title => title.startsWith(SHEET_NAME)) || [SHEET_NAME];
    } else {
      sheetNames = [pointOfSale === 'default' ? SHEET_NAME : `${SHEET_NAME}_${pointOfSale}`];
    }

    for (const sheetName of sheetNames) {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `'${sheetName}'!A:F`,
        });

        const rows = response.data.values || [];
        if (rows.length > 1) { // Skip header
          const dataRows = rows.slice(1);
          const sales = dataRows.map(row => ({
            id: row[0],
            date: row[1],
            total: parseFloat(row[2].replace('R$ ', '').replace(',', '.')) || 0,
            items: [],
            paymentMethod: row[4] || '',
            pointOfSale: row[5] || 'default',
          }));
          allSales.push(...sales);
        }
      } catch (error) {
        console.warn(`Erro ao ler aba ${sheetName}:`, error);
      }
    }

    if (allSales.length === 0) {
      return NextResponse.json({ sales: [], totalSales: 0, totalRevenue: 0, todaySales: 0, todayRevenue: 0 });
    }

    // Calculate summary
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    let totalSales = 0;
    let totalRevenue = 0;
    let todaySales = 0;
    let todayRevenue = 0;

    allSales.forEach(sale => {
      totalSales++;
      totalRevenue += sale.total;
      const saleDateStr = sale.date.split(' ')[0]; // "24/09/2025"
      const [day, month, year] = saleDateStr.split('/');
      const saleDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      if (saleDate === today) {
        todaySales++;
        todayRevenue += sale.total;
      }
    });

    return NextResponse.json({
      sales: allSales,
      totalSales,
      totalRevenue,
      todaySales,
      todayRevenue,
    });
  } catch (error) {
    console.error('Error reading from Google Sheets:', error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}
