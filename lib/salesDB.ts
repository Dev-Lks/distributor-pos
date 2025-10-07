import { openDB, type IDBPDatabase, type DBSchema } from 'idb';

export interface Sale {
  id?: number;
  date: Date;
  total: number;
  items: SaleItem[];
}

export interface SaleItem {
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