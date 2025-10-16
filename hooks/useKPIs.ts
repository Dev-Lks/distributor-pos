import { useQuery } from '@tanstack/react-query'

// Tempos de cache otimizados
const CACHE_TIMES = {
  REALTIME: 1000 * 60, // 1min - Dados em tempo real
}

interface KPITrend {
  value: string
  direction: 'up' | 'down' | 'neutral'
  formatted: string
}

interface KPIMetric {
  value: number
  formatted: string
  trend: KPITrend | null
}

export interface KPIsData {
  salesToday: KPIMetric
  averageTicket: KPIMetric
  lowStockCount: KPIMetric
  ordersCount: KPIMetric
}

export function useKPIs() {
  return useQuery<KPIsData>({
    queryKey: ['kpis'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/kpis')
      if (!res.ok) throw new Error('Failed to fetch KPIs')
      return res.json()
    },
    staleTime: CACHE_TIMES.REALTIME,
    refetchInterval: CACHE_TIMES.REALTIME, // Auto-refresh a cada 1min
  })
}
