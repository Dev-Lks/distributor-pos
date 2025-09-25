"use client"

import type { FormEvent } from "react"
import { useMemo, useState } from "react"
import { AlertTriangle, Activity, DollarSign, Package, ShoppingCart, Users } from "lucide-react"

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
      netRevenue: metrics?.netRevenue ?? 0,
      grossRevenue: metrics?.grossRevenue ?? 0,
      salesCount: metrics?.salesCount ?? 0,
      hourlyData: metrics?.hourlyData ?? [],
      topProducts: metrics?.topProducts ?? [],
      discounts: metrics?.discounts ?? 0,
      taxes: metrics?.taxes ?? 0,
      serviceCharges: metrics?.serviceCharges ?? 0,
      costOfGoods: metrics?.costOfGoods ?? 0,
      grossMarginValue: metrics?.grossMarginValue ?? 0,
      grossMarginPercent: metrics?.grossMarginPercent ?? 0,
      averageTicket: metrics?.averageTicket ?? 0,
      averageItemsPerSale: metrics?.averageItemsPerSale ?? 0,
      paymentMix: metrics?.paymentMix ?? [],
      channelBreakdown: metrics?.channelBreakdown ?? [],
      pointOfSaleBreakdown: metrics?.pointOfSaleBreakdown ?? [],
      customerLeaders: metrics?.customerLeaders ?? [],
      repeatCustomerRate: metrics?.repeatCustomerRate ?? 0
    }),
    [metrics]
  )

  const inventorySummary = useMemo(() => {
    const totalProducts = products.length
    const totalQuantity = products.reduce((sum, product) => sum + (product.inventory?.totalQuantity ?? 0), 0)
    const reservedQuantity = products.reduce((sum, product) => sum + (product.inventory?.reservedQuantity ?? 0), 0)
    const damagedQuantity = products.reduce((sum, product) => sum + (product.inventory?.damagedQuantity ?? 0), 0)
    const inTransitQuantity = products.reduce((sum, product) => sum + (product.inventory?.inTransitQuantity ?? 0), 0)
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
    const averageDailyConsumptionValues = products
      .map((product) => product.inventory?.averageDailyConsumption ?? null)
      .filter((value): value is number => value !== null && !Number.isNaN(value))
    const avgDailyConsumption = averageDailyConsumptionValues.length > 0
      ? averageDailyConsumptionValues.reduce((sum, value) => sum + value, 0) / averageDailyConsumptionValues.length
      : null
    const availableQuantity = Math.max(totalQuantity - reservedQuantity - damagedQuantity, 0)
    const coverageDays = avgDailyConsumption && avgDailyConsumption > 0
      ? availableQuantity / avgDailyConsumption
      : null

    return {
      totalProducts,
      totalQuantity,
      reservedQuantity,
      damagedQuantity,
      inTransitQuantity,
      lowStock,
      outOfStock,
      inventoryValue,
      bonifications,
      activeProducts,
      availableQuantity,
      coverageDays
    }
  }, [products])

  const averageTicket = useMemo(() => {
    if (metrics?.averageTicket !== undefined) {
      return metrics.averageTicket
    }
    return safeMetrics.salesCount > 0 ? safeMetrics.netRevenue / safeMetrics.salesCount : 0
  }, [metrics, safeMetrics])

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
          id: "gross-margin",
          label: "Margem bruta",
          value: `${(safeMetrics.grossMarginPercent * 100).toFixed(1)}%`,
          description: `Rendimento de ${formatCurrency(safeMetrics.grossMarginValue)} no período`,
          tone: safeMetrics.grossMarginPercent >= 0.3 ? "positive" : safeMetrics.grossMarginPercent >= 0.15 ? "neutral" : "warning"
        },
        {
          id: "discounts",
          label: "Descontos concedidos",
          value: formatCurrency(safeMetrics.discounts),
          description: "Impacto direto na receita líquida",
          tone: safeMetrics.discounts > 0 ? "warning" : "neutral"
        },
        {
          id: "repeat-customers",
          label: "Clientes recorrentes",
          value: `${(safeMetrics.repeatCustomerRate * 100).toFixed(0)}%`,
          description: "Entre clientes identificados",
          tone: safeMetrics.repeatCustomerRate >= 0.4 ? "positive" : safeMetrics.repeatCustomerRate >= 0.2 ? "neutral" : "warning"
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
        const marginPercent =
          productMetric.margin != null && productMetric.revenue > 0
            ? (productMetric.margin / productMetric.revenue) * 100
            : productData && productData.salePrice > 0
              ? ((productData.salePrice - (productData.cost ?? 0)) / productData.salePrice) * 100
              : null

        return {
          name: productMetric.name,
          unitsSold: productMetric.count,
          revenue: productMetric.revenue,
          margin: marginPercent
        }
      }),
    [products, safeMetrics.topProducts]
  )

  const kpiItems = useMemo<DashboardKpiItem[]>(
    () => [
      {
        id: "net-revenue",
        label: `Receita líquida ${periodFriendlyLabel[period]}`,
        value: formatCurrency(safeMetrics.netRevenue),
        icon: DollarSign,
        tone: "emerald",
        status:
          safeMetrics.salesCount > 0
            ? { label: `${safeMetrics.salesCount} venda${safeMetrics.salesCount === 1 ? "" : "s"}`, intent: "positive" }
            : { label: "Sem vendas", intent: "neutral" }
      },
      {
        id: "gross-margin",
        label: "Margem bruta",
        value: `${formatCurrency(safeMetrics.grossMarginValue)} (${(safeMetrics.grossMarginPercent * 100).toFixed(1)}%)`,
        icon: Activity,
        tone: "violet",
        description: "Receita menos custo dos produtos"
      },
      {
        id: "average-ticket",
        label: "Ticket médio",
        value: formatCurrency(averageTicket),
        icon: ShoppingCart,
        tone: "blue",
        hint: period === "today" ? "Atualiza a cada 5 minutos" : "Total do período"
      },
      {
        id: "items-per-sale",
        label: "Itens por venda",
        value: safeMetrics.averageItemsPerSale.toFixed(1),
        icon: Package,
        tone: "orange",
        description: "Quantidade média por pedido"
      }
    ],
    [averageTicket, period, safeMetrics]
  )

  const operationalKpis = useMemo<DashboardKpiItem[]>(
    () => [
      {
        id: "inventory-value",
        label: "Valor em estoque",
        value: formatCompactCurrency(inventorySummary.inventoryValue),
        icon: Package,
        tone: "slate",
        description: `${formatNumber(inventorySummary.availableQuantity)} unidades disponíveis`
      },
      {
        id: "stock-health",
        label: "Estoque crítico",
        value: `${inventorySummary.lowStock}`,
        icon: AlertTriangle,
        tone: "orange",
        status:
          inventorySummary.lowStock > 0
            ? { label: `${inventorySummary.outOfStock} esgotado${inventorySummary.outOfStock === 1 ? "" : "s"}`, intent: "negative" }
            : { label: "Sem alertas", intent: "positive" }
      },
      {
        id: "coverage",
        label: "Cobertura de estoque",
        value: inventorySummary.coverageDays ? `${inventorySummary.coverageDays.toFixed(1)} dias` : "-",
        icon: Activity,
        tone: "blue",
        hint: inventorySummary.coverageDays ? "Estimativa com base no consumo médio diário" : "Cadastre consumo para estimar"
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
            paymentMix={safeMetrics.paymentMix}
            channelBreakdown={safeMetrics.channelBreakdown}
            pointOfSaleBreakdown={safeMetrics.pointOfSaleBreakdown}
          />
        </>
      )}

      <SalesHistory
        sales={filteredSales}
        isLoading={salesLoading}
        onCancel={cancelSale}
      />

      <TopProductsTable products={topProductsWithMargin} />

      {safeMetrics.customerLeaders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5" />
              Clientes que mais compram
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {safeMetrics.customerLeaders.map((customer) => (
              <div
                key={customer.name}
                className="flex flex-col justify-between gap-2 rounded-lg border border-muted/60 bg-muted/20 p-3 text-sm md:flex-row md:items-center"
              >
                <div>
                  <p className="font-semibold leading-tight">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {customer.orders} pedido{customer.orders === 1 ? "" : "s"} registrados
                  </p>
                </div>
                <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                  {formatCurrency(customer.revenue)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
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

  return <OverviewDashboard />
}
