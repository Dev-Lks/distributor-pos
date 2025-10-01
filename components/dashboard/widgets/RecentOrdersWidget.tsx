"use client"

import { Clock, Package, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Order {
  orderNumber: string
  customer: string
  status: "pending" | "confirmed" | "preparing" | "ready"
  promisedDate: Date
  daysRemaining: number
}

interface RecentOrdersWidgetProps {
  orders?: Order[]
}

const statusConfig = {
  pending: { label: "Pendente", color: "bg-gray-500/10 text-gray-600 dark:text-gray-400" },
  confirmed: { label: "Confirmado", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  preparing: { label: "Preparando", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  ready: { label: "Pronto", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
}

export function RecentOrdersWidget({ orders: initialOrders }: RecentOrdersWidgetProps) {
  // Mock data
  const orders: Order[] = initialOrders || [
    {
      orderNumber: "ENC-2025-001",
      customer: "João Silva",
      status: "preparing",
      promisedDate: new Date("2025-10-05"),
      daysRemaining: 4,
    },
    {
      orderNumber: "ENC-2025-002",
      customer: "Maria Santos",
      status: "confirmed",
      promisedDate: new Date("2025-10-08"),
      daysRemaining: 7,
    },
    {
      orderNumber: "ENC-2025-003",
      customer: "Pedro Costa",
      status: "ready",
      promisedDate: new Date("2025-10-01"),
      daysRemaining: 0,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Encomendas Recentes</CardTitle>
          <Badge variant="secondary">{orders.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {orders.map((order) => {
            const config = statusConfig[order.status]
            const isUrgent = order.daysRemaining <= 2

            return (
              <div
                key={order.orderNumber}
                className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                  <Package className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{order.orderNumber}</p>
                    <Badge className={cn("h-5 text-xs", config.color)}>{config.label}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{order.customer}</p>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    <span
                      className={cn(
                        isUrgent && order.daysRemaining > 0 && "font-medium text-amber-600 dark:text-amber-400",
                        order.daysRemaining === 0 && "font-medium text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {order.daysRemaining === 0
                        ? "Hoje"
                        : order.daysRemaining === 1
                        ? "Amanhã"
                        : `${order.daysRemaining} dias`}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </div>
        <Button variant="outline" className="mt-4 w-full">
          Ver Todas as Encomendas
        </Button>
      </CardContent>
    </Card>
  )
}
