"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useProducts, type Product } from "@/lib/useProducts"
import { useSalesMetrics } from "@/lib/useSales"
import { useSales } from "@/lib/useSales"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { exportSalesToXLSX, exportSalesToCSV } from "@/lib/salesDB"
import { SidebarLayout } from "@/components/SidebarLayout"
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt"
import { BackupManager } from "@/components/BackupManager"
import { CalendarDays, TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, ShoppingCart, Users, BarChart3, PieChart as PieChartIcon, Activity, History } from "lucide-react"

function OverviewDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month" | "year">("today")
  const [activeTab, setActiveTab] = useState("sales")
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const { data: metrics, isLoading: metricsLoading } = useSalesMetrics(selectedPeriod)
  const { data: products = [], isLoading: productsLoading } = useProducts()
  const { sales, salesLoading, cancelSale } = useSales()

  if (metricsLoading || productsLoading || !metrics) return <div>Loading...</div>

  // Garantir que as propriedades existam
  const safeMetrics = {
    totalToday: metrics.totalToday || 0,
    salesCount: metrics.salesCount || 0,
    hourlyData: metrics.hourlyData || [],
    topProducts: metrics.topProducts || []
  }

  const totalProducts = products.length
  const lowStockCount = products.filter((p: Product) => (p.inventory?.totalQuantity ?? 0) <= 10).length
  const outOfStockCount = products.filter((p: Product) => (p.inventory?.totalQuantity ?? 0) === 0).length
  const totalValue = products.reduce((sum: number, p: Product) => sum + (p.inventory?.totalQuantity ?? 0) * p.salePrice, 0)
  const totalBonifications = products.reduce((sum: number, p: Product) => sum + p.bonifications, 0)

  // Filtrar vendas
  const filteredSales = sales?.filter((sale: any) => {
    const matchesSearch = searchTerm === "" || 
      sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.items.some((item: any) => item.product?.name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesPayment = paymentFilter === "all" || sale.paymentMethod === paymentFilter
    
    const matchesDate = dateFilter === "" || 
      new Date(sale.date).toDateString() === new Date(dateFilter).toDateString()
    
    return matchesSearch && matchesPayment && matchesDate
  }) || []

  // Calcular métricas de crescimento (simulado)
  const growthRate = 12.5 // Simulado
  const salesGrowth = 8.3 // Simulado

  const periodLabels = {
    today: "Hoje",
    week: "Esta Semana",
    month: "Este Mês",
    year: "Este Ano"
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">Visão geral do seu negócio</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as "today" | "week" | "month" | "year")}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">📅 Hoje</SelectItem>
              <SelectItem value="week">📊 Esta Semana</SelectItem>
              <SelectItem value="month">🗓️ Este Mês</SelectItem>
              <SelectItem value="year">📈 Este Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Backup Manager */}
      <BackupManager />

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="relative overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Vendas {periodLabels[selectedPeriod as keyof typeof periodLabels]}</p>
                <p className="text-2xl md:text-3xl font-bold">R$ {safeMetrics.totalToday.toFixed(2)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                  <span className="text-xs md:text-sm text-green-600">+{salesGrowth}%</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <DollarSign className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Total de Vendas</p>
                <p className="text-2xl md:text-3xl font-bold">{safeMetrics.salesCount}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Activity className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />
                  <span className="text-xs md:text-sm text-blue-600">Ativo</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <ShoppingCart className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl md:text-3xl font-bold">
                  R$ {safeMetrics.salesCount > 0 ? (safeMetrics.totalToday / safeMetrics.salesCount).toFixed(2) : '0.00'}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-purple-500" />
                  <span className="text-xs md:text-sm text-purple-600">+5.2%</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <BarChart3 className="w-4 h-4 md:w-6 md:h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Valor em Estoque</p>
                <p className="text-2xl md:text-3xl font-bold">R$ {(totalValue / 1000).toFixed(1)}k</p>
                <div className="flex items-center gap-1 mt-1">
                  <Package className="w-3 h-3 md:w-4 md:h-4 text-orange-500" />
                  <span className="text-xs md:text-sm text-orange-600">Estável</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                <Package className="w-4 h-4 md:w-6 md:h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Estoque e Alertas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="relative overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Produtos</p>
                <p className="text-2xl md:text-3xl font-bold">{totalProducts}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Package className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />
                  <span className="text-xs md:text-sm text-blue-600">Ativos</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Package className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Estoque Crítico</p>
                <p className="text-2xl md:text-3xl font-bold text-red-600">{lowStockCount}</p>
                <div className="flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 text-red-500" />
                  <span className="text-xs md:text-sm text-red-600">Atenção</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertTriangle className="w-4 h-4 md:w-6 md:h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Esgotados</p>
                <p className="text-2xl md:text-3xl font-bold text-red-700">{outOfStockCount}</p>
                <div className="flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 text-red-500" />
                  <span className="text-xs md:text-sm text-red-600">Urgente</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertTriangle className="w-4 h-4 md:w-6 md:h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Bonificações</p>
                <p className="text-2xl md:text-3xl font-bold text-purple-600">{totalBonifications}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Users className="w-3 h-3 md:w-4 md:h-4 text-purple-500" />
                  <span className="text-xs md:text-sm text-purple-600">Disponíveis</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <Users className="w-4 h-4 md:w-6 md:h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Importantes */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/10 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Alertas de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4">
              {lowStockCount > 0 && (
                <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm md:font-medium text-yellow-800 dark:text-yellow-200">
                      {lowStockCount} produto{lowStockCount > 1 ? 's' : ''} com estoque baixo
                    </p>
                    <p className="text-xs md:text-sm text-yellow-700 dark:text-yellow-300">
                      Considere repor estes itens
                    </p>
                  </div>
                </div>
              )}
              {outOfStockCount > 0 && (
                <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                  <div>
                    <p className="text-sm md:font-medium text-red-800 dark:text-red-200">
                      {outOfStockCount} produto{outOfStockCount > 1 ? 's' : ''} esgotado{outOfStockCount > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs md:text-sm text-red-700 dark:text-red-300">
                      Ação imediata necessária
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos com Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="sales" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-3">
            <BarChart3 className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Vendas</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-3">
            <Package className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Produtos</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-3">
            <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-3">
            <History className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Histórico</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          {activeTab === 'sales' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
              {/* Vendas por Hora */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                    <Activity className="w-4 h-4 md:w-5 md:h-5" />
                    Vendas por Hora ({selectedPeriod === 'today' ? 'Últimas 24h' : `Últimos ${selectedPeriod === 'week' ? '7 dias' : selectedPeriod === 'month' ? '30 dias' : '365 dias'}`})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250} className="text-xs md:text-sm">
                    <AreaChart data={safeMetrics.hourlyData}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="hour"
                        tickFormatter={(hour) => selectedPeriod === 'today' ? `${hour}h` : `${hour}`}
                        fontSize={10}
                      />
                      <YAxis fontSize={10} />
                      <Tooltip
                        labelFormatter={(hour) => selectedPeriod === 'today' ? `Hora: ${hour}h` : `Dia: ${hour}`}
                        formatter={(value: any, name) => [
                          name === 'sales' ? `${value} vendas` : `R$ ${Number(value).toFixed(2)}`,
                          name === 'sales' ? 'Vendas' : 'Receita'
                        ]}
                        contentStyle={{ fontSize: '12px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#8884d8"
                        fillOpacity={1}
                        fill="url(#colorSales)"
                        name="sales"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Produtos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                    <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
                    Top Produtos Mais Vendidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250} className="text-xs md:text-sm">
                    <BarChart data={safeMetrics.topProducts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval={0}
                        fontSize={10}
                      />
                      <YAxis fontSize={10} />
                      <Tooltip
                        formatter={(value: any, name) => [
                          name === 'count' ? `${value} unidades` : `R$ ${Number(value).toFixed(2)}`,
                          name === 'count' ? 'Quantidade' : 'Receita'
                        ]}
                        contentStyle={{ fontSize: '12px' }}
                      />
                      <Bar dataKey="count" fill="#8884d8" name="count" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          {activeTab === 'products' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribuição de Estoque */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5" />
                    Distribuição de Estoque
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Estoque Normal', value: totalProducts - lowStockCount - outOfStockCount, fill: '#10b981' },
                          { name: 'Estoque Baixo', value: lowStockCount, fill: '#f59e0b' },
                          { name: 'Esgotado', value: outOfStockCount, fill: '#ef4444' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Valor por Categoria */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Valor em Estoque por Categoria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from(new Set(products.map((p: Product) => p.category).filter(Boolean) as string[])).map((category: string) => {
                      const categoryProducts = products.filter((p: Product) => p.category === category)
                      const categoryValue = categoryProducts.reduce((sum: number, p: Product) => sum + (p.inventory?.totalQuantity ?? 0) * p.salePrice, 0)
                      return (
                        <div key={category} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="font-medium">{category}</span>
                          <span className="font-bold text-green-600">R$ {(categoryValue / 1000).toFixed(1)}k</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {activeTab === 'performance' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Receita por Hora */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Receita por Hora
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={safeMetrics.hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="hour"
                        tickFormatter={(hour) => selectedPeriod === 'today' ? `${hour}h` : `${hour}`}
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(hour) => selectedPeriod === 'today' ? `Hora: ${hour}h` : `Dia: ${hour}`}
                        formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Receita']}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Métricas de Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Indicadores de Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">Crescimento de Vendas</p>
                        <p className="text-sm text-green-600 dark:text-green-400">Comparado ao período anterior</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">+{salesGrowth}%</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <div>
                        <p className="font-medium text-blue-800 dark:text-blue-200">Ticket Médio</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Valor médio por venda</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          R$ {safeMetrics.salesCount > 0 ? (safeMetrics.totalToday / safeMetrics.salesCount).toFixed(2) : '0.00'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                      <div>
                        <p className="font-medium text-purple-800 dark:text-purple-200">Produtos Ativos</p>
                        <p className="text-sm text-purple-600 dark:text-purple-400">Com estoque disponível</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-600">
                          {products.filter((p: Product) => (p.inventory?.totalQuantity ?? 0) > 0).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          {activeTab === 'historico' && (
            <div className="space-y-4">
              {/* Filtros e Busca */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Histórico de Vendas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="search">Buscar</Label>
                      <Input
                        id="search"
                        placeholder="Cliente ou produto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment">Método de Pagamento</Label>
                      <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="cash">Dinheiro</SelectItem>
                          <SelectItem value="card">Cartão</SelectItem>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="other">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="date">Data</Label>
                      <Input
                        id="date"
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabela de Vendas */}
              <Card>
                <CardContent className="p-0">
                  {salesLoading ? (
                    <div className="text-center py-8">Carregando vendas...</div>
                  ) : filteredSales.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">Nenhuma venda encontrada</p>
                      <p className="text-sm">Tente ajustar os filtros de busca</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs md:text-sm">Data</TableHead>
                            <TableHead className="text-xs md:text-sm">Cliente</TableHead>
                            <TableHead className="text-xs md:text-sm">Total</TableHead>
                            <TableHead className="text-xs md:text-sm">Pagamento</TableHead>
                            <TableHead className="text-xs md:text-sm">Itens</TableHead>
                            <TableHead className="text-xs md:text-sm">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSales.map((sale: any) => (
                            <TableRow key={sale.id}>
                              <TableCell className="text-xs md:text-sm">
                                {new Date(sale.date).toLocaleString('pt-BR')}
                              </TableCell>
                              <TableCell className="text-xs md:text-sm font-medium">
                                {sale.customerName || '-'}
                              </TableCell>
                              <TableCell className="text-xs md:text-sm font-bold">
                                R$ {sale.total.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-xs md:text-sm">
                                <Badge variant="outline">
                                  {sale.paymentMethod === 'cash' ? '💵 Dinheiro' : 
                                   sale.paymentMethod === 'card' ? '💳 Cartão' : 
                                   sale.paymentMethod === 'pix' ? '⚡ PIX' : 
                                   sale.paymentMethod || 'Não informado'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs md:text-sm">
                                <div className="max-w-32 truncate">
                                  {sale.items.map((item: any, index: number) => (
                                    <div key={index} className="truncate">
                                      {item.quantity}x {item.product?.name || 'Produto'}
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs md:text-sm">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={async () => {
                                    if (confirm('Tem certeza que deseja cancelar esta venda? O estoque será restaurado.')) {
                                      try {
                                        await cancelSale(sale.id)
                                        alert('Venda cancelada com sucesso!')
                                      } catch (error) {
                                        alert('Erro ao cancelar venda: ' + error)
                                      }
                                    }
                                  }}
                                  className="text-xs"
                                >
                                  Cancelar
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Tabela de Top Produtos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm md:text-base">
            <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
            Detalhes dos Top Produtos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm">Produto</TableHead>
                  <TableHead className="text-xs md:text-sm">Unidades Vendidas</TableHead>
                  <TableHead className="text-xs md:text-sm">Receita Total</TableHead>
                  <TableHead className="text-xs md:text-sm">Margem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeMetrics.topProducts.map((product: any, index: number) => {
                  const productData = products.find((p: Product) => p.name === product.name)
                  const margin = productData ? ((productData.salePrice - productData.cost) / productData.salePrice * 100) : 0
                  return (
                    <TableRow key={index}>
                      <TableCell className="text-xs md:text-sm font-medium">{product.name}</TableCell>
                      <TableCell className="text-xs md:text-sm">
                        <Badge variant="secondary" className="text-xs">{product.count}</Badge>
                      </TableCell>
                      <TableCell className="text-xs md:text-sm">R$ {product.revenue.toFixed(2)}</TableCell>
                      <TableCell className="text-xs md:text-sm">
                        <span className={margin > 0 ? 'text-green-600' : 'text-red-600'}>
                          {margin > 0 ? '+' : ''}{margin.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Ações e Exportações */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        {/* Botões de Exportação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Exportar Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => exportSalesToXLSX()} variant="outline" className="w-full justify-start">
              📊 Exportar Vendas para XLSX
            </Button>
            <Button onClick={() => exportSalesToCSV()} variant="outline" className="w-full justify-start">
              📄 Exportar Vendas para CSV
            </Button>
          </CardContent>
        </Card>

        {/* Backup Manager */}
        <BackupManager />
      </div>
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
      <PWAInstallPrompt />
    </SidebarLayout>
  )
}
