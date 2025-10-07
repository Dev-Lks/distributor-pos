"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { DashboardHeader, type DashboardPeriod } from "@/components/dashboard/DashboardHeader"
import { KPIsWidget } from "@/components/dashboard/widgets/KPIsWidget"
import { SalesChartWidget } from "@/components/dashboard/widgets/SalesChartWidget"
import { TopProductsWidget } from "@/components/dashboard/widgets/TopProductsWidget"
import { StockAlertsWidget } from "@/components/dashboard/widgets/StockAlertsWidget"
import { CashFlowWidget } from "@/components/dashboard/widgets/CashFlowWidget"
import { useSalesMetrics } from "@/lib/useSales"
import { useProducts } from "@/lib/useProducts"
import { useCashSession } from "@/lib/useCashSession"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { usePullToRefresh } from "@/lib/usePullToRefresh"
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator"
import { useQueryClient } from "@tanstack/react-query"

// Lazy load widgets menos críticos para melhorar performance inicial
const QuickInsightsWidget = dynamic(
  () => import("@/components/dashboard/widgets/QuickInsightsWidget").then(mod => ({ default: mod.QuickInsightsWidget })),
  { 
    loading: () => <WidgetSkeleton />,
    ssr: false,
  }
)

const CalendarWidget = dynamic(
  () => import("@/components/dashboard/widgets/CalendarWidget").then(mod => ({ default: mod.CalendarWidget })),
  { 
    loading: () => <WidgetSkeleton />,
    ssr: false,
  }
)

const TeamPerformanceWidget = dynamic(
  () => import("@/components/dashboard/widgets/TeamPerformanceWidget").then(mod => ({ default: mod.TeamPerformanceWidget })),
  { 
    loading: () => <WidgetSkeleton />,
    ssr: false,
  }
)

const RecentActivityWidget = dynamic(
  () => import("@/components/dashboard/widgets/RecentActivityWidget").then(mod => ({ default: mod.RecentActivityWidget })),
  { 
    loading: () => <WidgetSkeleton />,
    ssr: false,
  }
)

const RecentOrdersWidget = dynamic(
  () => import("@/components/dashboard/widgets/RecentOrdersWidget").then(mod => ({ default: mod.RecentOrdersWidget })),
  { 
    loading: () => <WidgetSkeleton />,
    ssr: false,
  }
)

// Skeleton component para widgets lazy loaded
function WidgetSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function NewDashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>("today")
  const queryClient = useQueryClient()
  
  const { data: metrics, isLoading: metricsLoading } = useSalesMetrics(period)
  const { data: products = [], isLoading: productsLoading } = useProducts()
  const { session: cashSession } = useCashSession()

  // Pull-to-Refresh
  const { isPulling, isRefreshing, progress, pullDistance } = usePullToRefresh({
    onRefresh: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sales"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
        queryClient.invalidateQueries({ queryKey: ["cashSession"] }),
      ])
    },
    threshold: 80,
  })

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

  if (metricsLoading || productsLoading) {
    return (
      <>
        <PullToRefreshIndicator
          isPulling={isPulling}
          isRefreshing={isRefreshing}
          progress={progress}
          pullDistance={pullDistance}
        />
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
      </>
    )
  }

  return (
    <>
      <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        progress={progress}
        pullDistance={pullDistance}
      />
      <div className="space-y-4 sm:space-y-6">
      {/* Header with Greeting & Quick Stats */}
      <DashboardHeader 
        period={period} 
        onPeriodChange={setPeriod}
        quickStats={quickStats}
      />

      {/* KPIs Grid - Agora com dados reais e trends */}
      <KPIsWidget />

      {/* Widgets Grid - Responsive Layout */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
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
    </>
  )
}
