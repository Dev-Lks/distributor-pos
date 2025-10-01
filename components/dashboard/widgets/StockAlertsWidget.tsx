"use client"

import { AlertTriangle, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface StockAlert {
  product: string
  level: "critical" | "low"
  quantity: number
  location: string
}

interface StockAlertsWidgetProps {
  alerts?: StockAlert[]
}

export function StockAlertsWidget({ alerts: initialAlerts }: StockAlertsWidgetProps) {
  // Mock data
  const alerts: StockAlert[] = initialAlerts || [
    { product: "IPA Artesanal", level: "critical", quantity: 2, location: "PDV" },
    { product: "Pilsen Premium", level: "critical", quantity: 3, location: "Câmara Fria" },
    { product: "American Lager", level: "low", quantity: 8, location: "PDV" },
    { product: "Stout Imperial", level: "low", quantity: 6, location: "Casa" },
    { product: "Weiss Alemã", level: "low", quantity: 10, location: "PDV" },
  ]

  const criticalAlerts = alerts.filter((a) => a.level === "critical")
  const lowAlerts = alerts.filter((a) => a.level === "low")

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
          {alerts.map((alert) => (
            <div
              key={`${alert.product}-${alert.location}`}
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
                <p className="text-sm font-medium">{alert.product}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{alert.quantity} unidades</span>
                  <span>•</span>
                  <span>{alert.location}</span>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" className="mt-4 w-full">
          Ver Todos os Alertas
        </Button>
      </CardContent>
    </Card>
  )
}
