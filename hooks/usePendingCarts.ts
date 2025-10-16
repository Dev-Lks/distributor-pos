"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export type PendingCartItem = {
  id: string
  productId: string
  quantity: number
  price: number
  discount: number
  notes: string | null
  product?: {
    id: string
    name: string
    salePrice: number
  }
}

export type PendingCart = {
  id: string
  status: "ACTIVE" | "CONVERTED" | "CANCELLED" | "EXPIRED"
  pointOfSaleId: string | null
  createdById: string
  customerId: string | null
  expiresAt: string | null
  resumedAt: string | null
  discountValue: number
  serviceCharge: number
  subtotal: number
  total: number
  notes: string | null
  createdAt: string
  updatedAt: string
  items: PendingCartItem[]
  customer?: {
    id: string
    name: string
    phone: string | null
  } | null
  pointOfSale?: {
    id: string
    name: string
  } | null
}

export type CreatePendingCartInput = {
  pointOfSaleId?: string
  customerId?: string
  expiresAt?: string
  discountValue?: number
  serviceCharge?: number
  subtotal?: number
  total?: number
  notes?: string
  items: Array<{
    productId: string
    quantity: number
    price: number
    discount?: number
    notes?: string
  }>
}

export function usePendingCarts(pointOfSaleId?: string) {
  const queryClient = useQueryClient()
  const queryKey = ["pending-carts", pointOfSaleId]

  const cartsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams()
      if (pointOfSaleId) params.set("pointOfSaleId", pointOfSaleId)

      const response = await fetch(`/api/pending-carts?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Não foi possível carregar os carrinhos em espera")
      }

      const data = (await response.json()) as { data: PendingCart[] }
      return data.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (payload: CreatePendingCartInput) => {
      const response = await fetch("/api/pending-carts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? "Não foi possível estacionar o carrinho")
      }

      return (await response.json()) as PendingCart
    },
    onSuccess: () => {
      toast.success("Carrinho estacionado")
      void queryClient.invalidateQueries({ queryKey })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Falha ao estacionar carrinho"
      toast.error(message)
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async (cartId: string) => {
      const response = await fetch(`/api/pending-carts/${cartId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? "Não foi possível cancelar o carrinho")
      }
    },
    onSuccess: () => {
      toast.success("Carrinho cancelado")
      void queryClient.invalidateQueries({ queryKey })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Falha ao cancelar carrinho"
      toast.error(message)
    },
  })

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey })
  }

  return {
    carts: cartsQuery.data ?? [],
    isLoading: cartsQuery.isLoading,
    error: cartsQuery.error,
    refresh,
    createPendingCart: createMutation.mutateAsync,
    cancelPendingCart: cancelMutation.mutateAsync,
  }
}
