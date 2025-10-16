import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  Delivery,
  DeliveryWithRelations,
  DeliverySummary,
  CreateDeliveryInput,
  UpdateDeliveryInput,
  DeliveryStats,
  CalculateDeliveryFeeInput,
  CalculateDeliveryFeeResponse,
} from "@/types/delivery"

export const DELIVERIES_QUERY_KEY = ["deliveries"] as const

// Hook para listar deliveries
export function useDeliveries(filters?: {
  status?: string
  driverId?: string
  customerId?: string
  startDate?: string
  endDate?: string
}) {
  const params = new URLSearchParams()
  if (filters?.status) params.set("status", filters.status)
  if (filters?.driverId) params.set("driverId", filters.driverId)
  if (filters?.customerId) params.set("customerId", filters.customerId)
  if (filters?.startDate) params.set("startDate", filters.startDate)
  if (filters?.endDate) params.set("endDate", filters.endDate)

  return useQuery<DeliverySummary[]>({
    queryKey: [...DELIVERIES_QUERY_KEY, filters],
    queryFn: async () => {
      const response = await fetch(`/api/delivery?${params.toString()}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao buscar deliveries")
      }
      return data
    },
    staleTime: 1000 * 30, // 30 segundos
  })
}

// Hook para buscar um delivery específico
export function useDelivery(id: string | null) {
  return useQuery<DeliveryWithRelations>({
    queryKey: [...DELIVERIES_QUERY_KEY, id],
    queryFn: async () => {
      if (!id) throw new Error("ID do delivery é obrigatório")
      const response = await fetch(`/api/delivery/${id}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao buscar delivery")
      }
      return data
    },
    enabled: !!id,
    staleTime: 1000 * 30,
  })
}

// Hook para criar delivery
export function useCreateDelivery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateDeliveryInput) => {
      const response = await fetch("/api/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao criar delivery")
      }
      return data as Delivery
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DELIVERIES_QUERY_KEY })
    },
  })
}

// Hook para atualizar delivery
export function useUpdateDelivery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateDeliveryInput & { id: string }) => {
      const response = await fetch(`/api/delivery/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao atualizar delivery")
      }
      return data as Delivery
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: DELIVERIES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: [...DELIVERIES_QUERY_KEY, variables.id] })
    },
  })
}

// Hook para deletar delivery
export function useDeleteDelivery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/delivery/${id}`, {
        method: "DELETE",
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao deletar delivery")
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DELIVERIES_QUERY_KEY })
    },
  })
}

// Hook para calcular taxa de entrega
export function useCalculateDeliveryFee() {
  return useMutation({
    mutationFn: async (input: CalculateDeliveryFeeInput) => {
      const response = await fetch("/api/delivery/calculate-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao calcular taxa")
      }
      return data as CalculateDeliveryFeeResponse
    },
  })
}

// Hook para estatísticas de delivery
export function useDeliveryStats(startDate?: string, endDate?: string) {
  const params = new URLSearchParams()
  if (startDate) params.set("startDate", startDate)
  if (endDate) params.set("endDate", endDate)

  return useQuery<DeliveryStats>({
    queryKey: [...DELIVERIES_QUERY_KEY, "stats", startDate, endDate],
    queryFn: async () => {
      const response = await fetch(`/api/delivery/stats?${params.toString()}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao buscar estatísticas")
      }
      return data
    },
    staleTime: 1000 * 60, // 1 minuto
  })
}

// Hook para atualizar status do delivery
export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const response = await fetch(`/api/delivery/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao atualizar status")
      }
      return data as Delivery
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: DELIVERIES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: [...DELIVERIES_QUERY_KEY, variables.id] })
    },
  })
}
