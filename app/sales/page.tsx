"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { SidebarLayout } from "@/components/SidebarLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useProducts, type Product } from "@/lib/useProducts"
import { useSales } from "@/lib/useSales"
import { cn } from "@/lib/utils"
import {
  Plus,
  Minus,
  X,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Receipt,
  Zap,
  Search,
  Package,
  CircleDollarSign
} from "lucide-react"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
})

export default function SalesPage() {
  const { data: products = [], isLoading: loading } = useProducts()
  const { createSale } = useSales()

  const [cart, setCart] = useState<Array<{ productId: string; name: string; price: number; quantity: number; stock: number }>>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSize, setSelectedSize] = useState("all")
  const [saleLoading, setSaleLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "pix">("cash")
  const [receivedAmount, setReceivedAmount] = useState("")
  const [showChange, setShowChange] = useState(false)
  const [quickSaleMode, setQuickSaleMode] = useState(false)
  const [customerName, setCustomerName] = useState("")

  useEffect(() => {
    const hasAlerts = products.some(
      (product: Product) =>
        product.inventory?.coldRoomAlert ||
        product.inventory?.houseAlert ||
        product.inventory?.salePointAlert
    )

    if (hasAlerts) {
      const audio = new Audio("/alert.mp3")
      audio.play().catch(() => {})
    }
  }, [products])

  const sizes = useMemo(
    () => [
      "all",
      ...Array.from(
        new Set(
          products
            .map((product) => product.size)
            .filter((size): size is string => Boolean(size))
        )
      )
    ],
    [products]
  )

  const filteredProducts = useMemo(() => {
    const lowerSearch = searchTerm.trim().toLowerCase()
    return products.filter((product: Product) => {
      const matchesSearch =
        lowerSearch.length === 0 ||
        product.name.toLowerCase().includes(lowerSearch) ||
        product.size.toLowerCase().includes(lowerSearch)
      const matchesSize = selectedSize === "all" || product.size === selectedSize
      return matchesSearch && matchesSize && (product.inventory?.salePointQuantity ?? 0) > 0
    })
  }, [products, searchTerm, selectedSize])

  const addToCart = useCallback(
    (product: Product, quantity = 1) => {
      const stock = product.inventory?.salePointQuantity ?? 0
      setCart((currentCart) => {
        const existingItem = currentCart.find((item) => item.productId === product.id)
        if (existingItem) {
          return currentCart.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: Math.min(item.quantity + quantity, stock) }
              : item
          )
        }

        return [
          ...currentCart,
          {
            productId: product.id,
            name: product.name,
            price: product.salePrice,
            quantity: Math.min(quantity, stock),
            stock
          }
        ]
      })

      const card = document.querySelector(`[data-product-id="${product.id}"]`)
      if (card) {
        card.classList.add("animate-pulse")
        setTimeout(() => card.classList.remove("animate-pulse"), 300)
      }
    },
    []
  )

  const updateQuantity = useCallback((productId: string, newQuantity: number) => {
    setCart((currentCart) => {
      if (newQuantity <= 0) {
        return currentCart.filter((item) => item.productId !== productId)
      }
      return currentCart.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(newQuantity, item.stock) }
          : item
      )
    })
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart((currentCart) => currentCart.filter((item) => item.productId !== productId))
  }, [])

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart])
  const itemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart])
  const received = Number(receivedAmount) || 0
  const change = received - total

  const finalizeSale = useCallback(async () => {
    if (cart.length === 0) return
    setSaleLoading(true)
    try {
      const items = cart.map((item) => ({ productId: item.productId, quantity: item.quantity }))
      await createSale({
        items,
        paymentMethod,
        customerName: customerName.trim() || undefined
      })
      setCart([])
      setReceivedAmount("")
      setShowChange(false)
      setCustomerName("")

      const audio = new Audio("/alert.mp3")
      audio.play().catch(() => {})
    } finally {
      setSaleLoading(false)
    }
  }, [cart, createSale, customerName, paymentMethod])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "F1") {
        event.preventDefault()
        setQuickSaleMode((previous) => !previous)
      }
      if (event.key === "F2") {
        event.preventDefault()
        setCart([])
      }
      if (event.key === "Enter" && cart.length > 0 && !event.shiftKey) {
        event.preventDefault()
        finalizeSale()
      }
      if (event.key === "Escape") {
        event.preventDefault()
        setCart([])
      }
      if (event.key === "Enter" && event.shiftKey && paymentMethod === "cash") {
        event.preventDefault()
        document.getElementById("received")?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [cart.length, finalizeSale, paymentMethod])

  const totalSalePointStock = useMemo(
    () => products.reduce((sum, product) => sum + (product.inventory?.salePointQuantity ?? 0), 0),
    [products]
  )

  const totalSalePointValue = useMemo(
    () =>
      products.reduce(
        (sum, product) => sum + product.salePrice * (product.inventory?.salePointQuantity ?? 0),
        0
      ),
    [products]
  )

  const heroStats = useMemo(
    () => [
      {
        label: "Produtos disponíveis",
        value: filteredProducts.length,
        helper: `${products.length} cadastrados`,
        icon: Package
      },
      {
        label: "Itens no carrinho",
        value: itemCount,
        helper: currencyFormatter.format(total),
        icon: ShoppingCart
      },
      {
        label: "Estoque no ponto de venda",
        value: totalSalePointStock,
        helper: currencyFormatter.format(totalSalePointValue),
        icon: CircleDollarSign
      }
    ],
    [filteredProducts.length, products.length, itemCount, total, totalSalePointStock, totalSalePointValue]
  )

  const quickActions = useMemo(
    () => [
      {
        title: quickSaleMode ? "Modo normal" : "Modo venda rápida",
        description: quickSaleMode
          ? "Volte a visualizar cards detalhados para orientar o cliente."
          : "Ative cartões compactos para registrar pedidos pelo tablet mais rápido.",
        icon: Zap,
        buttonIcon: Zap,
        cta: quickSaleMode ? "Cards detalhados" : "Ativar modo rápido",
        variant: quickSaleMode ? ("outline" as const) : ("default" as const),
        onClick: () => setQuickSaleMode((previous) => !previous)
      },
      {
        title: "Limpar carrinho",
        description: "Apague a seleção atual e comece uma nova venda.",
        icon: X,
        buttonIcon: X,
        cta: "Esvaziar",
        variant: "outline" as const,
        onClick: () => setCart([]),
        disabled: cart.length === 0
      },
      {
        title: "Finalizar venda",
        description: "Confirme o pagamento e registre a saída no mesmo instante.",
        icon: Receipt,
        buttonIcon: Receipt,
        cta: "Finalizar",
        variant: "default" as const,
        onClick: () => finalizeSale(),
        disabled: cart.length === 0 || saleLoading || (paymentMethod === "cash" && !showChange)
      }
    ],
    [cart.length, finalizeSale, paymentMethod, quickSaleMode, saleLoading, showChange]
  )

  if (loading) {
    return (
      <SidebarLayout>
        <div className="space-y-6 pb-8">
          <SalesPageSkeleton />
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      <div className="space-y-6 pb-8">
        <Card className="border-none bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 shadow-none">
          <CardHeader className="pb-4">
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-primary/15 text-primary">
                PDV em tempo real
              </Badge>
              <CardTitle className="text-2xl md:text-3xl">Central de vendas</CardTitle>
              <p className="max-w-3xl text-sm text-muted-foreground">
                Selecione produtos rapidamente, mantenha o carrinho visível e finalize pagamentos sem sair do tablet.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between rounded-lg border border-white/40 bg-white/60 p-4 backdrop-blur-md dark:border-border dark:bg-background/40"
                >
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-semibold tracking-tight">
                      {typeof stat.value === "number" ? stat.value.toLocaleString("pt-BR") : stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.helper}</p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <stat.icon className="size-5" />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                const ButtonIcon = action.buttonIcon
                return (
                  <div
                    key={action.title}
                    className="flex flex-col justify-between rounded-lg border border-white/40 bg-white/70 p-4 backdrop-blur dark:border-border dark:bg-background/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold leading-tight">{action.title}</p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant={action.variant}
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className={cn("mt-4 self-start", action.variant === "outline" && "border-dashed")}
                    >
                      <ButtonIcon className="mr-2 size-4" />
                      {action.cta}
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtrar catálogo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por nome ou tamanho"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="w-full sm:w-auto sm:min-w-[180px]">
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tamanhos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tamanhos</SelectItem>
                    {sizes
                      .filter((size) => size !== "all")
                      .map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <kbd className="rounded bg-muted px-1 py-0.5 text-xs">F1</kbd>
                Modo rápido
              </div>
              <div className="flex items-center gap-1">
                <kbd className="rounded bg-muted px-1 py-0.5 text-xs">F2</kbd>
                Limpar carrinho
              </div>
              <div className="flex items-center gap-1">
                <kbd className="rounded bg-muted px-1 py-0.5 text-xs">Enter</kbd>
                Finalizar venda
              </div>
              <div className="flex items-center gap-1">
                <kbd className="rounded bg-muted px-1 py-0.5 text-xs">Shift + Enter</kbd>
                Digitar troco
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[2fr,1fr]">
          <Card className="h-full">
            <CardHeader className="flex flex-wrap items-center justify-between gap-3 pb-3">
              <CardTitle className="text-base">Produtos disponíveis</CardTitle>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {filteredProducts.length} produto(s)
              </Badge>
            </CardHeader>
            <CardContent>
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
                  <Package className="size-10" />
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Nenhum produto encontrado</p>
                    <p className="text-sm">Ajuste a busca ou exiba todos os tamanhos.</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedSize("all")
                    }}
                  >
                    Limpar filtros
                  </Button>
                </div>
              ) : (
                <div
                  className={cn(
                    "grid gap-3",
                    quickSaleMode
                      ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  )}
                >
                  {filteredProducts.map((product: Product) => {
                    const stock = product.inventory?.salePointQuantity ?? 0
                    const inCart = cart.find((item) => item.productId === product.id)
                    const hasAlert =
                      product.inventory?.coldRoomAlert ||
                      product.inventory?.houseAlert ||
                      product.inventory?.salePointAlert
                    return (
                      <Card
                        key={product.id}
                        data-product-id={product.id}
                        onClick={() => addToCart(product)}
                        className={cn(
                          "group cursor-pointer border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
                          inCart ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                        )}
                      >
                        <CardContent className={cn("space-y-3", quickSaleMode ? "p-3" : "p-4")}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <p
                                className={cn(
                                  "font-semibold leading-tight",
                                  quickSaleMode ? "text-xs" : "text-sm"
                                )}
                              >
                                {product.name}
                              </p>
                              {!quickSaleMode && (
                                <p className="text-xs text-muted-foreground">{product.size}</p>
                              )}
                              {!quickSaleMode && (
                                <Badge variant="outline" className="text-[0.65rem] uppercase tracking-tight">
                                  {product.category || "Sem categoria"}
                                </Badge>
                              )}
                            </div>
                            <Badge variant="secondary" className="bg-muted font-mono text-xs text-foreground">
                              {stock} un
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                "font-semibold text-primary",
                                quickSaleMode ? "text-sm" : "text-xl"
                              )}
                            >
                              {currencyFormatter.format(product.salePrice)}
                            </span>
                            <div className="flex items-center gap-1">
                              {hasAlert && (
                                <Badge variant="destructive" className="text-[0.65rem] uppercase tracking-tight">
                                  Alerta
                                </Badge>
                              )}
                              {inCart && (
                                <Badge className="bg-primary text-primary-foreground text-[0.65rem]">
                                  {inCart.quantity}x
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="size-5" />
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
                  <div className="max-h-[22rem] space-y-3 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between rounded-lg border bg-muted/40 p-3 transition-colors hover:bg-muted/60"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {currencyFormatter.format(item.price)} cada
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation()
                                updateQuantity(item.productId, item.quantity - 1)
                              }}
                              className="h-7 w-7 p-0"
                            >
                              <Minus className="size-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation()
                                updateQuantity(item.productId, item.quantity + 1)
                              }}
                              className="h-7 w-7 p-0"
                              disabled={item.quantity >= item.stock}
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation()
                              removeFromCart(item.productId)
                            }}
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="size-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="customer-name" className="text-sm font-medium">
                        Cliente (opcional)
                      </Label>
                      <Input
                        id="customer-name"
                        value={customerName}
                        onChange={(event) => setCustomerName(event.target.value)}
                        placeholder="Nome do cliente"
                        autoComplete="name"
                        inputMode="text"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Método de pagamento</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant={paymentMethod === "cash" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPaymentMethod("cash")}
                          className="flex items-center gap-2"
                        >
                          <DollarSign className="size-4" />
                          Dinheiro
                        </Button>
                        <Button
                          variant={paymentMethod === "card" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPaymentMethod("card")}
                          className="flex items-center gap-2"
                        >
                          <CreditCard className="size-4" />
                          Cartão
                        </Button>
                        <Button
                          variant={paymentMethod === "pix" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPaymentMethod("pix")}
                          className="flex items-center gap-2"
                        >
                          <Zap className="size-4" />
                          PIX
                        </Button>
                      </div>
                    </div>

                    {paymentMethod === "cash" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Subtotal</span>
                          <span className="text-lg font-semibold text-foreground">
                            {currencyFormatter.format(total)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="received" className="text-sm font-medium">
                            Valor recebido
                          </Label>
                          <div className="relative">
                            <DollarSign className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="received"
                              type="number"
                              step="0.01"
                              min={total > 0 ? total.toFixed(2) : undefined}
                              value={receivedAmount}
                              onChange={(event) => {
                                setReceivedAmount(event.target.value)
                                setShowChange(Number(event.target.value) >= total)
                              }}
                              placeholder="0,00"
                              className="pl-9"
                            />
                          </div>
                        </div>
                        {showChange && received > 0 && (
                          <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/20">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-green-700 dark:text-green-200">Troco</span>
                              <span className="text-lg font-semibold text-green-600">
                                {currencyFormatter.format(change)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {paymentMethod !== "cash" && (
                      <div className="flex items-center justify-between rounded-lg border border-muted bg-muted/40 px-3 py-2 text-sm font-medium">
                        <span>Total</span>
                        <span className="text-lg font-semibold text-primary">
                          {currencyFormatter.format(total)}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => setCart([])} className="w-full">
                        <X className="mr-2 size-4" />
                        Limpar
                      </Button>
                      <Button
                        onClick={finalizeSale}
                        disabled={saleLoading || cart.length === 0 || (paymentMethod === "cash" && !showChange)}
                        className="w-full"
                      >
                        {saleLoading ? (
                          "Processando..."
                        ) : (
                          <>
                            <Receipt className="mr-2 size-4" />
                            Finalizar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                  <ShoppingCart className="size-12 opacity-60" />
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Carrinho vazio</p>
                    <p className="text-sm">Adicione produtos à esquerda para iniciar uma venda.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setQuickSaleMode((previous) => !previous)}>
                    <Zap className="mr-2 size-4" />
                    {quickSaleMode ? "Modo detalhado" : "Modo rápido"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  )
}

function SalesPageSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="border-none">
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3 pt-6">
          <Skeleton className="h-10 w-full" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-[2fr,1fr]">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-6 w-40" />
            <div className="grid gap-3 sm:grid-cols-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20" />
            <Skeleton className="h-32" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
