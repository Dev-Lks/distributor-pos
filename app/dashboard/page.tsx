"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useProducts, type Product } from "@/lib/useProducts"
import { useSalesMetrics } from "@/lib/useSales"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { exportSalesToXLSX, exportSalesToCSV } from "@/lib/salesDB"
import { SidebarLayout } from "@/components/SidebarLayout"

function OverviewDashboard() {
  const { data: metrics, isLoading: metricsLoading } = useSalesMetrics()
  const { data: products = [], isLoading: productsLoading } = useProducts()

  if (metricsLoading || productsLoading || !metrics) return <div>Loading...</div>

  const totalProducts = products.length
  const lowStockCount = products.filter((p: Product) => (p.inventory?.totalQuantity ?? 0) <= 10).length
  const outOfStockCount = products.filter((p: Product) => (p.inventory?.totalQuantity ?? 0) === 0).length
  const totalValue = products.reduce((sum: number, p: Product) => sum + (p.inventory?.totalQuantity ?? 0) * p.salePrice, 0)

  return (
    <div className="space-y-6">
      {/* Botões de Exportação */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Button onClick={() => exportSalesToXLSX()} variant="outline">
              Exportar Vendas para XLSX
            </Button>
            <Button onClick={() => exportSalesToCSV()} variant="outline">
              Exportar Vendas para CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="pos-metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vendas Hoje</p>
                <p className="text-3xl font-bold">R$ {metrics.totalToday.toFixed(2)}</p>
              </div>
              <div className="text-2xl">💰</div>
            </div>
          </CardContent>
        </Card>

        <Card className="pos-metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Vendas</p>
                <p className="text-3xl font-bold">{metrics.salesCount}</p>
              </div>
              <div className="text-2xl">🛒</div>
            </div>
          </CardContent>
        </Card>

        <Card className="pos-metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                <p className="text-3xl font-bold">
                  R$ {metrics.salesCount > 0 ? (metrics.totalToday / metrics.salesCount).toFixed(2) : '0.00'}
                </p>
              </div>
              <div className="text-2xl">📊</div>
            </div>
          </CardContent>
        </Card>

        <Card className="pos-metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor em Estoque</p>
                <p className="text-3xl font-bold">R$ {(totalValue / 1000).toFixed(1)}k</p>
              </div>
              <div className="text-2xl">📦</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Estoque */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="pos-metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Produtos</p>
                <p className="text-3xl font-bold text-foreground">{totalProducts}</p>
              </div>
              <div className="text-2xl">📦</div>
            </div>
          </CardContent>
        </Card>

        <Card className="pos-metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estoque Crítico</p>
                <p className="text-3xl font-bold text-destructive">{lowStockCount}</p>
              </div>
              <div className="text-2xl">⚠️</div>
            </div>
          </CardContent>
        </Card>

        <Card className="pos-metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Esgotados</p>
                <p className="text-3xl font-bold text-destructive">{outOfStockCount}</p>
              </div>
              <div className="text-2xl">❌</div>
            </div>
          </CardContent>
        </Card>

        <Card className="pos-metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                <p className="text-3xl font-bold text-accent">R$ {(totalValue / 1000).toFixed(1)}k</p>
              </div>
              <div className="text-2xl">💰</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por Hora */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Hora (Últimas 24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="hour"
                  tickFormatter={(hour) => `${hour}h`}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(hour) => `Hora: ${hour}h`}
                  formatter={(value: any, name) => [
                    name === 'sales' ? `${value} vendas` : `R$ ${Number(value).toFixed(2)}`,
                    name === 'sales' ? 'Vendas' : 'Receita'
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="sales"
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Top Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: any, name) => [
                    name === 'count' ? `${value} unidades` : `R$ ${Number(value).toFixed(2)}`,
                    name === 'count' ? 'Quantidade' : 'Receita'
                  ]}
                />
                <Bar dataKey="count" fill="#8884d8" name="count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Top Produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes dos Top Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Unidades Vendidas</TableHead>
                <TableHead>Receita Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.topProducts.map((product: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.count}</Badge>
                  </TableCell>
                  <TableCell>R$ {product.revenue.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Verifica se o usuário já está autenticado no localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dashboardAuthenticated') === 'true'
    }
    return false
  })
  const [pin, setPin] = useState("")

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === "1234") {
      setIsAuthenticated(true)
      localStorage.setItem('dashboardAuthenticated', 'true') // Salva no localStorage
    } else {
      alert("PIN incorreto")
      setPin("")
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setPin("")
    localStorage.removeItem('dashboardAuthenticated') // Remove do localStorage
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md pos-metric-card">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-2xl">
              🍺
            </div>
            <div>
              <CardTitle className="text-2xl">NitroBeer POS</CardTitle>
              <p className="text-muted-foreground">Sistema de Ponto de Venda</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-sm font-medium">
                  PIN de Acesso
                </Label>
                <Input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="text-center text-2xl tracking-widest font-mono h-14"
                  maxLength={4}
                />
              </div>
              <Button type="submit" className="w-full h-12 pos-action-button text-lg">
                Entrar no Sistema
              </Button>
            </form>
            <div className="text-center text-xs text-muted-foreground">Sistema seguro • Versão 2.0</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <SidebarLayout>
      <OverviewDashboard />
    </SidebarLayout>
  )
}
