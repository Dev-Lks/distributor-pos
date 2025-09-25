"use client"

import { Activity, Package, PieChart as PieChartIcon, TrendingUp } from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { DashboardPeriod } from "./DashboardHeader"

interface StockDistributionSlice {
  name: string
  value: number
  color: string
}

interface CategorySummaryItem {
  name: string
  value: number
}

interface PerformanceHighlight {
  id: string
  label: string
  value: string
  description?: string
  tone?: "positive" | "neutral" | "warning"
}

interface PaymentMixEntry {
  method: string
  amount: number
  share: number
}

interface ChannelBreakdownEntry {
  channel: string
  revenue: number
  orders: number
}

interface PointOfSaleBreakdownEntry {
  id: string
  name: string
  revenue: number
  orders: number
}

interface DashboardChartsProps {
  period: DashboardPeriod
  activeTab: "resumo" | "produtos" | "tendencias"
  onTabChange: (tab: "resumo" | "produtos" | "tendencias") => void
  hourlyData: Array<{ hour: number; sales: number; revenue: number; margin: number }>
  topProducts: Array<{ name: string; count: number; revenue: number; margin?: number }>
  stockDistribution: StockDistributionSlice[]
  categorySummary: CategorySummaryItem[]
  performanceHighlights: PerformanceHighlight[]
  paymentMix: PaymentMixEntry[]
  channelBreakdown: ChannelBreakdownEntry[]
  pointOfSaleBreakdown: PointOfSaleBreakdownEntry[]
}

const tabConfig = [
  { value: "resumo" as const, label: "Resumo", icon: Activity },
  { value: "produtos" as const, label: "Produtos", icon: Package },
  { value: "tendencias" as const, label: "Tendências", icon: TrendingUp }
]

const periodLabel: Record<DashboardPeriod, string> = {
  today: "Últimas 24h",
  week: "Últimos 7 dias",
  month: "Últimos 30 dias",
  year: "Últimos 12 meses"
}

const pieColors = ["#10b981", "#f59e0b", "#ef4444", "#6366f1", "#22d3ee"]

export function DashboardCharts({
  period,
  activeTab,
  onTabChange,
  hourlyData,
  topProducts,
  stockDistribution,
  categorySummary,
  performanceHighlights,
  paymentMix,
  channelBreakdown,
  pointOfSaleBreakdown
}: DashboardChartsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as typeof activeTab)} className="space-y-4">
      <TabsList className="grid h-auto grid-cols-3 gap-2 rounded-lg bg-muted/50 p-1">
        {tabConfig.map((tab) => {
          const Icon = tab.icon
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium md:text-sm"
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          )
        })}
      </TabsList>

      <TabsContent value="resumo" className="space-y-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-5 w-5" />
                Vendas por período ({periodLabel[period]})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="dashboardSales" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
                  <XAxis
                    dataKey="hour"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickFormatter={(value) => (period === "today" ? `${value}h` : `${value}`)}
                  />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip
                    labelFormatter={(value) =>
                      period === "today" ? `Hora ${value}h` : `Dia ${value}`
                    }
                    formatter={(value: unknown, name) =>
                      name === "sales"
                        ? [`${value as number} vendas`, "Vendas"]
                        : [`R$ ${(value as number).toFixed(2)}`, "Receita"]
                    }
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#6366f1"
                    fill="url(#dashboardSales)"
                    name="sales"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5" />
                Produtos mais vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <div className="flex h-[260px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-10 w-10 opacity-40" />
                  <p>Nenhum produto com vendas no período selecionado.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="name" fontSize={12} interval={0} angle={-25} textAnchor="end" height={70} />
                    <YAxis fontSize={12} />
                    <Tooltip
                      formatter={(value: unknown, name) =>
                        name === "count"
                          ? [`${value as number} unidades`, "Quantidade"]
                          : [`R$ ${(value as number).toFixed(2)}`, "Receita"]
                      }
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#6366f1" name="count" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChartIcon className="h-5 w-5" />
                Mix de pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paymentMix.length === 0 ? (
                <div className="flex h-[260px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                  <PieChartIcon className="h-10 w-10 opacity-40" />
                  <p>Sem registros de pagamento no período.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={paymentMix}
                        dataKey="amount"
                        nameKey="method"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={4}
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {paymentMix.map((entry, index) => (
                          <Cell key={entry.method} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: unknown, name) => [`R$ ${(value as number).toFixed(2)}`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 text-sm">
                    {paymentMix.map((entry, index) => (
                      <div key={entry.method} className="flex items-center justify-between rounded-md border border-muted/60 px-3 py-2">
                        <span className="font-medium">
                          <span
                            className="mr-2 inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: pieColors[index % pieColors.length] }}
                          />
                          {entry.method}
                        </span>
                        <span className="text-xs text-muted-foreground">{(entry.share * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="produtos" className="space-y-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5" />
                Distribuição de estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stockDistribution.length === 0 ? (
                <div className="flex h-[260px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-10 w-10 opacity-40" />
                  <p>Nenhum dado de estoque disponível.</p>
                  <p className="text-xs">Cadastre produtos ou atualize o inventário.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={stockDistribution}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={4}
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {stockDistribution.map((slice, index) => (
                        <Cell
                          key={slice.name + index}
                          fill={slice.color ?? pieColors[index % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: unknown) => [`${value as number} itens`, "Quantidade"]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Valor por categoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categorySummary.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada até o momento.</p>
              ) : (
                categorySummary.map((category, index) => (
                  <div
                    key={category.name}
                    className="flex items-center justify-between rounded-lg border border-muted bg-muted/30 p-3 text-sm"
                  >
                    <span className="font-medium">{category.name}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-300">
                      R$ {(category.value / 1000).toFixed(1)}k
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Performance por ponto de venda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pointOfSaleBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma venda registrada por ponto de venda.</p>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  {pointOfSaleBreakdown.map((pos) => (
                    <div key={pos.id} className="rounded-lg border border-muted bg-muted/20 p-3 text-sm">
                      <p className="font-semibold leading-tight">{pos.name}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{pos.orders} venda{pos.orders === 1 ? '' : 's'}</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-300">
                          R$ {pos.revenue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="tendencias" className="space-y-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5" />
                Receita vs margem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis
                    dataKey="hour"
                    tickFormatter={(value) => (period === "today" ? `${value}h` : `${value}`)}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value: unknown, name) => [`R$ ${(value as number).toFixed(2)}`, name === 'revenue' ? 'Receita' : 'Margem']}
                    labelFormatter={(value) => (period === "today" ? `Hora ${value}h` : `Dia ${value}`)}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} dot={false} name="Receita" />
                  <Line type="monotone" dataKey="margin" stroke="#10b981" strokeWidth={3} dot={false} name="Margem" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Canais de venda</CardTitle>
            </CardHeader>
            <CardContent>
              {channelBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum canal com vendas no período selecionado.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={channelBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="channel" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip
                      formatter={(value: unknown, name) =>
                        name === "orders"
                          ? [`${value as number} vendas`, "Pedidos"]
                          : [`R$ ${(value as number).toFixed(2)}`, "Receita"]
                      }
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]} fill="#6366f1" name="Receita" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Indicadores de performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {performanceHighlights.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-muted bg-muted/20 p-3"
              >
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  )}
                </div>
                <span
                  className={
                    item.tone === "positive"
                      ? "text-emerald-600 dark:text-emerald-300"
                      : item.tone === "warning"
                        ? "text-amber-600 dark:text-amber-300"
                        : "text-foreground"
                  }
                >
                  {item.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
