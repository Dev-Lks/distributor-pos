/**
 * Tipos relacionados a vendas
 */

export interface Sale {
  id: string
  total: number
  paymentMethod: string
  pointOfSaleId: string
  userId: string
  customerId?: string
  customerName?: string
  notes?: string
  status: SaleStatus
  createdAt: string | Date
  updatedAt: string | Date
  items: SaleItem[]
  user?: {
    id: string
    name: string
    email: string
  }
  pointOfSale?: {
    id: string
    name: string
  }
  customer?: {
    id: string
    name: string
  }
}

export interface SaleItem {
  id: string
  saleId: string
  productId: string
  productName: string
  quantity: number
  price: number
  discount?: number
  subtotal: number
  product?: {
    id: string
    name: string
    sku: string
  }
}

export type SaleStatus = 'COMPLETED' | 'CANCELLED' | 'PENDING'

export interface CreateSaleData {
  items: CreateSaleItemData[]
  paymentMethod: string
  pointOfSaleId: string
  total: number
  customerData?: {
    name?: string
    phone?: string
    address?: string
  }
  customerId?: string
  customerName?: string
  notes?: string
}

export interface CreateSaleItemData {
  productId: string
  quantity: number
  price: number
  discount?: number
}

export interface SaleWithRelations extends Sale {
  items: SaleItem[]
  user: {
    id: string
    name: string
    email: string
  }
  pointOfSale: {
    id: string
    name: string
  }
}

export interface SaleSummary {
  totalSales: number
  totalRevenue: number
  averageTicket: number
  salesByMethod: {
    method: string
    total: number
    count: number
  }[]
}
