/**
 * Tipos relacionados a usuários do sistema
 */

export interface User {
  id: string
  email: string
  name: string
  fullName?: string
  phone?: string
  cpf?: string
  isAdmin: boolean
  status: UserStatus
  permissions: UserPermission[]
  createdAt: string | Date
  updatedAt: string | Date
  lastLoginAt?: string | Date | null
  userPointsOfSale?: Array<{
    id: string
    pointOfSaleId: string
  }>
  _count?: {
    salesCreated?: number
    cashSessions?: number
    inventoryMovements?: number
    ordersCreated?: number
  }
}

export interface UserPermission {
  id: string
  permission: string
  userId: string
}

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'

export interface CreateUserData {
  email: string
  name: string
  fullName?: string
  password: string
  phone?: string
  cpf?: string
  isAdmin: boolean
  permissions: string[]
}

export interface UpdateUserData {
  email?: string
  name?: string
  fullName?: string
  phone?: string
  cpf?: string
  isAdmin?: boolean
  status?: UserStatus
  permissions?: string[]
  password?: string
}

export interface UserWithStats extends User {
  salesTotal?: number
  lastSaleDate?: string | Date
}
