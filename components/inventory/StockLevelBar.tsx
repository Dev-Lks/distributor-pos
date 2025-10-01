"use client"

import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface StockLevelBarProps {
  current: number
  min: number
  max?: number
  className?: string
}

export function StockLevelBar({ current, min, max = min * 3, className }: StockLevelBarProps) {
  const percentage = Math.min((current / max) * 100, 100)
  
  const getColor = () => {
    if (current === 0) return "bg-red-500"
    if (current <= min) return "bg-amber-500"
    return "bg-emerald-500"
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Estoque</span>
        <span className="font-medium">{current}</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full transition-all duration-300", getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
