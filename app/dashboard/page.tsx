"use client"

import type { FormEvent } from "react"
import { useMemo, useState } from "react"
import { AlertTriangle, Activity, DollarSign, Package, ShoppingCart, Users } from "lucide-react"

import { SidebarLayout } from "@/components/SidebarLayout"
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DashboardCharts } from "@/components/dashboard/DashboardCharts"
import { DashboardFilters } from "@/components/dashboard/DashboardFilters"
import { DashboardHeader, type DashboardPeriod } from "@/components/dashboard/DashboardHeader"
import { DashboardKpiGrid, type DashboardKpiItem } from "@/components/dashboard/DashboardKpiGrid"
import { DashboardLoading } from "@/components/dashboard/DashboardLoading"
import { SalesHistory } from "@/components/dashboard/SalesHistory"
import { StockAlerts } from "@/components/dashboard/StockAlerts"
import { SupportActions } from "@/components/dashboard/SupportActions"
import { TopProductsTable } from "@/components/dashboard/TopProductsTable"
import { useProducts, type Product } from "@/lib/useProducts"
import { useSales, useSalesMetrics } from "@/lib/useSales"
import { exportSalesToCSV, exportSalesToXLSX } from "@/lib/salesDB"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
})

const compactCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1
})

const numberFormatter = new Intl.NumberFormat("pt-BR")

type ChartTab = "resumo" | "produtos" | "tendencias"

