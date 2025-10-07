"use client"

import { useEffect, useState } from 'react'

interface UseLazyImageOptions {
  src: string
  placeholder?: string
  threshold?: number
  rootMargin?: string
}

/**
 * Hook para lazy loading de imagens usando Intersection Observer
 * 
 * @param options - Configurações do lazy loading
 * @returns { src, isLoaded } - Source da imagem e status de carregamento
 */
export function useLazyImage({
  src,
  placeholder = '/placeholder.jpg',
  threshold = 0.1,
  rootMargin = '50px',
}: UseLazyImageOptions) {
  const [imageSrc, setImageSrc] = useState(placeholder)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const img = new Image()
    img.src = src

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          img.onload = () => {
            setImageSrc(src)
            setIsLoaded(true)
          }
          observer.disconnect()
        }
      },
      { threshold, rootMargin }
    )

    const element = document.createElement('div')
    observer.observe(element)

    return () => observer.disconnect()
  }, [src, threshold, rootMargin])

  return { src: imageSrc, isLoaded }
}
