"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { StockLevelBar } from "./StockLevelBar"
import { LocationPills } from "./LocationPills"
import { ProductQuickActions } from "./ProductQuickActions"
import { cn } from "@/lib/utils"
import { AlertTriangle, Package } from "lucide-react"

interface ProductCardProps {
  product: any
  isSelected: boolean
  onSelect: (checked: boolean) => void
  onViewHistory: () => void
  onAddStock: () => void
  onTransfer: () => void
  className?: string
}

export function ProductCard({
  product,
  isSelected,
  onSelect,
  onViewHistory,
  onAddStock,
  onTransfer,
  className,
}: ProductCardProps) {
  const inv = product.inventory
  const totalStock = inv?.totalQuantity ?? 0
  const hasAlert = inv?.coldRoomAlert || inv?.houseAlert || inv?.salePointAlert
  
  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  })

  return (
    <Card className={cn("transition-all hover:shadow-md", isSelected && "ring-2 ring-primary", className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelect}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{product.name}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {product.category}
                  </Badge>
                  {product.size && (
                    <Badge variant="secondary" className="text-xs">
                      <Package className="mr-1 size-3" />
                      {product.size}
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {currencyFormatter.format(product.salePrice)}
                  </span>
                </div>
              </div>
            </div>
            <ProductQuickActions
              productId={product.id}
              productName={product.name}
              onViewHistory={onViewHistory}
              onAddStock={onAddStock}
              onTransfer={onTransfer}
            />
          </div>

          {/* Stock Level Bar */}
          <StockLevelBar
            current={totalStock}
            min={10}
            max={50}
          />

          {/* Location Pills */}
          <LocationPills
            coldRoom={inv?.coldRoomQuantity ?? 0}
            house={inv?.houseQuantity ?? 0}
            salePoint={inv?.salePointQuantity ?? 0}
            coldRoomAlert={inv?.coldRoomAlert}
            houseAlert={inv?.houseAlert}
            salePointAlert={inv?.salePointAlert}
          />

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {totalStock === 0 ? (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="size-3" />
                  Esgotado
                </Badge>
              ) : hasAlert ? (
                <Badge variant="secondary" className="gap-1 border-amber-500/50 bg-amber-500/10 text-amber-700">
                  <AlertTriangle className="size-3" />
                  Crítico
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 border-emerald-500/50 bg-emerald-500/10 text-emerald-700">
                  Saudável
                </Badge>
              )}
            </div>
            <span className="text-lg font-bold tabular-nums">{totalStock}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
