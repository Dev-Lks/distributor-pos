"use client"

import { useInfiniteScroll } from '@/lib/useInfiniteScroll'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InfiniteScrollListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  onLoadMore: () => Promise<void>
  hasMore: boolean
  isLoading: boolean
  className?: string
  emptyMessage?: string
}

/**
 * Componente de lista com infinite scroll
 * Carrega mais items automaticamente quando o usuário chega perto do fim
 * 
 * @param items - Array de items para renderizar
 * @param renderItem - Função que renderiza cada item
 * @param onLoadMore - Função assíncrona para carregar mais items
 * @param hasMore - Se há mais items para carregar
 * @param isLoading - Se está carregando no momento
 */
export function InfiniteScrollList<T>({
  items,
  renderItem,
  onLoadMore,
  hasMore,
  isLoading,
  className,
  emptyMessage = "Nenhum item encontrado",
}: InfiniteScrollListProps<T>) {
  const { observerTarget } = useInfiniteScroll({
    onLoadMore,
    hasMore,
    isLoading,
    threshold: 200,
  })

  return (
    <div className={cn("space-y-4", className)}>
      {items.length === 0 && !isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          {emptyMessage}
        </div>
      )}

      {items.map((item, index) => (
        <div key={index}>{renderItem(item, index)}</div>
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {/* Intersection observer target */}
      <div ref={observerTarget} className="h-4" />

      {/* End message */}
      {!hasMore && items.length > 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          Não há mais itens para carregar
        </div>
      )}
    </div>
  )
}
