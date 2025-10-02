"use client"

import { useState } from "react"
import { DashboardHeader, type DashboardPeriod } from "@/components/dashboard/DashboardHeader"
import { KPIsWidget } from "@/components/dashboard/widgets/KPIsWidget"
import { SalesChartWidget } from "@/components/dashboard/widgets/SalesChartWidget"
import { TopProductsWidget } from "@/components/dashboard/widgets/TopProductsWidget"
import { StockAlertsWidget } from "@/components/dashboard/widgets/StockAlertsWidget"
import { RecentOrdersWidget } from "@/components/dashboard/widgets/RecentOrdersWidget"
import { CashFlowWidget } from "@/components/dashboard/widgets/CashFlowWidget"
import { CalendarWidget } from "@/components/dashboard/widgets/CalendarWidget"
import { QuickInsightsWidget } from "@/components/dashboard/widgets/QuickInsightsWidget"
import { RecentActivityWidget } from "@/components/dashboard/widgets/RecentActivityWidget"
import { TeamPerformanceWidget } from "@/components/dashboard/widgets/TeamPerformanceWidget"
import { useSalesMetrics } from "@/lib/useSales"
import { useProducts } from "@/lib/useProducts"
import { useCashSession } from "@/lib/useCashSession"
import { Skeleton } from "@/components/ui/skeleton"

export default function NewDashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>("today")
  
  const { data: metrics, isLoading: metricsLoading } = useSalesMetrics(period)
  const { data: products = [], isLoading: productsLoading } = useProducts()
  const { session: cashSession } = useCashSession()

  // Format quick stats for header
  const formatDuration = (openedAt: string | Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(openedAt).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}min`
  }

  const quickStats = {
    sessionDuration: cashSession ? formatDuration(cashSession.openedAt) : undefined,
    todaySales: metrics?.netRevenue 
      ? `R$ ${metrics.netRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
      : undefined,
    alertsCount: products.filter(p => (p.inventory?.totalQuantity ?? 0) <= 10).length,
  }

  const kpiMetrics = {
    salesToday: metrics?.netRevenue 
      ? `R$ ${metrics.netRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
      : "R$ 0",
    averageTicket: metrics?.averageTicket
      ? `R$ ${metrics.averageTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
      : "R$ 0",
    lowStockCount: products.filter(p => (p.inventory?.totalQuantity ?? 0) <= 10 && (p.inventory?.totalQuantity ?? 0) > 0).length,
    ordersCount: 0, // TODO: Connect to orders when implemented
  }

  if (metricsLoading || productsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Greeting & Quick Stats */}
      <DashboardHeader 
        period={period} 
        onPeriodChange={setPeriod}
        quickStats={quickStats}
      />

      {/* KPIs Grid */}
      <KPIsWidget />

      {/* Widgets Grid - Responsive Layout */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Sales Chart - Takes 2 columns on large screens */}
        <div className="md:col-span-2">
          <SalesChartWidget />
        </div>

        {/* Top Products */}
        <TopProductsWidget />

        {/* Cash Flow */}
        <CashFlowWidget />

        {/* Stock Alerts */}
        <StockAlertsWidget />

        {/* Recent Orders */}
        <RecentOrdersWidget />

        {/* Calendar Widget */}
        <CalendarWidget />

        {/* Quick Insights */}
        <QuickInsightsWidget />

        {/* Recent Activity */}
        <RecentActivityWidget />

        {/* Team Performance */}
        <div className="md:col-span-2">
          <TeamPerformanceWidget />
        </div>
      </div>
    </div>
  )
}