const periodFriendlyLabel: Record<DashboardPeriod, string> = {
  today: "de hoje",
  week: "da semana",
  month: "do mês",
  year: "do ano"
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

function formatCompactCurrency(value: number) {
  return compactCurrencyFormatter.format(value)
}

function formatNumber(value: number) {
  return numberFormatter.format(value)
}

function OverviewDashboard() {
  const [period, setPeriod] = useState<DashboardPeriod>("today")
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const [activeChartTab, setActiveChartTab] = useState<ChartTab>("resumo")

  const { data: metrics, isLoading: metricsLoading } = useSalesMetrics(period)
  const { data: products = [], isLoading: productsLoading } = useProducts()
  const { sales = [], salesLoading, cancelSale } = useSales()

  const safeMetrics = useMemo(
    () => ({
      totalRevenue: metrics?.totalToday ?? 0,
      salesCount: metrics?.salesCount ?? 0,
      hourlyData: metrics?.hourlyData ?? [],
      topProducts: metrics?.topProducts ?? []
    }),
    [metrics]
  )

  const inventorySummary = useMemo(() => {
    const totalProducts = products.length
    const totalQuantity = products.reduce((sum, product) => sum + (product.inventory?.totalQuantity ?? 0), 0)
    const lowStock = products.filter((product) => {
      const quantity = product.inventory?.totalQuantity ?? 0
      return quantity > 0 && quantity <= 10
    }).length
    const outOfStock = products.filter((product) => (product.inventory?.totalQuantity ?? 0) === 0).length
    const inventoryValue = products.reduce((sum, product) => {
      const quantity = product.inventory?.totalQuantity ?? 0
      return sum + quantity * product.salePrice
    }, 0)
    const bonifications = products.reduce((sum, product) => sum + (product.bonifications ?? 0), 0)
    const activeProducts = products.filter((product) => (product.inventory?.totalQuantity ?? 0) > 0).length

    return {
      totalProducts,
      totalQuantity,
      lowStock,
      outOfStock,
      inventoryValue,
      bonifications,
      activeProducts
    }
  }, [products])

  const averageTicket = useMemo(() => {
    return safeMetrics.salesCount > 0 ? safeMetrics.totalRevenue / safeMetrics.salesCount : 0
  }, [safeMetrics])

  const filteredSales = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const normalizedDate = dateFilter ? new Date(dateFilter).toDateString() : ""

    return sales
      .filter((sale) => {
        const matchesSearch =
          normalizedSearch === "" ||
          sale.customerName?.toLowerCase().includes(normalizedSearch) ||
          sale.items.some((item) => item.product?.name?.toLowerCase().includes(normalizedSearch))

        const matchesPayment = paymentFilter === "all" || sale.paymentMethod === paymentFilter

        const matchesDate =
          normalizedDate === "" || new Date(sale.date).toDateString() === normalizedDate

        return matchesSearch && matchesPayment && matchesDate
      })
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [sales, searchTerm, paymentFilter, dateFilter])

  const stockDistribution = useMemo(
    () => {
      const healthy = Math.max(inventorySummary.totalProducts - inventorySummary.lowStock - inventorySummary.outOfStock, 0)
      return [
        { name: "Estoque saudável", value: healthy, color: "#10b981" },
        { name: "Estoque baixo", value: inventorySummary.lowStock, color: "#f59e0b" },
        { name: "Esgotado", value: inventorySummary.outOfStock, color: "#ef4444" }
      ].filter((slice) => slice.value > 0)
    },
    [inventorySummary]
  )

  const categorySummary = useMemo(() => {
    const summary = new Map<string, number>()

    products.forEach((product: Product) => {
      if (!product.category) return
      const value = (product.inventory?.totalQuantity ?? 0) * product.salePrice
      summary.set(product.category, (summary.get(product.category) ?? 0) + value)
    })

    return Array.from(summary.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [products])

  const performanceHighlights = useMemo(
    () =>
      [
        {
          id: "sales-count",
          label: "Vendas registradas",
          value: `${safeMetrics.salesCount}`,
          description: `No período selecionado (${periodFriendlyLabel[period]})`,
          tone: safeMetrics.salesCount > 0 ? "positive" : "neutral"
        },
        {
          id: "average-ticket",
          label: "Ticket médio",
          value: formatCurrency(averageTicket),
          description: "Em pedidos concluídos",
          tone: "neutral"
        },
        {
          id: "active-products",
          label: "Produtos ativos",
          value: `${inventorySummary.activeProducts}`,
          description: "Com estoque disponível",
          tone: inventorySummary.activeProducts === 0 ? "warning" : "positive"
        }
      ] satisfies Array<{
        id: string
        label: string
        value: string
        description: string
        tone?: "positive" | "neutral" | "warning"
      }>,
    [averageTicket, inventorySummary.activeProducts, period, safeMetrics.salesCount]
  )

  const topProductsWithMargin = useMemo(
    () =>
      safeMetrics.topProducts.map((productMetric) => {
        const productData = products.find((product) => product.name === productMetric.name)
        const margin =
          productData && productData.salePrice > 0
            ? ((productData.salePrice - (productData.cost ?? 0)) / productData.salePrice) * 100
            : null

        return {
          name: productMetric.name,
          unitsSold: productMetric.count,
          revenue: productMetric.revenue,
          margin
        }
      }),
    [products, safeMetrics.topProducts]
  )

  const kpiItems = useMemo<DashboardKpiItem[]>(
    () => [
      {
        id: "period-revenue",
        label: `Receita ${periodFriendlyLabel[period]}`,
        value: formatCurrency(safeMetrics.totalRevenue),
        icon: DollarSign,
        tone: "emerald",
        status:
          safeMetrics.salesCount > 0
            ? { label: `${safeMetrics.salesCount} venda${safeMetrics.salesCount === 1 ? "" : "s"}`, intent: "positive" }
            : { label: "Sem vendas", intent: "neutral" }
      },
      {
        id: "sales-count",
        label: "Vendas registradas",
        value: `${safeMetrics.salesCount}`,
        icon: ShoppingCart,
        tone: "blue",
        hint: period === "today" ? "Atualiza a cada 5 minutos" : "Total do período"
      },
      {
        id: "average-ticket",
        label: "Ticket médio",
        value: formatCurrency(averageTicket),
        icon: Activity,
        tone: "violet",
        description: "Valor médio por pedido"
      },
      {
        id: "inventory-value",
        label: "Valor em estoque",
        value: formatCompactCurrency(inventorySummary.inventoryValue),
        icon: Package,
        tone: "orange",
        description: `${formatNumber(inventorySummary.totalQuantity)} unidades disponíveis`
      }
    ],
    [averageTicket, inventorySummary.inventoryValue, inventorySummary.totalQuantity, period, safeMetrics]
  )

  const operationalKpis = useMemo<DashboardKpiItem[]>(
    () => [
      {
        id: "total-products",
        label: "Produtos cadastrados",
        value: `${inventorySummary.totalProducts}`,
        icon: Package,
        tone: "slate",
        description: `${formatNumber(inventorySummary.totalQuantity)} unidades em estoque`
      },
      {
        id: "low-stock",
        label: "Estoque crítico",
        value: `${inventorySummary.lowStock}`,
        icon: AlertTriangle,
        tone: "orange",
        status:
          inventorySummary.lowStock > 0
            ? { label: "Repor em breve", intent: "negative" }
            : { label: "Sem alertas", intent: "positive" },
        hint:
          inventorySummary.outOfStock > 0
            ? `${inventorySummary.outOfStock} esgotado${inventorySummary.outOfStock === 1 ? "" : "s"}`
            : undefined
      },
      {
        id: "bonifications",
        label: "Bonificações",
        value: `${inventorySummary.bonifications}`,
        icon: Users,
        tone: "blue",
        description: "Disponíveis para fidelizar clientes"
      }
    ],
    [inventorySummary]
  )

  const initialLoading = (metricsLoading && !metrics) || (productsLoading && products.length === 0)

  const handleClearFilters = () => {
    setSearchTerm("")
    setPaymentFilter("all")
    setDateFilter("")
  }

  return (
    <div className="space-y-6">
      <DashboardHeader period={period} onPeriodChange={setPeriod} />

      <DashboardFilters
        searchTerm={searchTerm}
        paymentFilter={paymentFilter}
        dateFilter={dateFilter}
        onSearchChange={setSearchTerm}
        onPaymentChange={setPaymentFilter}
        onDateChange={setDateFilter}
        onClear={handleClearFilters}
      />

      {initialLoading ? (
        <DashboardLoading />
      ) : (
        <>
          <DashboardKpiGrid items={kpiItems} />
          <DashboardKpiGrid items={operationalKpis} compact />
          <StockAlerts
            lowStockCount={inventorySummary.lowStock}
            outOfStockCount={inventorySummary.outOfStock}
          />
          <DashboardCharts
            period={period}
            activeTab={activeChartTab}
            onTabChange={setActiveChartTab}
            hourlyData={safeMetrics.hourlyData}
            topProducts={safeMetrics.topProducts}
            stockDistribution={stockDistribution}
            categorySummary={categorySummary}
            performanceHighlights={performanceHighlights}
          />
        </>
      )}

      <SalesHistory
        sales={filteredSales}
        isLoading={salesLoading}
        onCancel={cancelSale}
      />

      <TopProductsTable products={topProductsWithMargin} />

      <SupportActions
        onExportCsv={exportSalesToCSV}
        onExportXlsx={exportSalesToXLSX}
      />
    </div>
  )
}

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("dashboardAuthenticated") === "true"
    }
    return false
  })
  const [pin, setPin] = useState("")

  const handlePinSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pin === "1234") {
      setIsAuthenticated(true)
      localStorage.setItem("dashboardAuthenticated", "true")
    } else {
      alert("PIN incorreto")
      setPin("")
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-2xl">
              🍺
            </div>
            <div>
              <CardTitle className="text-2xl">NitroBeer POS</CardTitle>
              <p className="text-muted-foreground">Sistema de ponto de venda</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-sm font-medium">
                  PIN de acesso
                </Label>
                <Input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                  placeholder="••••"
                  className="h-14 text-center text-2xl tracking-[0.6rem]"
                  maxLength={4}
                />
              </div>
              <Button type="submit" className="h-12 w-full text-lg">
                Entrar
              </Button>
            </form>
            <p className="text-center text-xs text-muted-foreground">
              Sistema seguro • Versão 2.0
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <SidebarLayout>
      <OverviewDashboard />
      <PWAInstallPrompt />
    </SidebarLayout>
  )
}
