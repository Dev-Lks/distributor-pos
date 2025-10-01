"use client"

import Image from "next/image"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface TopProduct {
  name: string
  image?: string
  sold: number
  revenue: number
  trend: "up" | "down" | "neutral"
}

interface TopProductsWidgetProps {
  products?: TopProduct[]
}

export function TopProductsWidget({ products: initialProducts }: TopProductsWidgetProps) {
  // Mock data
  const products: TopProduct[] = initialProducts || [
    { name: "IPA Artesanal", image: "/placeholder-beer.jpg", sold: 48, revenue: 2400, trend: "up" },
    { name: "American Lager", image: "/placeholder-beer.jpg", sold: 42, revenue: 1890, trend: "up" },
    { name: "Pilsen Premium", image: "/placeholder-beer.jpg", sold: 38, revenue: 1824, trend: "neutral" },
    { name: "Stout Imperial", image: "/placeholder-beer.jpg", sold: 24, revenue: 1440, trend: "down" },
    { name: "Weiss Alemã", image: "/placeholder-beer.jpg", sold: 20, revenue: 1200, trend: "up" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Top Produtos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product, index) => (
            <div key={product.name} className="flex items-center gap-3">
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
