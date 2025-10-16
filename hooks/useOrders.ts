import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED"
export type OrderPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"
export type PaymentStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED"

export interface OrderItem {
  id: string
  productId: string
  product: {
    id: string
    name: string
    size: string
    image?: string | null
  }
  quantity: number
  unitPrice: number
  discount: number
  subtotal: number
  customizations?: Record<string, any> | null
  notes?: string | null
  status: string
}

export interface Order {
  id: string
  orderNumber: string
  customerId?: string | null
  customer?: {
    id: string
    name: string
    phone: string | null
    email: string | null
  } | null
  customerName: string
  customerPhone: string
  customerEmail?: string | null
  customerAddress?: string | null
  status: OrderStatus
  priority: OrderPriority
  orderedAt: string
  confirmedAt?: string | null
  promisedAt?: string | null
  readyAt?: string | null
  deliveredAt?: string | null
  cancelledAt?: string | null
  subtotal: number
  discountValue: number
  deliveryFee: number
  total: number
  depositPaid: number
  balanceDue: number
  paymentStatus: PaymentStatus
  items: OrderItem[]
  notes?: string | null
  internalNotes?: string | null
  specialRequests?: string | null
  statusHistory?: any
  notifications?: any
  createdBy?: string | null
  assignedTo?: string | null
  source?: string | null
  pointOfSaleId?: string | null
  pointOfSale?: {
    id: string
    name: string
  } | null
  createdAt: string
  updatedAt: string
}

export interface CreateOrderInput {
  customerId?: string | null
  customerName: string
  customerPhone: string
  customerEmail?: string | null
  customerAddress?: string | null
  priority?: OrderPriority
  promisedAt?: string | null
  notes?: string | null
  specialRequests?: string | null
  deliveryFee?: number
  discountValue?: number
  depositPaid?: number
  source?: string | null
  pointOfSaleId?: string | null
  items: {
    productId: string
    quantity: number
    unitPrice: number
    discount?: number
    customizations?: Record<string, any>
    notes?: string | null
  }[]
}

export interface UpdateOrderInput {
  id: string
  customerId?: string | null
  customerName?: string
  customerPhone?: string
  customerEmail?: string | null
  customerAddress?: string | null
  priority?: OrderPriority
  promisedAt?: string | null
  notes?: string | null
  internalNotes?: string | null
  specialRequests?: string | null
  deliveryFee?: number
  discountValue?: number
  depositPaid?: number
  assignedTo?: string | null
}

export interface UpdateOrderStatusInput {
  id: string
  status: OrderStatus
  notes?: string
}

export const ORDERS_QUERY_KEY = ["orders"] as const

const buildOrdersUrl = (filters?: {
  status?: OrderStatus | OrderStatus[]
  priority?: OrderPriority | OrderPriority[]
  customerId?: string
  search?: string
  startDate?: string
  endDate?: string
}) => {
  const params = new URLSearchParams()
  
  if (filters?.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
    statuses.forEach(s => params.append("status", s))
  }
  
  if (filters?.priority) {
    const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority]
    priorities.forEach(p => params.append("priority", p))
  }
  
  if (filters?.customerId) params.set("customerId", filters.customerId)
  if (filters?.search?.trim()) params.set("search", filters.search.trim())
  if (filters?.startDate) params.set("startDate", filters.startDate)
  if (filters?.endDate) params.set("endDate", filters.endDate)
  
  const query = params.toString()
  return `/api/orders${query ? `?${query}` : ""}`
}

export function useOrders(filters?: {
  status?: OrderStatus | OrderStatus[]
  priority?: OrderPriority | OrderPriority[]
  customerId?: string
  search?: string
  startDate?: string
  endDate?: string
}) {
  return useQuery<Order[]>({
    queryKey: [...ORDERS_QUERY_KEY, filters],
    queryFn: async () => {
      const response = await fetch(buildOrdersUrl(filters))
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao buscar encomendas")
      }
      return data as Order[]
    },
    staleTime: 1000 * 30, // 30 seconds
  })
}

export function useOrder(id: string | null) {
  return useQuery<Order>({
    queryKey: [...ORDERS_QUERY_KEY, id],
    queryFn: async () => {
      if (!id) throw new Error("ID da encomenda é obrigatório")
      const response = await fetch(`/api/orders/${id}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao buscar encomenda")
      }
      return data as Order
    },
    enabled: !!id,
    staleTime: 1000 * 30,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao criar encomenda")
      }
      return data as Order
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY })
    },
  })
}

export function useUpdateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateOrderInput) => {
      const response = await fetch(`/api/orders/${input.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao atualizar encomenda")
      }
      return data as Order
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: [...ORDERS_QUERY_KEY, data.id] })
    },
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateOrderStatusInput) => {
      const response = await fetch(`/api/orders/${input.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: input.status, notes: input.notes }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao atualizar status")
      }
      return data as Order
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: [...ORDERS_QUERY_KEY, data.id] })
    },
  })
}

export function useDeleteOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/orders/${id}`, {
        method: "DELETE",
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao deletar encomenda")
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY })
    },
  })
}

// Hook para estatísticas do dashboard
export function useOrderStats() {
  return useQuery<{
    totalOrders: number
    pendingOrders: number
    confirmedOrders: number
    preparingOrders: number
    readyOrders: number
    deliveredOrders: number
    cancelledOrders: number
    overdueOrders: number
    totalRevenue: number
    avgOrderValue: number
    avgLeadTime: number
    onTimeDeliveryRate: number
  }>({
    queryKey: ["orderStats"],
    queryFn: async () => {
      const response = await fetch("/api/orders/stats")
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao buscar estatísticas")
      }
      return data
    },
    staleTime: 1000 * 60, // 1 minute
  })
}
