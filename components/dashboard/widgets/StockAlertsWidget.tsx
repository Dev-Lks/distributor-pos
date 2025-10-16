"use client"

import { AlertTriangle, ArrowRight, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useStockAlerts } from "@/hooks/useStockAlerts"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { WidgetWrapper } from "@/components/dashboard/WidgetWrapper"

export function StockAlertsWidget() {
  const { data: alerts, isLoading, error, refetch } = useStockAlerts()

  const criticalAlerts = alerts?.filter((a) => a.level === "critical") || []

  const headerActions = alerts && alerts.length > 0 ? (
    <Badge variant="destructive" className="h-6">
      {criticalAlerts.length} críticos
    </Badge>
  ) : null

  const emptyIcon = (
    <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
      <Package className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
    </div>
  )

  return (
    <WidgetWrapper
      title="Alertas de Estoque"
      isLoading={isLoading}
      isError={!!error}
      error={error}
      onRefetch={refetch}
      isEmpty={!alerts || alerts.length === 0}
      emptyMessage="Todos os produtos estão com estoque adequado"
      emptyIcon={emptyIcon}
      headerActions={headerActions}
    >
      <div className="space-y-3 max-h-[320px] md:max-h-[380px] overflow-y-auto pr-2 relative">
        {alerts?.slice(0, 10).map((alert) => {
          // Determinar qual localização tem menor estoque
          const locations = [
            { name: 'Câmara Fria', qty: alert.locations.coldRoom.quantity },
            { name: 'Casa', qty: alert.locations.house.quantity },
            { name: 'PDV', qty: alert.locations.salePoint.quantity },
          ].sort((a, b) => a.qty - b.qty)
          
          const lowestLocation = locations[0]

          return (
            <Link
              href={`/products?id=${alert.productId}`}
              key={alert.productId}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50",
                alert.level === "critical" && "border-red-500/50 bg-red-500/5"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full shrink-0",
                  alert.level === "critical"
                    ? "bg-red-500/10"
                    : "bg-amber-500/10"
                )}
              >
                <AlertTriangle
                  className={cn(
                    "h-4 w-4",
                    alert.level === "critical"
                      ? "text-red-600 dark:text-red-400"
                      : "text-amber-600 dark:text-amber-400"
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{alert.productName}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span>{alert.totalStock} unidades</span>
                  <span>•</span>
                  <span className="truncate">{lowestLocation.name}: {lowestLocation.qty}</span>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )
        })}
      </div>
      
      {alerts && alerts.length > 0 && (
        <Link href="/inventory" className="block mt-4">
          <Button variant="outline" className="w-full">
            Ver Todos os Alertas
          </Button>
        </Link>
      )}
    </WidgetWrapper>
  )
}
