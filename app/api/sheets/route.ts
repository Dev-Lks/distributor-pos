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
    const sale: {
      id: string;
      date: string; // ISO string
      total: number;
      paymentMethod?: string;
      customerName?: string;
      items: Array<{
        productId: string;
        productName: string;
        quantity: number;
        price: number;
      }>;
    } = await request.json();

    // Prepare the row data
    const formattedDate = new Date(sale.date).toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const formattedTotal = `R$ ${sale.total.toFixed(2).replace('.', ',')}`;
    const formattedItems = sale.items.map(item => 
      `${item.productName} x${item.quantity} @R$ ${item.price.toFixed(2).replace('.', ',')}`
    ).join(', ');

    const row = [
      sale.id,
      formattedDate,
      formattedTotal,
      formattedItems,
      sale.paymentMethod || 'Não informado',
    ];

    // Append to sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A:E`, // Assuming columns A to E
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

export async function GET() {
  try {
    // Read all data from sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A:E`,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return NextResponse.json({ sales: [], totalSales: 0, totalRevenue: 0, todaySales: 0, todayRevenue: 0 });
    }

    // Skip header row
    const dataRows = rows.slice(1);

    const sales = dataRows.map(row => ({
      id: row[0],
      date: row[1], // Keep as formatted
      total: parseFloat(row[2].replace('R$ ', '').replace(',', '.')) || 0,
      items: [], // Not parsing since it's formatted as string for readability
      paymentMethod: row[4] || '',
    }));

    // Calculate summary
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    let totalSales = 0;
    let totalRevenue = 0;
    let todaySales = 0;
    let todayRevenue = 0;

    sales.forEach(sale => {
      totalSales++;
      totalRevenue += sale.total;
      // Parse formatted date to YYYY-MM-DD
      const saleDateStr = sale.date.split(' ')[0]; // "24/09/2025"
      const [day, month, year] = saleDateStr.split('/');
      const saleDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      if (saleDate === today) {
        todaySales++;
        todayRevenue += sale.total;
      }
    });

    return NextResponse.json({
      sales,
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
