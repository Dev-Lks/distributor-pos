import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import * as XLSX from 'xlsx';

interface Sale {
  id?: number;
  date: Date;
  total: number;
  items: SaleItem[];
}

interface SaleItem {
  productId: string;
  quantity: number;
  productName?: string;
  price?: number;
}

interface SalesDBSchema extends DBSchema {
  sales: {
    key: number;
    value: Sale;
    indexes: {
      date: Date;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<SalesDBSchema>> | undefined;

function initDB(): Promise<IDBPDatabase<SalesDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<SalesDBSchema>('SalesDB', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sales')) {
          const store = db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true });
          store.createIndex('date', 'date');
        }
      },
    });
  }
  return dbPromise;
}

export async function addSale(sale: Omit<Sale, 'id'>): Promise<number> {
  const db = await initDB();
  return db.add('sales', sale);
}

export async function getAllSales(): Promise<Sale[]> {
  const db = await initDB();
  return db.getAll('sales');
}

export async function getSalesByDateRange(start: Date, end: Date): Promise<Sale[]> {
  const db = await initDB();
  const index = db.transaction('sales').store.index('date');
  return index.getAll(IDBKeyRange.bound(start, end));
}

export async function clearAllSales(): Promise<void> {
  const db = await initDB();
  const tx = db.transaction('sales', 'readwrite');
  tx.store.clear();
  await tx.done;
}

export async function exportSalesToXLSX(): Promise<void> {
  const sales = await getAllSales();
  const data = sales.map(sale => ({
    ID: sale.id,
    Data: sale.date.toISOString().split('T')[0],
    Total: sale.total,
    Itens: sale.items.map(item => `${item.productName} (${item.quantity}x R$${item.price})`).join('; ')
  }));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendas');
  XLSX.writeFile(workbook, `vendas_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export async function exportSalesToCSV(): Promise<void> {
  const sales = await getAllSales();
  const data = sales.map(sale => ({
    ID: sale.id,
    Data: sale.date.toISOString().split('T')[0],
    Total: sale.total,
    Itens: sale.items.map(item => `${item.productName} (${item.quantity}x R$${item.price})`).join('; ')
  }));
  const csv = [
    Object.keys(data[0]).join(','),
    ...data.map(row => Object.values(row).join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vendas_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}