import { useQuery } from '@tanstack/react-query'

export interface Product {
  id: string
  name: string
  size: string
  cost: number
  salePrice: number
  isBonified: boolean
  inventory?: {
    quantity: number
    minStock: number
    alert?: boolean
  }
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => fetch('/api/products').then(res => res.json()),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}