"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useSalesMetrics } from "@/lib/useSales"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function ReportsPage() {
  const { data: metrics, isLoading } = useSalesMetrics()

  if (isLoading || !metrics) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
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

        <Card>
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

        <Card>
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