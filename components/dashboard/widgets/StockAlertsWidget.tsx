"use client"

import { AlertTriangle, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useStockAlerts } from "@/lib/useStockAlerts"
import { cn } from "@/lib/utils"
import Link from "next/link"

export function StockAlertsWidget() {
  const { data: alerts, isLoading } = useStockAlerts()

  const criticalAlerts = alerts?.filter((a) => a.level === "critical") || []
  const lowAlerts = alerts?.filter((a) => a.level === "low") || []

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Alertas de Estoque</CardTitle>
            <Skeleton className="h-6 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!alerts || alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Alertas de Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhum alerta no momento</p>
            <p className="text-xs text-muted-foreground">Todos os produtos estão com estoque adequado</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Alertas de Estoque</CardTitle>
          <Badge variant="destructive" className="h-6">
            {criticalAlerts.length} críticos
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.slice(0, 5).map((alert) => {
            const locationMap: Record<string, string> = {
              COLD_ROOM: 'Câmara Fria',
              HOUSE: 'Casa',
              SALE_POINT: 'PDV',
            }
            
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
                    "flex h-8 w-8 items-center justify-center rounded-full",
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
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.productName}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{alert.totalStock} unidades</span>
                    <span>•</span>
                    <span>{lowestLocation.name}: {lowestLocation.qty}</span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )
          })}
        </div>
        <Link href="/inventory">
          <Button variant="outline" className="mt-4 w-full">
            Ver Todos os Alertas
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
