import { cn } from "@/lib/utils"
import { OrderPriority } from "@/hooks/useOrders"
import { AlertCircle, ArrowDown, ArrowUp, Minus } from "lucide-react"

interface OrderPriorityBadgeProps {
  priority: OrderPriority
  className?: string
}

const priorityConfig: Record<OrderPriority, { label: string; className: string; icon: any }> = {
  LOW: {
    label: "Baixa",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    icon: ArrowDown,
  },
  MEDIUM: {
    label: "Média",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Minus,
  },
  HIGH: {
    label: "Alta",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    icon: ArrowUp,
  },
  URGENT: {
    label: "Urgente",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: AlertCircle,
  },
}

export function OrderPriorityBadge({ priority, className }: OrderPriorityBadgeProps) {
  const config = priorityConfig[priority]
  const Icon = config.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}
