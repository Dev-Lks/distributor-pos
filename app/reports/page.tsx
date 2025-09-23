"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Sale {
  id: string
  date: string
  total: number
  items: {
    product: {
      name: string
      size: string
    }
    quantity: number
    price: number
  }[]
}

export default function ReportsPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sales')
      .then(res => res.json())
      .then(setSales)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading...</div>

  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0)
  const totalItems = sales.reduce((sum, sale) => sum + sale.items.reduce((s, item) => s + item.quantity, 0), 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Vendas</p>
                <p className="text-3xl font-bold">R$ {totalSales.toFixed(2)}</p>
              </div>
              <div className="text-2xl">💰</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Transações</p>
                <p className="text-3xl font-bold">{sales.length}</p>
              </div>
              <div className="text-2xl">📊</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Itens Vendidos</p>
                <p className="text-3xl font-bold">{totalItems}</p>
              </div>
              <div className="text-2xl">📦</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{new Date(sale.date).toLocaleString()}</TableCell>
                  <TableCell>{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</TableCell>
                  <TableCell>R$ {sale.total.toFixed(2)}</TableCell>
                  <TableCell>
                    {sale.items.map((item, idx) => (
                      <Badge key={idx} variant="outline" className="mr-1">
                        {item.product.name} ({item.product.size}) x{item.quantity}
                      </Badge>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}