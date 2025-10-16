import { useQuery } from '@tanstack/react-query'

// Tempos de cache otimizados
const CACHE_TIMES = {
  MODERATE: 1000 * 60 * 5,  // 5min - Dados relativamente estáveis
}

export interface TopProduct {
  id: string
  name: string
  image?: string | null
  sold: number
  revenue: number
  trend: 'up' | 'down' | 'neutral'
  trendPercentage: number
}

export function useTopProducts(period: 'today' | 'week' | 'month' = 'today') {
  return useQuery<TopProduct[]>({
    queryKey: ['top-products', period],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/top-products?period=${period}`)
      if (!res.ok) throw new Error('Failed to fetch top products')
      return res.json()
    },
    staleTime: CACHE_TIMES.MODERATE,
  })
}
