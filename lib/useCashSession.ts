import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CashSessionSnapshot, CashTransactionTypeLiteral } from '@/types/cash'

// Tempos de cache otimizados
const CACHE_TIMES = {
  REALTIME: 1000 * 45,      // 45s - Dados de caixa atualizam frequentemente
}

interface OpenSessionPayload {
  openingAmount: number
  pointOfSaleId?: string
  notes?: string
}

interface CloseSessionPayload {
  sessionId: string
  closingAmount: number
  notes?: string
}

interface TransactionPayload {
  sessionId: string
  type: Exclude<CashTransactionTypeLiteral, 'OPENING'>
  amount: number
  description?: string
  paymentMethod?: string
}

const sessionQueryKey = (pointOfSaleId?: string) => ['cash-session', pointOfSaleId ?? 'default']

async function fetchCurrentSession(pointOfSaleId?: string): Promise<CashSessionSnapshot | null> {
  const params = new URLSearchParams()
  if (pointOfSaleId) {
    params.set('pointOfSaleId', pointOfSaleId)
  }

  const response = await fetch(`/api/cash-sessions/current${params.toString() ? `?${params.toString()}` : ''}`)
  if (response.status === 401) {
    throw new Error('Not authenticated')
  }

  if (!response.ok) {
    throw new Error('Failed to carregar sessão de caixa')
  }

  return (await response.json()) as CashSessionSnapshot | null
}

export function useCashSession(pointOfSaleId?: string) {
  const queryClient = useQueryClient()

  const query = useQuery<CashSessionSnapshot | null>({
    queryKey: sessionQueryKey(pointOfSaleId),
    queryFn: () => fetchCurrentSession(pointOfSaleId),
    refetchInterval: CACHE_TIMES.REALTIME,
    staleTime: CACHE_TIMES.REALTIME,
  })

  const openMutation = useMutation({
    mutationFn: async ({ openingAmount, pointOfSaleId, notes }: OpenSessionPayload) => {
      const response = await fetch('/api/cash-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openingAmount, pointOfSaleId, notes }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.details || error?.error || 'Falha ao abrir turno de caixa')
      }

      return (await response.json()) as CashSessionSnapshot
    },
    onSuccess: (snapshot) => {
      queryClient.setQueryData(sessionQueryKey(snapshot.pointOfSaleId ?? undefined), snapshot)
      queryClient.invalidateQueries({ queryKey: ['cash-sessions-history'] })
    },
  })

  const closeMutation = useMutation({
    mutationFn: async ({ sessionId, closingAmount, notes }: CloseSessionPayload) => {
      const response = await fetch(`/api/cash-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closingAmount, notes }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.details || error?.error || 'Falha ao fechar turno de caixa')
      }

      return (await response.json()) as CashSessionSnapshot
    },
    onSuccess: (snapshot) => {
      queryClient.setQueryData(sessionQueryKey(snapshot.pointOfSaleId ?? undefined), snapshot)
      queryClient.invalidateQueries({ queryKey: ['cash-sessions-history'] })
    },
  })

  const transactionMutation = useMutation({
    mutationFn: async ({ sessionId, type, amount, description, paymentMethod }: TransactionPayload) => {
      const response = await fetch(`/api/cash-sessions/${sessionId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, amount, description, paymentMethod }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.details || error?.error || 'Falha ao registrar movimento')
      }

      return (await response.json()) as CashSessionSnapshot
    },
    onSuccess: (snapshot) => {
      queryClient.setQueryData(sessionQueryKey(snapshot.pointOfSaleId ?? undefined), snapshot)
      queryClient.invalidateQueries({ queryKey: ['cash-sessions-history'] })
    },
  })

  return {
    session: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
    openSession: openMutation.mutateAsync,
    closeSession: closeMutation.mutateAsync,
    registerTransaction: transactionMutation.mutateAsync,
    isOpening: openMutation.isPending,
    isClosing: closeMutation.isPending,
    isRegisteringTransaction: transactionMutation.isPending,
    errors: {
      open: openMutation.error as Error | null,
      close: closeMutation.error as Error | null,
      transaction: transactionMutation.error as Error | null,
    },
  }
}
