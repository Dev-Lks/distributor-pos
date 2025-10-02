"use client"

import { useState } from "react"
import { Area, AreaChart, Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, TrendingUp } from "lucide-react"
import { useSalesMetrics } from "@/lib/useSales"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

type ChartType = "area" | "bar" | "line"
type Period = "today" | "week" | "month"
type DataType = "revenue" | "quantity" | "margin"

export function SalesChartWidget() {
  const [chartType, setChartType] = useState<ChartType>("area")
  const [period, setPeriod] = useState<Period>("today")
  const [dataType, setDataType] = useState<DataType>("revenue")

  const { data: metrics, isLoading, error, refetch } = useSalesMetrics(period)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Vendas</CardTitle>
            <Skeleton className="h-9 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-3" />
            <p className="text-sm font-medium">Erro ao carregar dados de vendas</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              {error.message || 'Tente novamente mais tarde'}
            </p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Transformar dados do metrics em formato do gráfico
  const data = metrics?.hourlyData?.map((hourly) => ({
    hour: period === 'today' ? `${hourly.hour}:00` : String(hourly.hour),
    revenue: hourly.revenue,
    quantity: hourly.sales,
    margin: hourly.margin || 0,
  })) || []

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Vendas</CardTitle>
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">Nenhuma venda no período</p>
            <p className="text-xs text-muted-foreground mt-1">
              Os dados de vendas aparecerão aqui
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const dataKey = dataType === "revenue" ? "revenue" : dataType === "quantity" ? "quantity" : "margin"
  const label =
    dataType === "revenue" ? "Faturamento" : dataType === "quantity" ? "Quantidade" : "Margem"

  const formatValue = (value: number) => {
    if (dataType === "quantity") return value.toString()
    return `R$ ${value.toFixed(0)}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Vendas</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={dataType} onValueChange={(v) => setDataType(v as DataType)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Faturamento</SelectItem>
                <SelectItem value="quantity">Quantidade</SelectItem>
                <SelectItem value="margin">Margem</SelectItem>
              </SelectContent>
            </Select>
            <Tabs value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
              <TabsList>
                <TabsTrigger value="area">Área</TabsTrigger>
                <TabsTrigger value="bar">Barras</TabsTrigger>
                <TabsTrigger value="line">Linha</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {chartType === "area" ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" stroke="#888888" fontSize={12} />
              <YAxis stroke="#888888" fontSize={12} tickFormatter={formatValue} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [formatValue(value), label]}
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          ) : chartType === "bar" ? (
            <BarChart data={data}>
              <XAxis dataKey="hour" stroke="#888888" fontSize={12} />
              <YAxis stroke="#888888" fontSize={12} tickFormatter={formatValue} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [formatValue(value), label]}
              />
              <Bar dataKey={dataKey} fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <XAxis dataKey="hour" stroke="#888888" fontSize={12} />
              <YAxis stroke="#888888" fontSize={12} tickFormatter={formatValue} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [formatValue(value), label]}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: "#f59e0b", r: 4 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
