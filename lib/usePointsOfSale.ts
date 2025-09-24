import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface PointOfSale {
  id: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function usePointsOfSale() {
  return useQuery({
    queryKey: ['points-of-sale'],
    queryFn: async () => {
      const res = await fetch('/api/points')
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch points of sale')
      }
      return data
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useCreatePointOfSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; isActive?: boolean }) => {
      const res = await fetch('/api/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || 'Failed to create point of sale')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['points-of-sale'] })
    },
  })
}

export function useUpdatePointOfSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { id: string; name?: string; isActive?: boolean }) => {
      const res = await fetch('/api/points', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || 'Failed to update point of sale')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['points-of-sale'] })
    },
  })
}

export function useDeletePointOfSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/points?id=${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || 'Failed to delete point of sale')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['points-of-sale'] })
    },
  })
}