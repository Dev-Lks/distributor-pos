/**
 * Tipos para formulários
 */

export interface UserFormData {
  name: string
  email: string
  password?: string
  isAdmin: boolean
  permissions: string[]
}

export interface ProductFormData {
  name: string
  sku: string
  price: number
  stock: number
  category?: string
  description?: string
  minStock?: number
}

export interface PointOfSaleFormData {
  name: string
  location?: string
  isActive: boolean
}

export interface CustomerFormData {
  name: string
  email?: string
  phone?: string
  address?: string
  cpf?: string
}

export interface SaleFormData {
  customerId?: string
  customerName?: string
  pointOfSaleId: string
  paymentMethod: string
  items: SaleItemFormData[]
  discount?: number
  notes?: string
}

export interface SaleItemFormData {
  productId: string
  productName: string
  quantity: number
  price: number
  discount?: number
}

export interface InventoryFormData {
  productId: string
  quantity: number
  type: 'IN' | 'OUT' | 'ADJUSTMENT'
  reason?: string
  notes?: string
}
