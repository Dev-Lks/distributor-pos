import { useQuery } from '@tanstack/react-query'

export interface TeamMember {
  id: string
  name: string
  email: string
  avatar: string
  salesCount: number
  revenue: number
  rank: number
}

export function useTeamPerformance(period: 'today' | 'week' | 'month' = 'today') {
  return useQuery<TeamMember[]>({
    queryKey: ['team-performance', period],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/team-performance?period=${period}`)
      if (!res.ok) throw new Error('Failed to fetch team performance')
      return res.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}
