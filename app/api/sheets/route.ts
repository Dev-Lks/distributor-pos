// API Route para backup no Google Sheets
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1MRq1X_DnecEFJ48buVXo2beaB2uVAvs9H6P_uwyAL_A'
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL

interface SaleData {
  id: string;
  date: string;
  total: number;
  paymentMethod?: string;
  customerName?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
}

async function getGoogleSheetsAuth() {
  try {
    let credentials: any

    if (process.env.GOOGLE_PRIVATE_KEY && SERVICE_ACCOUNT_EMAIL) {
      // Usar variáveis de ambiente (produção)
      credentials = {
        type: 'service_account',
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: SERVICE_ACCOUNT_EMAIL,
      }
    } else {
      // Tentar ler do arquivo local (desenvolvimento)
      try {
        const fs = require('fs')
        const path = require('path')
        const keyFile = path.join(process.cwd(), 'service-account.json')
        credentials = JSON.parse(fs.readFileSync(keyFile, 'utf8'))
      } catch (fileError) {
        console.warn('⚠️  Arquivo service-account.json não encontrado. Backup desabilitado.')
        return null
      }
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    return google.sheets({ version: 'v4', auth })
  } catch (error) {
    console.error('❌ Erro na autenticação do Google Sheets:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const saleData: SaleData = await request.json()

    const sheets = await getGoogleSheetsAuth()
    if (!sheets) {
      return NextResponse.json(
        { error: 'Google Sheets não configurado' },
        { status: 500 }
      )
    }

    // Formatar itens como string legível
    const itemsString = saleData.items
      .map(item => `${item.productName} (${item.quantity}x R$${item.price.toFixed(2)})`)
      .join(' | ');

    // Preparar dados para a planilha
    const values = [[
      saleData.id,
      saleData.date,
      `R$ ${saleData.total.toFixed(2)}`,
      saleData.paymentMethod || 'Não informado',
      saleData.customerName || 'Cliente não identificado',
      itemsString,
      saleData.items.length // Quantidade total de itens
    ]];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Vendas!A:G',
      valueInputOption: 'RAW',
      requestBody: {
        values: values
      }
    });

    if (response.status === 200) {
      console.log('✅ Venda salva no Google Sheets:', saleData.id);
      return NextResponse.json({ success: true, saleId: saleData.id })
    } else {
      console.error('❌ Erro na resposta do Google Sheets:', response.status);
      return NextResponse.json(
        { error: 'Erro ao salvar na planilha' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ Erro na API do Google Sheets:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const sheets = await getGoogleSheetsAuth()
    if (!sheets) {
      return NextResponse.json(
        { error: 'Google Sheets não configurado' },
        { status: 500 }
      )
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Vendas!A:G',
    });

    const sales = response.data.values || [];

    // Calcular resumo
    if (sales.length <= 1) {
      return NextResponse.json({
        totalSales: 0,
        totalRevenue: 0,
        todaySales: 0,
        todayRevenue: 0,
        sales: []
      })
    }

    const salesData = sales.slice(1); // Pular cabeçalho
    const today = new Date().toISOString().split('T')[0];

    let totalSales = 0;
    let totalRevenue = 0;
    let todaySales = 0;
    let todayRevenue = 0;

    salesData.forEach((row: any) => {
      if (row.length >= 3) {
        const date = row[1]?.split('T')[0];
        const revenue = parseFloat(row[2]?.replace('R$ ', '') || '0');

        totalSales++;
        totalRevenue += revenue;

        if (date === today) {
          todaySales++;
          todayRevenue += revenue;
        }
      }
    });

    return NextResponse.json({
      totalSales,
      totalRevenue,
      todaySales,
      todayRevenue,
      sales: salesData
    })

  } catch (error) {
    console.error('Erro ao buscar vendas do Google Sheets:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados' },
      { status: 500 }
    )
  }
}