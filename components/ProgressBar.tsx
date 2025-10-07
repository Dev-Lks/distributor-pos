'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function ProgressBar() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setIsLoading(true)
    setProgress(0)

    // Animação de progresso
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev
        return prev + Math.random() * 10
      })
    }, 100)

    const timeout = setTimeout(() => {
      setProgress(100)
      setTimeout(() => setIsLoading(false), 200)
      clearInterval(interval)
    }, 500)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [pathname])

  if (!isLoading) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1 bg-primary/20 z-[9999]"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
    >
      <div
        className="h-full bg-primary transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
