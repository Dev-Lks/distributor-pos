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
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => fetch('/api/products').then(res => res.json()),
    staleTime: 0, // Always refetch for instant updates
  })
}