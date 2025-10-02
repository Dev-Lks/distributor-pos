"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Eye,
  Edit,
  Plus,
  Minus,
  History,
  BarChart,
  MoreHorizontal,
  Store,
} from "lucide-react"

interface ProductQuickActionsProps {
  productId: string
  productName: string
  onViewDetails?: () => void
  onEdit?: () => void
  onTransfer?: () => void
  onAddStock?: () => void
  onAdjust?: () => void
  onViewHistory?: () => void
  onViewAnalytics?: () => void
}

export function ProductQuickActions({
  productId,
  productName,
  onViewDetails,
  onEdit,
  onTransfer,
  onAddStock,
  onAdjust,
  onViewHistory,
  onViewAnalytics,
}: ProductQuickActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger 
        className="inline-flex h-8 w-8 items-center justify-center rounded-md p-0 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        onClick={(e) => e.stopPropagation()}
      >
        <MoreHorizontal className="size-4" />
        <span className="sr-only">Abrir menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="font-semibold">{productName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {onViewDetails && (
          <DropdownMenuItem onClick={onViewDetails}>
            <Eye className="mr-2 size-4" />
            Ver detalhes
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="mr-2 size-4" />
            Editar produto
          </DropdownMenuItem>
        )}
        {onTransfer && (
          <DropdownMenuItem onClick={onTransfer}>
            <Store className="mr-2 size-4" />
            Transferir para PDVs
          </DropdownMenuItem>
        )}
        {onAddStock && (
          <DropdownMenuItem onClick={onAddStock}>
            <Plus className="mr-2 size-4" />
            Adicionar estoque
          </DropdownMenuItem>
        )}
        {onAdjust && (
          <DropdownMenuItem onClick={onAdjust}>
            <Minus className="mr-2 size-4" />
            Ajustar (perda/dano)
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {onViewHistory && (
          <DropdownMenuItem onClick={onViewHistory}>
            <History className="mr-2 size-4" />
            Ver histórico
          </DropdownMenuItem>
        )}
        {onViewAnalytics && (
          <DropdownMenuItem onClick={onViewAnalytics}>
            <BarChart className="mr-2 size-4" />
            Ver analytics
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
