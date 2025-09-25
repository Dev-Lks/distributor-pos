import { useQuery } from '@tanstack/react-query'

export interface Product {
  id: string
  name: string
  size: string
  cost: number
  salePrice: number
  isBonified: boolean
  bonifications: number
  category?: string
  supplier?: string
  isActive: boolean
  sku?: string
  brand?: string
  origin?: string
  packaging?: string
  abv?: number
  ibu?: number
  shelfLifeDays?: number
  tags?: string[]
  lastPurchaseCost?: number | null
  lastPurchaseAt?: string | null
  avgCost?: number | null
  priceLastUpdatedAt?: string | null
  inventory?: {
    coldRoomQuantity: number
    houseQuantity: number
    salePointQuantity: number
    coldRoomMinStock: number
    houseMinStock: number
    salePointMinStock: number
    coldRoomAlert?: boolean
    houseAlert?: boolean
    salePointAlert?: boolean
    totalQuantity?: number
    reservedQuantity?: number
    damagedQuantity?: number
    inTransitQuantity?: number
    safetyStock?: number | null
    reorderLeadTimeDays?: number | null
    lastRestockedAt?: string | null
    lastAuditedAt?: string | null
    averageDailyConsumption?: number | null
    turnoverDays?: number | null
  }
  productPointsOfSale?: Array<{
    id: string
    productId: string
    pointOfSaleId: string
    quantity: number
    minStock: number
    pointOfSale?: {
      id: string
      name: string
      isActive: boolean
    }
  }>
}

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetch('/api/products')
      if (!response.ok) throw new Error('Failed to fetch products')
      return (await response.json()) as Product[]
    },
    staleTime: 0, // Always refetch for instant updates
  })
}