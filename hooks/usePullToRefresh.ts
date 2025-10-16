import { useEffect, useRef, useState } from 'react'

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number // Distância mínima para trigger (px)
  resistance?: number // Resistência do pull (quanto maior, mais difícil puxar)
  enabled?: boolean
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  enabled = true,
}: PullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef(0)
  const currentY = useRef(0)
  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!enabled) return

    const element = document.documentElement

    const handleTouchStart = (e: TouchEvent) => {
      // Só ativa se estiver no topo da página
      if (window.scrollY === 0 && !isRefreshing) {
        startY.current = e.touches[0].clientY
        setIsPulling(true)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return

      currentY.current = e.touches[0].clientY
      const distance = currentY.current - startY.current

      if (distance > 0) {
        // Aplicar resistência para efeito elástico
        const adjustedDistance = Math.min(
          distance / resistance,
          threshold * 1.5
        )
        setPullDistance(adjustedDistance)

        // Prevenir scroll nativo se puxando pra baixo
        if (distance > 10) {
          e.preventDefault()
        }
      }
    }

    const handleTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true)
        
        // Feedback háptico
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }

        try {
          await onRefresh()
        } catch (error) {
          console.error('Pull to refresh error:', error)
        } finally {
          // Delay para UX (mostrar completado)
          setTimeout(() => {
            setIsRefreshing(false)
            setPullDistance(0)
          }, 500)
        }
      } else {
        setPullDistance(0)
      }
      setIsPulling(false)
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
    element.addEventListener('touchcancel', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [isPulling, isRefreshing, pullDistance, threshold, resistance, onRefresh, enabled])

  return {
    isPulling: isPulling && pullDistance > 0,
    isRefreshing,
    pullDistance,
    progress: Math.min(pullDistance / threshold, 1),
    containerRef,
  }
}
