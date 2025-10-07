"use client"

import { useEffect, useRef, useState } from 'react'

interface LazySectionProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  rootMargin?: string
  className?: string
}

/**
 * Componente que carrega seu conteúdo lazy (sob demanda) usando Intersection Observer
 * Útil para componentes pesados que estão abaixo da dobra
 * 
 * @param children - Conteúdo a ser carregado lazy
 * @param fallback - Componente de placeholder enquanto não está visível
 * @param rootMargin - Margem para começar a carregar antes de ficar visível (padrão: 100px)
 */
export function LazySection({
  children,
  fallback = <div className="animate-pulse bg-muted rounded h-96" />,
  rootMargin = '100px',
  className,
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [rootMargin])

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : fallback}
    </div>
  )
}
