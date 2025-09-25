"use client"

import type { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type KpiTone = "emerald" | "blue" | "orange" | "violet" | "slate"

export interface DashboardKpiItem {
  id: string
  label: string
  value: string
  description?: string
  icon: LucideIcon
  tone?: KpiTone
  hint?: string
  status?: {
    label: string
    intent?: "positive" | "negative" | "neutral"
  }
}

interface DashboardKpiGridProps {
  items: DashboardKpiItem[]
  compact?: boolean
}

const toneStyles: Record<KpiTone, { icon: string; badge: string }> = {
  emerald: {
    icon: "text-emerald-600 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/25",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
  },
  blue: {
    icon: "text-sky-600 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/25",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
  },
  orange: {
    icon: "text-amber-600 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/25",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
  },
  violet: {
    icon: "text-violet-600 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/25",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
  },
  slate: {
    icon: "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/25",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300"
  }
}

function getToneStyles(tone?: KpiTone) {
  return toneStyles[tone ?? "slate"]
}

export function DashboardKpiGrid({ items, compact = false }: DashboardKpiGridProps) {
  return (
    <div className={cn("grid gap-4", compact ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-4")}> 
      {items.map((item) => {
        const Icon = item.icon
        const tone = getToneStyles(item.tone)
        return (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
                  {item.label}
                </p>
                <p className={cn("font-semibold", compact ? "text-2xl" : "text-3xl")}>{item.value}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                )}
                {item.status && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "w-fit text-xs font-medium",
                      tone.badge,
                      item.status.intent === "positive" && "border border-green-200 dark:border-green-800/50",
                      item.status.intent === "negative" && "border border-red-200 dark:border-red-800/50",
                      item.status.intent === "neutral" && "border border-slate-200 dark:border-slate-800/50"
                    )}
                  >
                    {item.status.label}
                  </Badge>
                )}
                {!item.status && item.hint && (
                  <p className="text-xs text-muted-foreground/80">{item.hint}</p>
                )}
              </div>
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full border border-transparent",
                  tone.icon
                )}
                aria-hidden
              >
                <Icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
