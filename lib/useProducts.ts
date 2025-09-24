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
    coldRoomMinStock: number
    houseMinStock: number
    salePointMinStock: number
    coldRoomAlert?: boolean
    houseAlert?: boolean
    salePointAlert?: boolean
    totalQuantity?: number
  }
  productPointsOfSale?: {
    id: string
    quantity: number
    minStock: number
    pointOfSale: {
      id: string
      name: string
      isActive: boolean
    }
  }[]
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => fetch('/api/products').then(res => res.json()),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}