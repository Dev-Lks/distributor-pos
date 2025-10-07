"use client"

import { useRef, useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  overscanCount?: number
  onScroll?: (scrollOffset: number) => void
}

/**
 * Componente de lista virtualizada para otimizar renderização de listas grandes
 * Renderiza apenas os items visíveis na tela
 * 
 * NOTA: Esta é uma implementação simplificada. Para produção, considere usar react-window
 * quando a biblioteca tiver melhor suporte para React 19.
 * 
 * @param items - Array de items para renderizar
 * @param itemHeight - Altura fixa de cada item em pixels
 * @param renderItem - Função que renderiza cada item
 * @param className - Classes CSS adicionais
 * @param overscanCount - Número de items extra para renderizar fora da viewport (padrão: 3)
 */
export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  className,
  overscanCount = 3,
  onScroll,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(600)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height)
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    setScrollTop(target.scrollTop)
    onScroll?.(target.scrollTop)
  }, [onScroll])

  // Calcular range visível
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscanCount)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscanCount
  )

  const visibleItems = items.slice(startIndex, endIndex + 1)
  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent", className)}
      style={{ height: '100%', width: '100%' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              className="px-4"
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
