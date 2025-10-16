"use client"

import { TrendingUp, TrendingDown, Minus, Package } from "lucide-react"
import { useTopProducts } from "@/hooks/useTopProducts"
import { WidgetWrapper } from "@/components/dashboard/WidgetWrapper"

interface TopProductsWidgetProps {
  period?: 'today' | 'week' | 'month'
}

export function TopProductsWidget({ period = 'today' }: TopProductsWidgetProps) {
  const { data: products, isLoading, error, refetch } = useTopProducts(period)

  const emptyIcon = (
    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-3">
      <Package className="h-8 w-8 text-muted-foreground/50" />
    </div>
  )

  return (
    <WidgetWrapper
      title="Top Produtos"
      isLoading={isLoading}
      isError={!!error}
      error={error}
      onRefetch={refetch}
      isEmpty={!products || products.length === 0}
      emptyMessage="Nenhum produto vendido ainda"
      emptyIcon={emptyIcon}
    >
      <div className="space-y-4 max-h-[320px] md:max-h-[380px] overflow-y-auto pr-2">
        {products?.map((product, index) => (
          <div key={product.id} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-sm font-bold text-amber-600 dark:text-amber-400 shrink-0">
              #{index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{product.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <span>{product.sold} vendidos</span>
                <span>•</span>
                <span>R$ {product.revenue.toFixed(2)}</span>
              </div>
            </div>
            <div className="shrink-0">
              {product.trend === "up" && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
                  <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              )}
              {product.trend === "down" && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
              )}
              {product.trend === "neutral" && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-500/10">
                  <Minus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  )
}
