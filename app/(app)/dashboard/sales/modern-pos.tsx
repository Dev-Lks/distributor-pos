"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Scan,
  Printer,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Smartphone,
  User,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Package,
  Zap,
  DollarSign,
  Calendar,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Hooks e tipos
import { useProducts, type Product } from "@/lib/useProducts"
import { useSales } from "@/lib/useSales"
import { usePointsOfSale } from "@/lib/usePointsOfSale"
import { useBarcodeScanner } from "@/lib/hardware/useBarcodeScanner"
import { useThermalPrinter } from "@/lib/hardware/useThermalPrinter"
import { useCashSession } from "@/lib/useCashSession"
import { useQueryClient } from "@tanstack/react-query"

// Componentes de Hardware
import { BarcodeInput } from "@/components/hardware/BarcodeInput"
import { PrinterStatus } from "@/components/hardware/PrinterStatus"

// Sub-componentes do novo PDV
import { POSHeader } from "./components/v2/POSHeader"
import { POSCart } from "./components/v2/POSCart"
import { POSProducts } from "./components/v2/POSProducts"
import { POSPayment } from "./components/v2/POSPayment"
import { POSQuickActions } from "./components/v2/POSQuickActions"
import { POSSessionControl } from "./components/v2/POSSessionControl"
import { POSCustomerDialog } from "./components/v2/POSCustomerDialog"

interface CartItem {
  id: string
  name: string
  size: string
  salePrice: number
  quantity: number
  stock: number
  barcode?: string
  addedVia: "manual" | "barcode"
  addedAt: Date
}

interface Customer {
  id?: string
  name: string
  document?: string
  phone?: string
}

