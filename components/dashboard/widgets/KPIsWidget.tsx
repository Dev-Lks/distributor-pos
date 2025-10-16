"use client"

import { DollarSign, Receipt, AlertTriangle, Package, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useKPIs } from "@/hooks/useKPIs"

interface KPIItem {
  label: string
  value: string
  trend?: string
  trendDirection?: "up" | "down" | "neutral"
  icon: React.ComponentType<{ className?: string }>
}

export function KPIsWidget() {
  const { data: kpisData, isLoading, isError } = useKPIs()

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl" />
                <Skeleton className="h-3 w-12 sm:h-4 sm:w-16" />
              </div>
              <Skeleton className="h-3 w-20 sm:h-4 sm:w-24 mb-2" />
              <Skeleton className="h-6 w-24 sm:h-8 sm:w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (isError || !kpisData) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        <Card className="col-span-full">
          <CardContent className="p-4 sm:p-6 text-center text-muted-foreground">
            <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2" />
            <p className="text-xs sm:text-sm">Erro ao carregar KPIs</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const kpis: KPIItem[] = [
    {
      label: "Vendas Hoje",
      value: kpisData.salesToday.formatted,
      trend: kpisData.salesToday.trend?.formatted,
      trendDirection: kpisData.salesToday.trend?.direction,
      icon: DollarSign,
    },
    {
      label: "Ticket Médio",
      value: kpisData.averageTicket.formatted,
      trend: kpisData.averageTicket.trend?.formatted,
      trendDirection: kpisData.averageTicket.trend?.direction,
      icon: Receipt,
    },
    {
      label: "Estoque Baixo",
      value: kpisData.lowStockCount.formatted,
      trend: kpisData.lowStockCount.trend?.formatted,
      trendDirection: kpisData.lowStockCount.trend?.direction,
      icon: AlertTriangle,
    },
    {
      label: "Encomendas",
      value: kpisData.ordersCount.formatted,
      trend: kpisData.ordersCount.trend?.formatted,
      trendDirection: kpisData.ordersCount.trend?.direction,
      icon: Package,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        return (
          <Card
            key={kpi.label}
            className="cursor-pointer transition-all hover:shadow-md"
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-amber-500/10">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-400" />
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
                            <div className="mt-3 sm:mt-4">
                <p className="text-xs sm:text-sm text-muted-foreground">{kpi.label}</p>
                <p className="text-xl sm:text-2xl font-bold mt-1">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
