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
  inventory?: {
    coldRoomQuantity: number
    houseQuantity: number
    salePointQuantity: number
    point1Quantity: number
    point2Quantity: number
    point3Quantity: number
    coldRoomMinStock: number
    houseMinStock: number
    salePointMinStock: number
    point1MinStock: number
    point2MinStock: number
    point3MinStock: number
    coldRoomAlert?: boolean
    houseAlert?: boolean
    salePointAlert?: boolean
    point1Alert?: boolean
    point2Alert?: boolean
    point3Alert?: boolean
    totalQuantity?: number
  }
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => fetch('/api/products').then(res => res.json()),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}