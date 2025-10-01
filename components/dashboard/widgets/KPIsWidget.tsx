"use client"

import { DollarSign, Receipt, AlertTriangle, Package, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KPIItem {
  label: string
  value: string
  trend?: string
  trendDirection?: "up" | "down" | "neutral"
  icon: React.ComponentType<{ className?: string }>
}

interface KPIsWidgetProps {
  metrics?: {
    salesToday?: string
    averageTicket?: string
    lowStockCount?: number
    ordersCount?: number
  }
}

export function KPIsWidget({ metrics }: KPIsWidgetProps) {
  const kpis: KPIItem[] = [
    {
      label: "Vendas Hoje",
      value: metrics?.salesToday || "R$ 0",
      trend: "+12%",
      trendDirection: "up",
      icon: DollarSign,
    },
    {
      label: "Ticket Médio",
      value: metrics?.averageTicket || "R$ 0",
      trend: "+5%",
      trendDirection: "up",
      icon: Receipt,
    },
    {
      label: "Estoque Baixo",
      value: String(metrics?.lowStockCount || 0),
      trend: "-2",
      trendDirection: "down",
      icon: AlertTriangle,
    },
    {
      label: "Encomendas",
      value: String(metrics?.ordersCount || 0),
      trend: "+4",
      trendDirection: "up",
      icon: Package,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        return (
          <Card
            key={kpi.label}
            className="cursor-pointer transition-all hover:shadow-md"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                  <Icon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                {kpi.trend && (
                  <div
                    className={cn(
                      "flex items-center gap-1 text-sm font-medium",
                      kpi.trendDirection === "up" && "text-emerald-600 dark:text-emerald-400",
                      kpi.trendDirection === "down" && "text-red-600 dark:text-red-400",
                      kpi.trendDirection === "neutral" && "text-muted-foreground"
                    )}
                  >
                    {kpi.trendDirection === "up" && <TrendingUp className="h-4 w-4" />}
                    {kpi.trendDirection === "down" && <TrendingDown className="h-4 w-4" />}
                    <span>{kpi.trend}</span>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-muted-foreground">{kpi.label}</h3>
                <p className="mt-1 text-2xl font-bold">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
