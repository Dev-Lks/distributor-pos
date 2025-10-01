import { useQuery } from '@tanstack/react-query'

export interface StockAlert {
  productId: string
  productName: string
  sku?: string | null
  totalStock: number
  minStock: number
  level: 'critical' | 'low'
  locations: {
    coldRoom: {
      quantity: number
      minStock: number
    }
    house: {
      quantity: number
      minStock: number
    }
    salePoint: {
      quantity: number
      minStock: number
    }
  }
}

export function useStockAlerts() {
  return useQuery<StockAlert[]>({
    queryKey: ['stock-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/stock-alerts')
      if (!res.ok) throw new Error('Failed to fetch stock alerts')
      return res.json()
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}
