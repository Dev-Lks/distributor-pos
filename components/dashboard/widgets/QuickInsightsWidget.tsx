"use client"

import { Lightbulb, TrendingUp, AlertTriangle, Users, ArrowRight, Package } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useStockAlerts } from "@/lib/useStockAlerts"
import { useTopProducts } from "@/lib/useTopProducts"
import { useOrders } from "@/lib/useOrders"

interface Insight {
  icon: any
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
  type: "info" | "warning" | "success"
}

const typeColors = {
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
}

export function QuickInsightsWidget() {
  const { data: stockAlerts, isLoading: loadingStock } = useStockAlerts()
  const { data: topProducts, isLoading: loadingProducts } = useTopProducts()
  const { data: orders, isLoading: loadingOrders } = useOrders()

  const isLoading = loadingStock || loadingProducts || loadingOrders

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg font-semibold">Insights Inteligentes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Generate dynamic insights from real data
  const insights: Insight[] = []

  // Insight 1: Top performing product
  if (topProducts && topProducts.length > 0) {
    const topProduct = topProducts[0]
    if (topProduct.sold > 5) {
      insights.push({
        icon: TrendingUp,
        title: `${topProduct.name} está vendendo bem`,
        description: `${topProduct.sold} unidades vendidas recentemente`,
        type: "success",
        action: { label: "Ver detalhes", href: "/dashboard/products" },
      })
    }
  }

  // Insight 2: Low stock alerts
  const criticalAlerts = stockAlerts?.filter(alert => alert.level === 'critical') || []
  const lowAlerts = stockAlerts?.filter(alert => alert.level === 'low') || []
  
  if (criticalAlerts.length > 0) {
    insights.push({
      icon: AlertTriangle,
      title: `${criticalAlerts.length} produto${criticalAlerts.length > 1 ? 's' : ''} em estoque crítico`,
      description: "É necessário reabastecer urgentemente",
      type: "warning",
      action: { label: "Ver estoque", href: "/inventory" },
    })
  } else if (lowAlerts.length > 0) {
    insights.push({
      icon: Package,
      title: `${lowAlerts.length} produto${lowAlerts.length > 1 ? 's' : ''} com estoque baixo`,
      description: "Considere reabastecer em breve",
      type: "warning",
      action: { label: "Ver estoque", href: "/inventory" },
    })
  }

  // Insight 3: Pending orders
  const pendingOrders = orders?.filter(order => order.status === 'PENDING') || []
  if (pendingOrders.length > 0) {
    insights.push({
      icon: AlertTriangle,
      title: `${pendingOrders.length} pedido${pendingOrders.length > 1 ? 's' : ''} pendente${pendingOrders.length > 1 ? 's' : ''}`,
      description: "Atenda os pedidos para melhorar a experiência",
      type: "info",
      action: { label: "Ver pedidos", href: "/dashboard/orders" },
    })
  }

  // Insight 4: Product variety (if top products show concentration)
  if (topProducts && topProducts.length > 0) {
    const totalSales = topProducts.reduce((sum, p) => sum + p.revenue, 0)
    const topProductShare = topProducts[0].revenue / totalSales
    
    if (topProductShare > 0.5) {
      insights.push({
        icon: TrendingUp,
        title: "Receita concentrada em poucos produtos",
        description: `${topProducts[0].name} representa ${Math.round(topProductShare * 100)}% das vendas`,
        type: "info",
      })
    }
  }

  // Default message if no insights
  if (insights.length === 0) {
    insights.push({
      icon: Lightbulb,
      title: "Tudo funcionando bem!",
      description: "Não há alertas ou insights importantes no momento",
      type: "success",
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-lg font-semibold">Insights Inteligentes</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.slice(0, 4).map((insight, index) => {
            const Icon = insight.icon
            return (
              <div
                key={index}
                className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start gap-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", typeColors[insight.type])}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold">{insight.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">{insight.description}</p>
                    {insight.action && (
                      <Button variant="link" size="sm" className="mt-2 h-auto p-0 text-xs" asChild>
                        <a href={insight.action.href}>
                          {insight.action.label}
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
