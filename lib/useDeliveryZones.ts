import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { DeliveryZone, CreateDeliveryZoneInput } from "@/types/delivery"

export const DELIVERY_ZONES_QUERY_KEY = ["delivery-zones"] as const

// Hook para listar zonas de entrega
export function useDeliveryZones(activeOnly = false) {
  return useQuery<DeliveryZone[]>({
    queryKey: [...DELIVERY_ZONES_QUERY_KEY, activeOnly],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (activeOnly) params.set("activeOnly", "true")
      
      const response = await fetch(`/api/delivery-zones?${params.toString()}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao buscar zonas de entrega")
      }
      return data
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// Hook para buscar uma zona específica
export function useDeliveryZone(id: string | null) {
  return useQuery<DeliveryZone>({
    queryKey: [...DELIVERY_ZONES_QUERY_KEY, id],
    queryFn: async () => {
      if (!id) throw new Error("ID da zona é obrigatório")
      const response = await fetch(`/api/delivery-zones/${id}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao buscar zona")
      }
      return data
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

// Hook para criar zona
export function useCreateDeliveryZone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateDeliveryZoneInput) => {
      const response = await fetch("/api/delivery-zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao criar zona")
      }
      return data as DeliveryZone
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DELIVERY_ZONES_QUERY_KEY })
    },
  })
}

// Hook para atualizar zona
export function useUpdateDeliveryZone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateDeliveryZoneInput> & { id: string }) => {
      const response = await fetch(`/api/delivery-zones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao atualizar zona")
      }
      return data as DeliveryZone
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: DELIVERY_ZONES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: [...DELIVERY_ZONES_QUERY_KEY, variables.id] })
    },
  })
}

// Hook para deletar zona
export function useDeleteDeliveryZone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/delivery-zones/${id}`, {
        method: "DELETE",
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao deletar zona")
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DELIVERY_ZONES_QUERY_KEY })
    },
  })
}

// Hook para detectar zona por coordenadas
export function useDetectDeliveryZone() {
  return useMutation({
    mutationFn: async ({ latitude, longitude, postalCode }: { 
      latitude?: number
      longitude?: number
      postalCode?: string 
    }) => {
      const params = new URLSearchParams()
      if (latitude) params.set("latitude", latitude.toString())
      if (longitude) params.set("longitude", longitude.toString())
      if (postalCode) params.set("postalCode", postalCode)
      
      const response = await fetch(`/api/delivery-zones/detect?${params.toString()}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao detectar zona")
      }
      return data as DeliveryZone | null
    },
  })
}
