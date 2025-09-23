"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useQueryClient } from '@tanstack/react-query'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useProducts, type Product } from "@/lib/useProducts"
import { useSales } from "@/lib/useSales"

function SalesPanel() {
  const { data: products = [], isLoading: loading } = useProducts()
  const { createSale } = useSales()
  const [cart, setCart] = useState<Array<{ productId: string; name: string; price: number; quantity: number; stock: number }>>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSize, setSelectedSize] = useState("all")
  const [saleLoading, setSaleLoading] = useState(false)

  // Play alert sound when products are low on stock
  useEffect(() => {
    const hasAlerts = products.some((p: Product) => p.inventory?.alert)
    if (hasAlerts) {
      const audio = new Audio('/alert.mp3')
      audio.play().catch(() => {}) // Ignore errors if audio fails
    }
  }, [products])

  const sizes = ["all", ...Array.from(new Set(products.map((p: Product) => p.size as string)))] as string[]

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSize = selectedSize === "all" || product.size === selectedSize
    return matchesSearch && matchesSize && (product.inventory?.quantity ?? 0) > 0
  })

  const addToCart = (product: Product, quantity = 1) => {
    const stock = product.inventory?.quantity ?? 0
    const existingItem = cart.find((item) => item.productId === product.id)
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === product.id ? { ...item, quantity: Math.min(item.quantity + quantity, stock) } : item,
        ),
      )
    } else {
      setCart([...cart, { productId: product.id, name: product.name, price: product.salePrice, quantity: Math.min(quantity, stock), stock }])
    }
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter((item) => item.productId !== productId))
      return
    }
    const item = cart.find((i) => i.productId === productId)
    if (item) {
      setCart(cart.map((i) => (i.productId === productId ? { ...i, quantity: Math.min(newQuantity, i.stock) } : i)))
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId))
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const finalizeSale = async () => {
    if (cart.length === 0) return
    setSaleLoading(true)
    try {
      const items = cart.map(item => ({ productId: item.productId, quantity: item.quantity }))
      await createSale(items)
      setCart([])
    } finally {
      setSaleLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Produtos - 2/3 da tela */}
      <div className="lg:col-span-2 space-y-4">
        {/* Busca e filtros */}
        <Card className="pos-metric-card">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Buscar produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {sizes.slice(1).map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Grid de produtos */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map((product: Product) => (
            <Card
              key={product.id}
              className="pos-quick-action cursor-pointer hover:scale-105 transition-transform"
              onClick={() => addToCart(product)}
            >
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="font-medium text-sm leading-tight">{product.name}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">R$ {product.salePrice.toFixed(2)}</span>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">
                        {product.inventory?.quantity ?? 0}
                      </Badge>
                      {product.inventory?.alert && (
                        <Badge variant="destructive" className="text-xs">
                          Baixo
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{product.size}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Carrinho - 1/3 da tela */}
      <div className="space-y-4">
        <Card className="pos-metric-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span>🛒 Carrinho</span>
              {itemCount > 0 && (
                <Badge className="bg-primary text-primary-foreground">
                  {itemCount} {itemCount === 1 ? "item" : "itens"}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length > 0 ? (
              <>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground">R$ {item.price.toFixed(2)} cada</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateQuantity(item.productId, item.quantity - 1)
                          }}
                          className="h-8 w-8 p-0"
                        >
                          -
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateQuantity(item.productId, item.quantity + 1)
                          }}
                          className="h-8 w-8 p-0"
                        >
                          +
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFromCart(item.productId)
                          }}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Subtotal:</span>
                    <span className="text-lg font-bold">R$ {total.toFixed(2)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => setCart([])} className="w-full">
                      Limpar
                    </Button>
                    <Button onClick={finalizeSale} disabled={saleLoading} className="w-full pos-action-button">
                      {saleLoading ? 'Processando...' : 'Finalizar'}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-3">🛒</div>
                <p>Carrinho vazio</p>
                <p className="text-sm">Adicione produtos para iniciar uma venda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InventoryDashboard() {
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
  )
}

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pin, setPin] = useState("")
  const [currentView, setCurrentView] = useState("sales")

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === "1234") {
      setIsAuthenticated(true)
    } else {
      alert("PIN incorreto")
      setPin("")
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setPin("")
    setCurrentView("sales")
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
    <div className="min-h-screen bg-background">
      {/* Header simplificado */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">🍺 NitroBeer POS</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Sistema de Vendas</span>
                <Badge variant="outline" className="pos-status-high text-xs">
                  Online
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">Vendas Hoje</div>
                <div className="text-xs text-muted-foreground">Dashboard</div>
              </div>
            </div>

            <Button variant="outline" onClick={handleLogout} className="bg-transparent">
              🚪 Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Navegação por abas */}
      <div className="border-b bg-card/50">
        <div className="px-6 py-3">
          <div className="flex gap-2">
            <Button
              variant={currentView === "sales" ? "default" : "ghost"}
              onClick={() => setCurrentView("sales")}
              className="gap-2"
            >
              💰 Vendas
            </Button>
            <Button
              variant={currentView === "inventory" ? "default" : "ghost"}
              onClick={() => setCurrentView("inventory")}
              className="gap-2"
            >
              📦 Estoque
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <main className="flex-1 p-6 max-w-7xl mx-auto">
        {currentView === "sales" && <SalesPanel />}
        {currentView === "inventory" && <InventoryDashboard />}
      </main>
    </div>
  )
}
