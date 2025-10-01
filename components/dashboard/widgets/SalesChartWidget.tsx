"use client"

import { useState } from "react"
import { Area, AreaChart, Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ChartType = "area" | "bar" | "line"
type Period = "today" | "week" | "month"
type DataType = "revenue" | "quantity" | "margin"

interface SalesChartWidgetProps {
  data?: Array<{ hour: string; revenue: number; quantity: number; margin: number }>
}

export function SalesChartWidget({ data: initialData }: SalesChartWidgetProps) {
  const [chartType, setChartType] = useState<ChartType>("area")
  const [period, setPeriod] = useState<Period>("today")
  const [dataType, setDataType] = useState<DataType>("revenue")

  // Mock data for demonstration
  const data = initialData || [
    { hour: "08:00", revenue: 450, quantity: 12, margin: 180 },
    { hour: "09:00", revenue: 780, quantity: 18, margin: 312 },
    { hour: "10:00", revenue: 920, quantity: 24, margin: 368 },
    { hour: "11:00", revenue: 1200, quantity: 32, margin: 480 },
    { hour: "12:00", revenue: 1850, quantity: 45, margin: 740 },
    { hour: "13:00", revenue: 1650, quantity: 38, margin: 660 },
    { hour: "14:00", revenue: 980, quantity: 22, margin: 392 },
    { hour: "15:00", revenue: 1100, quantity: 28, margin: 440 },
    { hour: "16:00", revenue: 1420, quantity: 35, margin: 568 },
    { hour: "17:00", revenue: 1890, quantity: 48, margin: 756 },
  ]

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
