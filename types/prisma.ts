/**
 * Tipos para queries e filtros do Prisma
 */

import type { Prisma } from '@prisma/client'

// Where clauses comuns
export type OrderWhereInput = Prisma.OrderWhereInput
export type UserWhereInput = Prisma.UserWhereInput
export type InventoryMovementWhereInput = Prisma.InventoryMovementWhereInput
export type BatchWhereInput = Prisma.BatchWhereInput

// Update data types
export type OrderUpdateInput = Prisma.OrderUpdateInput
export type UserUpdateInput = Prisma.UserUpdateInput
export type InventoryMovementUpdateInput = Prisma.InventoryMovementUpdateInput

// Create data types
export type OrderCreateInput = Prisma.OrderCreateInput
export type UserCreateInput = Prisma.UserCreateInput
export type InventoryMovementCreateInput = Prisma.InventoryMovementCreateInput

// Include types
export type OrderInclude = Prisma.OrderInclude
export type UserInclude = Prisma.UserInclude
export type SaleInclude = Prisma.SaleInclude

// Result types
export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    items: true
    customer: true
    user: true
  }
}>

export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    permissions: true
    userPointsOfSale: true
  }
}>

export type SaleWithItems = Prisma.SaleGetPayload<{
  include: {
    items: {
      include: {
        product: true
      }
    }
    user: true
    pointOfSale: true
    customer: true
  }
}>

// Pagination helper
export interface PaginationParams {
  page?: number
  limit?: number
  skip?: number
  take?: number
}

// Query params helper
export interface QueryParams extends PaginationParams {
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, unknown>
}
