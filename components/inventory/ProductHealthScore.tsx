"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface ProductHealthScoreProps {
  score: number
  trend?: "up" | "down" | "stable"
  className?: string
}

export function ProductHealthScore({ score, trend, className }: ProductHealthScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400"
    if (score >= 50) return "text-amber-600 dark:text-amber-400"
    return "text-red-600 dark:text-red-400"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excelente"
    if (score >= 50) return "Bom"
    if (score >= 30) return "Regular"
    return "Crítico"
  }

  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp className="size-3" />
    if (trend === "down") return <TrendingDown className="size-3" />
    return <Minus className="size-3" />
  }

  const getTrendColor = () => {
    if (trend === "up") return "text-emerald-600"
    if (trend === "down") return "text-red-600"
    return "text-muted-foreground"
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        <span className={cn("text-2xl font-bold tabular-nums", getScoreColor(score))}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <Badge variant="outline" className="h-5 px-1.5 text-xs">
          {getScoreLabel(score)}
        </Badge>
        {trend && (
          <div className={cn("flex items-center gap-0.5", getTrendColor())}>
            {getTrendIcon()}
          </div>
        )}
      </div>
    </div>
  )
}
