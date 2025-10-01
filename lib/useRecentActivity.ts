import { useQuery } from '@tanstack/react-query'

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
    refetchInterval: 1000 * 30, // Refetch a cada 30s
    staleTime: 1000 * 15, // 15 segundos
  })
}
