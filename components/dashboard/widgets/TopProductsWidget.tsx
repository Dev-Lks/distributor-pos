"use client"

import Image from "next/image"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useTopProducts } from "@/lib/useTopProducts"
import { cn } from "@/lib/utils"

interface TopProductsWidgetProps {
  period?: 'today' | 'week' | 'month'
}

export function TopProductsWidget({ period = 'today' }: TopProductsWidgetProps) {
  const { data: products, isLoading } = useTopProducts(period)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Top Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!products || products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Top Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhum produto vendido ainda</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Top Produtos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product, index) => (
            <div key={product.id} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-sm font-bold text-amber-600 dark:text-amber-400">
                #{index + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{product.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{product.sold} vendidos</span>
                  <span>•</span>
                  <span>R$ {product.revenue.toFixed(2)}</span>
                </div>
              </div>
              <div>
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
      </CardContent>
    </Card>
  )
}
