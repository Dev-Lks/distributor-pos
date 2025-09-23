"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useProducts, type Product } from "@/lib/useProducts"
import { useSales } from "@/lib/useSales"
import { SidebarLayout } from "@/components/SidebarLayout"

export default function SalesPage() {
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
    // Visual feedback
    const card = document.querySelector(`[data-product-id="${product.id}"]`)
    if (card) {
      card.classList.add('animate-pulse')
      setTimeout(() => card.classList.remove('animate-pulse'), 300)
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
      // Success sound
      const audio = new Audio('/alert.mp3')
      audio.play().catch(() => {})
    } finally {
      setSaleLoading(false)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Enter to finalize sale
      if (event.key === 'Enter' && cart.length > 0) {
        finalizeSale()
      }
      // Escape to clear cart
      if (event.key === 'Escape') {
        setCart([])
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [cart, finalizeSale])

  if (loading) return <div>Loading...</div>

  return (
    <SidebarLayout>
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
                data-product-id={product.id}
                className="pos-quick-action cursor-pointer hover:scale-105 transition-transform touch-manipulation"
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
    </SidebarLayout>
  )
}