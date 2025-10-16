import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { DeliveryDriver, CreateDeliveryDriverInput } from "@/types/delivery"

export const DELIVERY_DRIVERS_QUERY_KEY = ["delivery-drivers"] as const

// Hook para listar entregadores
export function useDeliveryDrivers(filters?: { activeOnly?: boolean; availableOnly?: boolean }) {
  const params = new URLSearchParams()
  if (filters?.activeOnly) params.set("activeOnly", "true")
  if (filters?.availableOnly) params.set("availableOnly", "true")

  return useQuery<DeliveryDriver[]>({
    queryKey: [...DELIVERY_DRIVERS_QUERY_KEY, filters],
    queryFn: async () => {
      const response = await fetch(`/api/delivery-drivers?${params.toString()}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao buscar entregadores")
      }
      return data
    },
    staleTime: 1000 * 60, // 1 minuto
  })
}

// Hook para buscar um entregador específico
export function useDeliveryDriver(id: string | null) {
  return useQuery<DeliveryDriver>({
    queryKey: [...DELIVERY_DRIVERS_QUERY_KEY, id],
    queryFn: async () => {
      if (!id) throw new Error("ID do entregador é obrigatório")
      const response = await fetch(`/api/delivery-drivers/${id}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao buscar entregador")
      }
      return data
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })
}

// Hook para criar entregador
export function useCreateDeliveryDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateDeliveryDriverInput) => {
      const response = await fetch("/api/delivery-drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao criar entregador")
      }
      return data as DeliveryDriver
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DELIVERY_DRIVERS_QUERY_KEY })
    },
  })
}

// Hook para atualizar entregador
export function useUpdateDeliveryDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateDeliveryDriverInput> & { id: string }) => {
      const response = await fetch(`/api/delivery-drivers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao atualizar entregador")
      }
      return data as DeliveryDriver
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: DELIVERY_DRIVERS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: [...DELIVERY_DRIVERS_QUERY_KEY, variables.id] })
    },
  })
}

// Hook para deletar entregador
export function useDeleteDeliveryDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/delivery-drivers/${id}`, {
        method: "DELETE",
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao deletar entregador")
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DELIVERY_DRIVERS_QUERY_KEY })
    },
  })
}

// Hook para alternar disponibilidade do entregador
export function useToggleDriverAvailability() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, isAvailable }: { id: string; isAvailable: boolean }) => {
      const response = await fetch(`/api/delivery-drivers/${id}/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao atualizar disponibilidade")
      }
      return data as DeliveryDriver
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: DELIVERY_DRIVERS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: [...DELIVERY_DRIVERS_QUERY_KEY, variables.id] })
    },
  })
}

// Hook para atualizar localização do entregador
export function useUpdateDriverLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, latitude, longitude }: { 
      id: string
      latitude: number
      longitude: number 
    }) => {
      const response = await fetch(`/api/delivery-drivers/${id}/location`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao atualizar localização")
      }
      return data as DeliveryDriver
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...DELIVERY_DRIVERS_QUERY_KEY, variables.id] })
    },
  })
}
