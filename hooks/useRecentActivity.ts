import { useQuery } from '@tanstack/react-query'

// Tempos de cache otimizados
const CACHE_TIMES = {
  REALTIME: 1000 * 60,      // 60s - Dados que mudam frequentemente
}

export interface Activity {
  id: string
  type: 'sale' | 'inventory' | 'cash' | 'order'
  description: string
  userName: string
  userAvatar: string
  timestamp: string
  relatedId?: string
}

export function useRecentActivity(limit: number = 10) {
  return useQuery<Activity[]>({
    queryKey: ['recent-activity', limit],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/recent-activity?limit=${limit}`)
      if (!res.ok) throw new Error('Failed to fetch activity')
      return res.json()
    },
    refetchInterval: CACHE_TIMES.REALTIME,
    staleTime: CACHE_TIMES.REALTIME,
  })
}
