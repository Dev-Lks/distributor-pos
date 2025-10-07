"use client"

import { Order } from "@/lib/useOrders"
import { OrderStatusBadge } from "./OrderStatusBadge"
import { OrderPriorityBadge } from "./OrderPriorityBadge"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Package, Calendar, Phone, MapPin, Clock } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface OrderCardProps {
  order: Order
  className?: string
}

export function OrderCard({ order, className }: OrderCardProps) {
  const promisedDate = order.promisedAt ? new Date(order.promisedAt) : null
  const now = new Date()
  const isOverdue = promisedDate && promisedDate < now && order.status !== "DELIVERED" && order.status !== "CANCELLED"
  
  const daysRemaining = promisedDate
    ? Math.ceil((promisedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Link
      href={`/dashboard/orders/${order.id}`}
      className={cn(
        "block rounded-lg border bg-card p-3 sm:p-4 shadow-sm transition-all duration-150 hover:shadow-md active:scale-[0.98] active:shadow-sm",
        isOverdue && "border-red-300 dark:border-red-800",
        className
      )}
    >
      {/* Header */}
      <div className="mb-2 sm:mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base sm:text-lg truncate">{order.orderNumber}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{order.customerName}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <OrderStatusBadge status={order.status} />
          <OrderPriorityBadge priority={order.priority} />
        </div>
      </div>

      {/* Items Preview */}
      <div className="mb-2 sm:mb-3 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
        <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
        <span>
          {order.items.length} {order.items.length === 1 ? "item" : "itens"}
        </span>
        <span className="mx-1">•</span>
        <span className="font-medium text-foreground">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: 0,
          }).format(order.total)}
        </span>
      </div>

      {/* Info */}
      <div className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm">
        {order.customerPhone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
            <span className="truncate">{order.customerPhone}</span>
          </div>
        )}

        {order.customerAddress && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
            <span className="line-clamp-1">{order.customerAddress}</span>
          </div>
        )}

        {promisedDate && (
          <div className={cn(
            "flex items-center gap-2",
            isOverdue ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"
          )}>
            <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
            <span className="truncate">
              {promisedDate.toLocaleDateString("pt-BR")}
              {daysRemaining !== null && (
                <span className="ml-1">
                  ({daysRemaining > 0 ? `em ${daysRemaining}d` : isOverdue ? "atrasado" : "hoje"})
                </span>
              )}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
          <span className="truncate">
            {formatDistanceToNow(new Date(order.orderedAt), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
        </div>
      </div>

      {/* Balance Due */}
      {order.balanceDue > 0 && (
        <div className="mt-3 rounded-md bg-amber-50 dark:bg-amber-900/20 p-2 text-sm">
          <span className="text-muted-foreground">Saldo: </span>
          <span className="font-semibold text-amber-700 dark:text-amber-400">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(order.balanceDue)}
          </span>
        </div>
      )}
    </Link>
  )
}
