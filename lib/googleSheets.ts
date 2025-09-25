// Utilitário para integração com Google Sheets via API Route
const API_BASE = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_API_URL || ''
  : ''

export interface SaleData {
  id: string;
  date: Date;
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

interface SheetsSaleRecord {
  id: string
  date: string
  total: number
  paymentMethod?: string
  customerName?: string
  items: Array<{
    productId: string
    productName: string
    quantity: number
    price: number
  }>
}

interface SheetsResponse {
  sales?: SheetsSaleRecord[]
  totalSales?: number
  totalRevenue?: number
  todaySales?: number
  todayRevenue?: number
}

export class GoogleSheetsBackup {
  async saveSale(sale: SaleData, pointOfSale: string = 'default'): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/api/sheets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...sale,
          date: sale.date.toISOString(), // Converter Date para string
          pointOfSale // Adicionar identificador do ponto de venda
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Erro na API do Google Sheets:', error);
        return false;
      }

      const result = await response.json();
      console.log(`✅ Venda salva no Google Sheets (Ponto: ${pointOfSale}):`, result.saleId);
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar venda no Google Sheets:', error);
      return false;
    }
  }

  async getAllSales(pointOfSale: string = 'all'): Promise<SheetsSaleRecord[]> {
    try {
      const response = await fetch(`${API_BASE}/api/sheets?pointOfSale=${encodeURIComponent(pointOfSale)}`);

      if (!response.ok) {
        console.error('Erro ao buscar vendas:', response.statusText);
        return [];
      }

      const data = (await response.json()) as SheetsResponse;
      return data.sales ?? [];
    } catch (error) {
      console.error('Erro ao buscar vendas do Google Sheets:', error);
      return [];
    }
  }

  async getSalesSummary(pointOfSale: string = 'all'): Promise<{
    totalSales: number;
    totalRevenue: number;
    todaySales: number;
    todayRevenue: number;
  }> {
    try {
      const response = await fetch(`${API_BASE}/api/sheets?pointOfSale=${encodeURIComponent(pointOfSale)}`);

      if (!response.ok) {
        console.error('Erro ao buscar resumo:', response.statusText);
        return { totalSales: 0, totalRevenue: 0, todaySales: 0, todayRevenue: 0 };
      }

      const data = (await response.json()) as SheetsResponse;
      return {
        totalSales: data.totalSales || 0,
        totalRevenue: data.totalRevenue || 0,
        todaySales: data.todaySales || 0,
        todayRevenue: data.todayRevenue || 0,
      };
    } catch (error) {
      console.error('Erro ao calcular resumo:', error);
      return { totalSales: 0, totalRevenue: 0, todaySales: 0, todayRevenue: 0 };
    }
  }
}

// Instância global para uso fácil
export const sheetsBackup = new GoogleSheetsBackup();