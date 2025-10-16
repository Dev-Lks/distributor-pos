"use client"

import { useRef, useEffect, useState } from "react"

export interface SwipeGestureConfig {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number // Distância mínima em px para considerar swipe (padrão: 100)
  velocityThreshold?: number // Velocidade mínima (padrão: 0.3)
  enabled?: boolean
}

export interface SwipeGestureState {
  isSwiping: boolean
  swipeDirection: "left" | "right" | null
  swipeDistance: number
  swipeProgress: number // 0 a 1
}

export function useSwipeGesture(config: SwipeGestureConfig = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    threshold = 100,
    velocityThreshold = 0.3,
    enabled = true,
  } = config

  const [state, setState] = useState<SwipeGestureState>({
    isSwiping: false,
    swipeDirection: null,
    swipeDistance: 0,
    swipeProgress: 0,
  })

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const elementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!enabled) return

    const element = elementRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return

      const touch = e.touches[0]
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y

      // Só detecta swipe horizontal se movimento horizontal > vertical
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        e.preventDefault() // Previne scroll durante swipe

        const direction = deltaX > 0 ? "right" : "left"
        const distance = Math.abs(deltaX)
        const progress = Math.min(distance / threshold, 1)

        setState({
          isSwiping: true,
          swipeDirection: direction,
          swipeDistance: distance,
          swipeProgress: progress,
        })
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || !state.isSwiping) {
        touchStartRef.current = null
        setState({
          isSwiping: false,
          swipeDirection: null,
          swipeDistance: 0,
          swipeProgress: 0,
        })
        return
      }

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaTime = Date.now() - touchStartRef.current.time
      const velocity = Math.abs(deltaX) / deltaTime

      const distance = Math.abs(deltaX)
      const direction = deltaX > 0 ? "right" : "left"

      // Trigger callback se passou o threshold ou tem velocidade suficiente
      if (distance >= threshold || velocity >= velocityThreshold) {
        // Feedback háptico
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }

        if (direction === "left" && onSwipeLeft) {
          onSwipeLeft()
        } else if (direction === "right" && onSwipeRight) {
          onSwipeRight()
        }
      }

      // Reset state
      touchStartRef.current = null
      setState({
        isSwiping: false,
        swipeDirection: null,
        swipeDistance: 0,
        swipeProgress: 0,
      })
    }

    // Adiciona listeners
    element.addEventListener("touchstart", handleTouchStart, { passive: true })
    element.addEventListener("touchmove", handleTouchMove, { passive: false })
    element.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener("touchstart", handleTouchStart)
      element.removeEventListener("touchmove", handleTouchMove)
      element.removeEventListener("touchend", handleTouchEnd)
    }
  }, [enabled, threshold, velocityThreshold, onSwipeLeft, onSwipeRight, state.isSwiping])

  return {
    ...state,
    ref: elementRef,
  }
}
