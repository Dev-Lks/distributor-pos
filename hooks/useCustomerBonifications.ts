import type { BonificationCategory, RecipientType } from "@prisma/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { CustomerSummary } from "./useCustomers"

export interface CustomerBonificationEntry {
  id: string
  customerId: string | null
  recipientType: string
  companyName: string | null
  customer: Pick<CustomerSummary, "id" | "name" | "phone"> | null
  givenBy: string
  reason: string
  observation: string | null
  products: string[] | any[]
  itemsValue: string
  category: BonificationCategory
  bonifiedAt: string
  createdAt: string
  updatedAt: string
}

export const CUSTOMER_BONIFICATIONS_QUERY_KEY = ["customer-bonifications"] as const

const buildBonificationsUrl = (customerId?: string) => {
  const params = new URLSearchParams()
  if (customerId) {
    params.set("customerId", customerId)
  }
  const query = params.toString()
  return `/api/customer-bonifications${query ? `?${query}` : ""}`
}

export function useCustomerBonifications(customerId?: string) {
  return useQuery<CustomerBonificationEntry[]>({
    queryKey: [...CUSTOMER_BONIFICATIONS_QUERY_KEY, customerId ?? ""],
    queryFn: async () => {
      const response = await fetch(buildBonificationsUrl(customerId))
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao buscar bonificações")
      }
      return data as CustomerBonificationEntry[]
    },
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateCustomerBonification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      recipientType?: string
      customerId?: string | null
      companyName?: string | null
      givenBy: string
      reason: string
      observation?: string | null
      products?: any[]
      itemsValue?: number
      category?: BonificationCategory | string
      bonifiedAt?: string
    }) => {
      const response = await fetch("/api/customer-bonifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao criar bonificação")
      }
      return data as CustomerBonificationEntry
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_BONIFICATIONS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ["customers"] })
    },
  })
}

export function useUpdateCustomerBonification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      recipientType?: string
      customerId?: string | null
      companyName?: string | null
      givenBy?: string
      reason?: string
      observation?: string | null
      products?: any[]
      itemsValue?: number
      category?: BonificationCategory | string
      bonifiedAt?: string | null
    }) => {
      const response = await fetch("/api/customer-bonifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao atualizar bonificação")
      }
      return data as CustomerBonificationEntry
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_BONIFICATIONS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ["customers"] })
    },
  })
}

export function useDeleteCustomerBonification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch("/api/customer-bonifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao remover bonificação")
      }
      return data as { success: boolean }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_BONIFICATIONS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ["customers"] })
    },
  })
}