export default function ModernPOSPage() {
  const queryClient = useQueryClient()

  // Data fetching
  const { data: products = [], isLoading: productsLoading } = useProducts()
  const { data: points = [], isLoading: pointsLoading } = usePointsOfSale()
  const { createSale } = useSales()

  // Point of Sale
  const [selectedPointId, setSelectedPointId] = useState<string>("")
  const selectedPoint = useMemo(
    () => points.find((p: any) => p.id === selectedPointId),
    [points, selectedPointId]
  )

  // Cash Session
  const { session, isLoading: sessionLoading } = useCashSession(selectedPointId)
  const isSessionOpen = session?.status === "OPEN"

  // Hardware Integration
  const {
    isScanning,
    lastScanned,
    scanHistory,
  } = useBarcodeScanner({
    enabled: true,
    onScan: handleBarcodeScan,
  })

  const {
    status: printerStatus,
    print: printReceipt,
    testPrint,
  } = useThermalPrinter()

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false)

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "pix">("cash")
  const [cashReceived, setCashReceived] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)

  // UI State
  const [searchQuery, setSearchQuery] = useState("")
  const [showProducts, setShowProducts] = useState(true)
  const [lastSaleId, setLastSaleId] = useState<string | null>(null)

  // Persist point selection
  useEffect(() => {
    const stored = localStorage.getItem("pos-selected-point")
    if (stored && points.some((p: any) => p.id === stored)) {
      setSelectedPointId(stored)
    } else if (points.length > 0) {
      setSelectedPointId(points[0].id)
    }
  }, [points])

  useEffect(() => {
    if (selectedPointId) {
      localStorage.setItem("pos-selected-point", selectedPointId)
    }
  }, [selectedPointId])

  // Keyboard shortcuts
  }, [selectedPointId])

  // Enrich products with stock
  const enrichedProducts = useMemo(() => {
    return products.map((product) => {
      const productPoint = product.productPointsOfSale?.find(
        (pp: any) => pp.pointOfSaleId === selectedPointId
      )
      return {
        ...product,
        availableStock: productPoint?.quantity ?? 0,
      }
    })
  }, [products, selectedPointId])

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return enrichedProducts

    const query = searchQuery.toLowerCase()
    return enrichedProducts.filter(
      (p: any) =>
        p.name.toLowerCase().includes(query) ||
        p.brand?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.barcode?.includes(query)
    )
  }, [enrichedProducts, searchQuery])

  // Cart calculations
  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.salePrice * item.quantity, 0),
    [cart]
  )

  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  )

  const change = useMemo(() => {
    if (paymentMethod !== "cash") return 0
    const received = parseFloat(cashReceived) || 0
    return Math.max(0, received - cartTotal)
  }, [paymentMethod, cashReceived, cartTotal])

  // Barcode scan handler
  async function handleBarcodeScan(barcode: string) {
    try {
      // Try to find product by barcode
      const response = await fetch(`/api/products/barcode/${barcode}`)
      
      if (response.ok) {
        const product = await response.json()
        addToCart(product, "barcode")
        toast.success(`✅ ${product.name} adicionado`, {
          description: "Via código de barras",
        })
      } else {
        // Try alternative endpoint
        const altResponse = await fetch(`/api/products/by-barcode/${barcode}`)
        if (altResponse.ok) {
          const product = await altResponse.json()
          addToCart(product, "barcode")
          toast.success(`✅ ${product.name} adicionado`)
        } else {
          toast.error(`Produto não encontrado: ${barcode}`, {
            description: "Cadastre este produto primeiro",
          })
        }
      }
    } catch (error) {
      console.error("Error scanning barcode:", error)
      toast.error("Erro ao buscar produto")
    }
  }

  // Add product to cart
  function addToCart(product: Product, via: "manual" | "barcode" = "manual") {
    if (!isSessionOpen) {
      toast.error("Abra o caixa antes de vender")
      return
    }

    const stock = enrichedProducts.find((p) => p.id === product.id)?.availableStock ?? 0

    if (stock <= 0) {
      toast.error(`${product.name} sem estoque`)
      return
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)

      if (existing) {
        if (existing.quantity >= stock) {
          toast.warning("Estoque insuficiente")
          return prev
        }
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          size: product.size,
          salePrice: product.salePrice,
          quantity: 1,
          stock,
          barcode: product.barcode,
          addedVia: via,
          addedAt: new Date(),
        },
      ]
    })

    // Visual feedback
    if (via === "barcode") {
      playBeep()
    }
  }

  // Update quantity
  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== productId) return item

          const newQuantity = item.quantity + delta

          if (newQuantity <= 0) return null
          if (newQuantity > item.stock) {
            toast.warning("Estoque insuficiente")
            return item
          }

          return { ...item, quantity: newQuantity }
        })
        .filter(Boolean) as CartItem[]
    )
  }

  // Remove item
  function removeItem(productId: string) {
    setCart((prev) => prev.filter((item) => item.id !== productId))
    toast.info("Item removido do carrinho")
  }

  // Clear cart
  function clearCart() {
    setCart([])
    setCustomer(null)
    setCashReceived("")
    setPaymentMethod("cash")
    setLastSaleId(null)
    toast.success("Carrinho limpo")
  }

  // Finalize sale
  async function finalizeSale() {
    if (!isSessionOpen) {
      toast.error("Abra o caixa primeiro")
      return
    }

    if (cart.length === 0) {
      toast.error("Carrinho vazio")
      return
    }

    if (paymentMethod === "cash") {
      const received = parseFloat(cashReceived) || 0
      if (received < cartTotal) {
        toast.error("Valor recebido insuficiente")
        return
      }
    }

    setIsProcessing(true)

    try {
      const saleData = {
        pointOfSaleId: selectedPointId,
        cashSessionId: session?.id,
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.salePrice,
        })),
        paymentMethod,
        total: cartTotal,
        customerId: customer?.id,
        customerName: customer?.name,
        customerDocument: customer?.document,
        customerPhone: customer?.phone,
      }

      const response = await createSale(saleData as any)

      if (response) {
        setLastSaleId(response.id)
        toast.success("🎉 Venda finalizada!", {
          description: `Total: ${formatCurrency(cartTotal)}`,
        })

        // Auto-print receipt
        const printerConnected = printerStatus?.connected || false
        if (printerConnected) {
          await printSaleReceipt(response.id, response)
        }

        // Clear cart
        setTimeout(() => {
          clearCart()
        }, 1000)

        // Refresh data
        queryClient.invalidateQueries({ queryKey: ["products"] })
        queryClient.invalidateQueries({ queryKey: ["cash-session"] })
      }
    } catch (error) {
      console.error("Error finalizing sale:", error)
      toast.error("Erro ao finalizar venda")
    } finally {
      setIsProcessing(false)
    }
  }

  // Print receipt
  async function printSaleReceipt(saleId: string, saleData: any) {
    try {
      await printReceipt(
        {
          saleId,
          items: cart,
          total: cartTotal,
          paymentMethod,
          customer: customer?.name,
          pointOfSale: selectedPoint?.name,
        },
        "sale"
      )
      toast.success("✅ Recibo impresso")
    } catch (error) {
      console.error("Error printing:", error)
      toast.error("Erro ao imprimir recibo")
    }
  }

  // Reprint last sale
  async function reprintLastSale() {
    if (!lastSaleId) {
      toast.error("Nenhuma venda recente")
      return
    }

    try {
      const response = await fetch(`/api/sales/${lastSaleId}`)
      if (response.ok) {
        const sale = await response.json()
        await printSaleReceipt(lastSaleId, sale)
      }
    } catch (error) {
      toast.error("Erro ao reimprimir")
    }
  }

  // Utility functions
  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  function playBeep() {
    const audio = new Audio("/alert.mp3")
    audio.play().catch(() => {})
  }

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      // F3: Toggle products view
      if (e.key === "F3") {
        e.preventDefault()
        setShowProducts((prev) => !prev)
      }
      // F4: Clear cart
      if (e.key === "F4" && e.shiftKey) {
        e.preventDefault()
        if (confirm("Limpar carrinho?")) {
          clearCart()
        }
      }
      // F9: Open customer dialog
      if (e.key === "F9") {
        e.preventDefault()
        setCustomerDialogOpen(true)
      }
      // F12: Finalize sale
      if (e.key === "F12") {
        e.preventDefault()
        finalizeSale()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [cart, cartTotal, paymentMethod, cashReceived, isSessionOpen])

  // Enrich products with stock
  const enrichedProducts = useMemo(() => {
    return products.map((product) => {
      const productPoint = product.productPointsOfSale?.find(
        (pp: any) => pp.pointOfSaleId === selectedPointId
      )
      return {
        ...product,
        availableStock: productPoint?.quantity ?? 0,
      }
    })
  }, [products, selectedPointId])

  if (productsLoading || pointsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 animate-pulse text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Carregando PDV...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <POSHeader
        points={points}
        selectedPointId={selectedPointId}
        onPointChange={setSelectedPointId}
        session={session}
        printerStatus={printerStatus}
        isScanning={isScanning}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Products (collapsible) */}
        {showProducts && (
          <div className="w-1/2 border-r">
            <POSProducts
              products={filteredProducts}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onProductClick={(p: any) => addToCart(p, "manual")}
              isSessionOpen={isSessionOpen}
            />
          </div>
        )}

        {/* Right: Cart + Payment */}
        <div className={cn("flex flex-col", showProducts ? "w-1/2" : "w-full")}>
          {/* Barcode Scanner Section */}
          <div className="border-b bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <BarcodeInput
                  onScan={handleBarcodeScan}
                  showHistory={false}
                  enabled={isSessionOpen}
                  autoFocus
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowProducts(!showProducts)}
                title="F3"
              >
                <Package className="h-4 w-4" />
              </Button>
            </div>
            {isScanning && (
              <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-600" />
                Scanner ativo - Escaneie produtos
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="flex-1 overflow-hidden">
            <POSCart
              cart={cart}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
              onClearCart={clearCart}
              customer={customer}
              onCustomerClick={() => setCustomerDialogOpen(true)}
            />
          </div>

          {/* Payment */}
          <div className="border-t">
            <POSPayment
              total={cartTotal}
              itemCount={cartItemCount}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              cashReceived={cashReceived}
              onCashReceivedChange={setCashReceived}
              change={change}
              isProcessing={isProcessing}
              onFinalize={finalizeSale}
              canFinalize={isSessionOpen && cart.length > 0}
              printerConnected={printerStatus?.connected || false}
              onReprint={reprintLastSale}
              hasLastSale={!!lastSaleId}
            />
          </div>
        </div>
      </div>

      {/* Session Control */}
      <POSSessionControl
        session={session}
        pointOfSaleId={selectedPointId}
        isLoading={sessionLoading}
      />

      {/* Customer Dialog */}
      <POSCustomerDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        customer={customer}
        onCustomerSet={setCustomer}
      />
    </div>
  )
}
