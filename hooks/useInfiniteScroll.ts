import { useEffect, useRef, useCallback } from 'react'

interface InfiniteScrollOptions {
  onLoadMore: () => Promise<void>
  hasMore: boolean
  isLoading: boolean
  threshold?: number // pixels do fim para começar carregar
}

/**
 * Hook para implementar infinite scroll usando Intersection Observer
 * 
 * @param options - Configurações do infinite scroll
 * @returns Ref para o elemento observador (colocar no final da lista)
 */
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 200,
}: InfiniteScrollOptions) {
  const observerTarget = useRef<HTMLDivElement>(null)

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && hasMore && !isLoading) {
        onLoadMore()
      }
    },
    [hasMore, isLoading, onLoadMore]
  )

  useEffect(() => {
    const element = observerTarget.current
    if (!element) return

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0,
      rootMargin: `${threshold}px`,
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [handleObserver, threshold])

  return { observerTarget }
}
