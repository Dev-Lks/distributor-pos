"use client"

import { Clock, Package, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useOrders } from "@/lib/useOrders"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { differenceInDays, format, isPast } from "date-fns"
import { ptBR } from "date-fns/locale"

const statusConfig = {
  PENDING: { label: "Pendente", color: "bg-gray-500/10 text-gray-600 dark:text-gray-400" },
  CONFIRMED: { label: "Confirmado", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  PREPARING: { label: "Preparando", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  READY: { label: "Pronto", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  DELIVERED: { label: "Entregue", color: "bg-green-500/10 text-green-600 dark:text-green-400" },
  CANCELLED: { label: "Cancelado", color: "bg-red-500/10 text-red-600 dark:text-red-400" },
}

export function RecentOrdersWidget() {
  const { data: allOrders, isLoading } = useOrders()
  
  // Filtrar encomendas ativas e pegar as 5 mais recentes
  const orders = allOrders
    ?.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status))
    .slice(0, 5) || []

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Encomendas Recentes</CardTitle>
            <Skeleton className="h-5 w-8" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                <Skeleton className="h-10 w-10 rounded-full" />
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

  if (!orders || orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Encomendas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma encomenda ativa</p>
          </div>
        </CardContent>
      </Card>
    )
  }

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
            const promisedDate = order.promisedAt ? new Date(order.promisedAt) : null
            const daysRemaining = promisedDate ? differenceInDays(promisedDate, new Date()) : null
            const isUrgent = daysRemaining !== null && daysRemaining <= 2 && daysRemaining >= 0

            return (
              <Link
                href={`/orders/${order.id}`}
                key={order.id}
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
                  <p className="mt-1 text-xs text-muted-foreground">{order.customerName}</p>
                  {promisedDate && (
                    <div className="mt-2 flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      <span
                        className={cn(
                          isUrgent && "font-medium text-amber-600 dark:text-amber-400",
                          daysRemaining === 0 && "font-medium text-emerald-600 dark:text-emerald-400",
                          daysRemaining !== null && daysRemaining < 0 && "font-medium text-red-600 dark:text-red-400"
                        )}
                      >
                        {daysRemaining === 0
                          ? "Hoje"
                          : daysRemaining === 1
                          ? "Amanhã"
                          : daysRemaining && daysRemaining < 0
                          ? `Atrasado ${Math.abs(daysRemaining)} dia(s)`
                          : `${daysRemaining} dias`}
                      </span>
                    </div>
                  )}
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )
          })}
        </div>
        <Link href="/orders">
          <Button variant="outline" className="mt-4 w-full">
            Ver Todas as Encomendas
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
