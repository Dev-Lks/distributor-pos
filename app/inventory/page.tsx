"use client"

import type React from "react"
import { useState } from "react"
import { useQueryClient } from '@tanstack/react-query'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { useProducts, type Product } from "@/lib/useProducts"
import { SidebarLayout } from "@/components/SidebarLayout"

export default function InventoryPage() {
  const { data: products = [], isLoading: loading } = useProducts()
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editStock, setEditStock] = useState("")

  const startEdit = (id: string, currentStock: number) => {
    setEditingId(id)
    setEditStock(currentStock.toString())
  }

  const saveEdit = async (id: string) => {
    const newStock = Number(editStock)
    if (newStock >= 0) {
      await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: id, quantity: newStock }),
      })
      // Invalidate products cache to refresh inventory
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
    setEditingId(null)
    setEditStock("")
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: "Esgotado", className: "bg-red-100 text-red-800" }
    if (stock <= 10) return { label: "Crítico", className: "bg-yellow-100 text-yellow-800" }
    if (stock <= 25) return { label: "Baixo", className: "bg-orange-100 text-orange-800" }
    return { label: "Normal", className: "bg-green-100 text-green-800" }
  }

  if (loading) return <div>Loading...</div>

  const totalProducts = products.length
  const lowStockCount = products.filter((p: Product) => (p.inventory?.quantity ?? 0) <= 10).length
  const outOfStockCount = products.filter((p: Product) => (p.inventory?.quantity ?? 0) === 0).length
  const totalValue = products.reduce((sum: number, p: Product) => sum + (p.inventory?.quantity ?? 0) * p.salePrice, 0)

  return (
    <SidebarLayout>
      <div className="space-y-6">
          {/* Métricas do inventário */}
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

          {/* Seção de Alertas */}
          {products.some((p: Product) => p.inventory?.alert) && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  ⚠️ Alertas de Estoque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {products.filter((p: Product) => p.inventory?.alert).map((product: Product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Estoque: {product.inventory?.quantity} (Mínimo: {product.inventory?.minStock})
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          // Quick restock - add 10 units
                          fetch('/api/inventory', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              productId: product.id,
                              quantity: (product.inventory?.quantity ?? 0) + 10
                            }),
                          }).then(() => {
                            queryClient.invalidateQueries({ queryKey: ['products'] })
                          })
                        }}
                      >
                        Repor
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabela de produtos */}
          <Card className="pos-metric-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">📦 Controle de Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product: Product) => {
                    const stock = product.inventory?.quantity ?? 0
                    const status = getStockStatus(stock)
                    const isEditing = editingId === product.id

                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.size}</Badge>
                        </TableCell>
                        <TableCell>R$ {product.salePrice.toFixed(2)}</TableCell>
                        <TableCell>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                value={editStock}
                                onChange={(e) => setEditStock(e.target.value)}
                                className="w-20"
                              />
                              <Button size="sm" onClick={() => saveEdit(product.id)}>
                                ✓
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                ×
                              </Button>
                            </div>
                          ) : (
                            <span className="font-mono">{stock}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={status.className}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>R$ {(stock * product.salePrice).toFixed(2)}</TableCell>
                        <TableCell>
                          {!isEditing && (
                            <Button variant="ghost" size="sm" onClick={() => startEdit(product.id, stock)}>
                              ✏️
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
    </SidebarLayout>
  )
}