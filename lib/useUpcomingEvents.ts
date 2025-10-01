import { useQuery } from '@tanstack/react-query'

export interface UpcomingEvent {
  id: string
  date: string
  type: 'order' | 'audit' | 'delivery' | 'report'
  title: string
  priority: 'high' | 'medium' | 'low'
  relatedId?: string | null
  status?: string
  daysUntil?: number
}

export function useUpcomingEvents(days: number = 7) {
  return useQuery<UpcomingEvent[]>({
    queryKey: ['upcoming-events', days],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/upcoming-events?days=${days}`)
      if (!res.ok) throw new Error('Failed to fetch events')
      return res.json()
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  })
}
