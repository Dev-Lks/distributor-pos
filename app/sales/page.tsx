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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useProducts, type Product } from "@/lib/useProducts"
import { useSales } from "@/lib/useSales"
import { SidebarLayout } from "@/components/SidebarLayout"
import { Plus, Minus, X, ShoppingCart, CreditCard, DollarSign, Receipt, Zap, Calculator, Search } from "lucide-react"

export default function SalesPage() {
  const { data: products = [], isLoading: loading } = useProducts()
  const { createSale } = useSales()
  const [cart, setCart] = useState<Array<{ productId: string; name: string; price: number; quantity: number; stock: number }>>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSize, setSelectedSize] = useState("all")
  const [saleLoading, setSaleLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'pix'>('cash')
  const [receivedAmount, setReceivedAmount] = useState("")
  const [showChange, setShowChange] = useState(false)
  const [quickSaleMode, setQuickSaleMode] = useState(false)

  // Play alert sound when products are low on stock
  useEffect(() => {
    const hasAlerts = products.some((p: Product) => 
      p.inventory?.coldRoomAlert || p.inventory?.houseAlert || p.inventory?.salePointAlert
    )
    if (hasAlerts) {
      const audio = new Audio('/alert.mp3')
      audio.play().catch(() => {}) // Ignore errors if audio fails
    }
  }, [products])

  const sizes = ["all", ...Array.from(new Set(products.map((p: Product) => p.size as string)))] as string[]

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSize = selectedSize === "all" || product.size === selectedSize
    return matchesSearch && matchesSize && (product.inventory?.salePointQuantity ?? 0) > 0
  })

  const addToCart = (product: Product, quantity = 1) => {
    const stock = product.inventory?.salePointQuantity ?? 0
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
  const received = Number(receivedAmount) || 0
  const change = received - total

  const finalizeSale = async () => {
    if (cart.length === 0) return
    setSaleLoading(true)
    try {
      const items = cart.map(item => ({ productId: item.productId, quantity: item.quantity }))
      await createSale({ items, paymentMethod })
      setCart([])
      setReceivedAmount("")
      setShowChange(false)
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
      // F1 - Modo venda rápida
      if (event.key === 'F1') {
        event.preventDefault()
        setQuickSaleMode(!quickSaleMode)
      }
      // F2 - Limpar carrinho
      if (event.key === 'F2') {
        event.preventDefault()
        setCart([])
      }
      // Enter - Finalizar venda
      if (event.key === 'Enter' && cart.length > 0 && !event.shiftKey) {
        event.preventDefault()
        finalizeSale()
      }
      // Escape - Limpar carrinho
      if (event.key === 'Escape') {
        event.preventDefault()
        setCart([])
      }
      // Shift + Enter - Focar no campo de valor recebido
      if (event.key === 'Enter' && event.shiftKey && paymentMethod === 'cash') {
        event.preventDefault()
        document.getElementById('received')?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [cart, finalizeSale, quickSaleMode, paymentMethod])

  if (loading) return <div>Loading...</div>

  return (
    <SidebarLayout>
      <Tabs defaultValue="nova-venda" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="nova-venda">Nova Venda</TabsTrigger>
        </TabsList>

        <TabsContent value="nova-venda" className="mt-4">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 h-full">
        {/* Produtos - 2/3 da tela */}
        <div className="xl:col-span-2 space-y-4">
          {/* Busca e filtros */}
          <Card className="pos-metric-card">
            <CardContent className="p-4">
              <div className="flex gap-3 mb-3">
                <div className="flex-1">
                  <div className="relative">
                    <Input
                      placeholder="Buscar produto..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
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

              {/* Atalhos Rápidos */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickSaleMode(!quickSaleMode)}
                  className={quickSaleMode ? 'bg-primary text-primary-foreground' : ''}
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Venda Rápida
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCart([])}>
                  <X className="w-3 h-3 mr-1" />
                  Limpar Carrinho
                </Button>
                <div className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs">F1</kbd> Modo Rápido
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-2">F2</kbd> Limpar
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-2">Enter</kbd> Finalizar
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid de produtos */}
          <div className={`grid gap-3 ${quickSaleMode ? 'grid-cols-3 md:grid-cols-4 xl:grid-cols-6' : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'}`}>
            {filteredProducts.map((product: Product) => {
              const inCart = cart.find(item => item.productId === product.id)
              return (
                <Card
                  key={product.id}
                  data-product-id={product.id}
                  className={`pos-quick-action cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                    inCart ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                  } ${quickSaleMode ? 'p-2' : 'p-4'}`}
                  onClick={() => addToCart(product)}
                >
                  <CardContent className={`${quickSaleMode ? 'p-2' : 'p-4'} space-y-2`}>
                    <div className={`font-medium text-sm leading-tight ${quickSaleMode ? 'text-xs' : ''} truncate`}>
                      {product.name}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-primary ${quickSaleMode ? 'text-sm' : 'text-lg'}`}>
                        R$ {product.salePrice.toFixed(2)}
                      </span>
                      <div className="flex gap-1">
                        <Badge variant="outline" className={`text-xs ${quickSaleMode ? 'px-1 py-0 text-xs' : ''}`}>
                          {product.inventory?.salePointQuantity ?? 0}
                        </Badge>
                        {(product.inventory?.coldRoomAlert || product.inventory?.houseAlert || product.inventory?.salePointAlert) && (
                          <Badge variant="destructive" className={`text-xs ${quickSaleMode ? 'px-1 py-0 text-xs' : ''}`}>
                            ⚠️
                          </Badge>
                        )}
                        {inCart && (
                          <Badge className={`bg-primary text-primary-foreground ${quickSaleMode ? 'px-1 py-0 text-xs' : ''}`}>
                            {inCart.quantity}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {!quickSaleMode && (
                      <div className="text-xs text-muted-foreground">{product.size}</div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Carrinho - 1/3 da tela */}
        <div className="space-y-4">
          <Card className="pos-metric-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Carrinho
                </span>
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
                      <div key={item.productId} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{item.name}</div>
                          <div className="text-xs text-muted-foreground">R$ {item.price.toFixed(2)} cada</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateQuantity(item.productId, item.quantity - 1)
                              }}
                              className="h-7 w-7 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateQuantity(item.productId, item.quantity + 1)
                              }}
                              className="h-7 w-7 p-0"
                              disabled={item.quantity >= item.stock}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFromCart(item.productId)
                            }}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Método de Pagamento */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Método de Pagamento</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPaymentMethod('cash')}
                        className="flex items-center gap-2"
                      >
                        <DollarSign className="w-4 h-4" />
                        Dinheiro
                      </Button>
                      <Button
                        variant={paymentMethod === 'card' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPaymentMethod('card')}
                        className="flex items-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        Cartão
                      </Button>
                      <Button
                        variant={paymentMethod === 'pix' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPaymentMethod('pix')}
                        className="flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        PIX
                      </Button>
                    </div>
                  </div>

                  {/* Cálculo de Troco (apenas para dinheiro) */}
                  {paymentMethod === 'cash' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Subtotal:</span>
                        <span className="text-lg font-bold">R$ {total.toFixed(2)}</span>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="received" className="text-sm">Valor Recebido</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="received"
                            type="number"
                            step="0.01"
                            min={total.toFixed(2)}
                            value={receivedAmount}
                            onChange={(e) => {
                              setReceivedAmount(e.target.value)
                              setShowChange(Number(e.target.value) >= total)
                            }}
                            placeholder="0,00"
                            className="pl-10"
                          />
                        </div>
                      </div>

                      {showChange && received > 0 && (
                        <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-green-800 dark:text-green-200">Troco:</span>
                            <span className="text-lg font-bold text-green-600">R$ {change.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Total e Ações */}
                  <div className="space-y-3">
                    {paymentMethod !== 'cash' && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total:</span>
                        <span className="text-xl font-bold text-primary">R$ {total.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => setCart([])} className="w-full">
                        <X className="w-4 h-4 mr-2" />
                        Limpar
                      </Button>
                      <Button
                        onClick={finalizeSale}
                        disabled={saleLoading || (paymentMethod === 'cash' && !showChange)}
                        className="w-full pos-action-button"
                      >
                        {saleLoading ? (
                          'Processando...'
                        ) : (
                          <>
                            <Receipt className="w-4 h-4 mr-2" />
                            Finalizar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Carrinho vazio</p>
                  <p className="text-sm">Adicione produtos para iniciar uma venda</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setQuickSaleMode(!quickSaleMode)}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {quickSaleMode ? 'Modo Normal' : 'Modo Rápido'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
        </TabsContent>
      </Tabs>
    </SidebarLayout>
  )
}