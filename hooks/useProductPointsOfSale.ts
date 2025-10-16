import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface ProductPointOfSale {
  id: string
  productId: string
  pointOfSaleId: string
  quantity: number
  minStock: number
  product: {
    id: string
    name: string
    sku?: string
  }
  pointOfSale: {
    id: string
    name: string
    isActive: boolean
  }
}

export function useProductPointsOfSale() {
  return useQuery({
    queryKey: ['product-points-of-sale'],
    queryFn: () => fetch('/api/product-points-of-sale').then(res => res.json()),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useCreateProductPointOfSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { productId: string; pointOfSaleId: string; quantity?: number; minStock?: number }) => {
      const res = await fetch('/api/product-points-of-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || 'Failed to create product point of sale')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-points-of-sale'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useUpdateProductPointOfSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { id: string; quantity: number; minStock: number }) => {
      const res = await fetch('/api/product-points-of-sale', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || 'Failed to update product point of sale')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-points-of-sale'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useDeleteProductPointOfSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/product-points-of-sale?id=${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || 'Failed to delete product point of sale')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-points-of-sale'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}