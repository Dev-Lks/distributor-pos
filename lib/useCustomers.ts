import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export interface CustomerSummary {
  id: string
  name: string
  document: string | null
  phone: string | null
  address: string | null
  bonificationsCount: number
  createdAt: string
  updatedAt: string
}

export const CUSTOMERS_QUERY_KEY = ["customers"] as const

const buildCustomersUrl = (search?: string) => {
  const params = new URLSearchParams()
  if (search?.trim()) {
    params.set("search", search.trim())
  }
  const query = params.toString()
  return `/api/customers${query ? `?${query}` : ""}`
}

export function useCustomers(search?: string) {
  return useQuery<CustomerSummary[]>({
    queryKey: [...CUSTOMERS_QUERY_KEY, search?.trim() ?? ""],
    queryFn: async () => {
      const response = await fetch(buildCustomersUrl(search))
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao buscar clientes")
      }
      return data as CustomerSummary[]
    },
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string; document?: string | null; phone?: string | null; address?: string | null }) => {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao criar cliente")
      }
      return data as CustomerSummary
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      name?: string
      document?: string | null
      phone?: string | null
      address?: string | null
    }) => {
      const response = await fetch("/api/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao atualizar cliente")
      }
      return data as CustomerSummary
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY })
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch("/api/customers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao remover cliente")
      }
      return data as { success: boolean }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY })
    },
  })
}

// Hook para buscar clientes com termo de busca
export function useSearchCustomers(query?: string) {
  return useCustomers(query)
}

// Hook para buscar clientes recentes
export function useRecentCustomers(limit: number = 10) {
  return useQuery<CustomerSummary[]>({
    queryKey: [...CUSTOMERS_QUERY_KEY, "recent", limit],
    queryFn: async () => {
      const response = await fetch(`/api/customers?sort=lastPurchaseAt&limit=${limit}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao buscar clientes recentes")
      }
      return data as CustomerSummary[]
    },
    staleTime: 1000 * 60 * 2,
  })
}
