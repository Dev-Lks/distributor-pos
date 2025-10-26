import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

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
        // Se há detalhes de erro, mostrar campo por campo
        if (result.details && Array.isArray(result.details)) {
          const messages = result.details
            .map((d: { field?: string; message?: string }) => `• ${d.field || 'Campo'}: ${d.message || 'Erro desconhecido'}`)
            .join('\n')
          throw new Error(`${result.error}\n\n${messages}`)
        }
        throw new Error(result.error || 'Falha ao criar alocação de produto')
      }
      return result
    },
    onSuccess: () => {
      toast.success('Alocação criada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['product-points-of-sale'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (error: Error) => {
      toast.error(error.message, { duration: 5000 })
    }
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
        if (result.details && Array.isArray(result.details)) {
          const messages = result.details
            .map((d: { field?: string; message?: string }) => `• ${d.field || 'Campo'}: ${d.message || 'Erro desconhecido'}`)
            .join('\n')
          throw new Error(`${result.error}\n\n${messages}`)
        }
        throw new Error(result.error || 'Falha ao atualizar alocação')
      }
      return result
    },
    onSuccess: () => {
      toast.success('Alocação atualizada!')
      queryClient.invalidateQueries({ queryKey: ['product-points-of-sale'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (error: Error) => {
      toast.error(error.message, { duration: 5000 })
    }
  })
}

export function useDeleteProductPointOfSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/product-points-of-sale?id=${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (!res.ok) {
        if (result.details && Array.isArray(result.details)) {
          const messages = result.details
            .map((d: { field?: string; message?: string }) => `• ${d.field || 'Campo'}: ${d.message || 'Erro desconhecido'}`)
            .join('\n')
          throw new Error(`${result.error}\n\n${messages}`)
        }
        throw new Error(result.error || 'Falha ao remover alocação')
      }
      return result
    },
    onSuccess: () => {
      toast.success('Alocação removida com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['product-points-of-sale'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (error: Error) => {
      toast.error(error.message, { duration: 5000 })
    }
  })
}