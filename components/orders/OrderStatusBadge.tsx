import { cn } from "@/lib/utils"
import { OrderStatus } from "@/hooks/useOrders"

interface OrderStatusBadgeProps {
  status: OrderStatus
  className?: string
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Pendente",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  CONFIRMED: {
    label: "Confirmado",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  PREPARING: {
    label: "Em Preparação",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
  READY: {
    label: "Pronto",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  DELIVERED: {
    label: "Entregue",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
