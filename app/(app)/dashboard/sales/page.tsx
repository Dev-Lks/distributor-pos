"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useProducts, type Product } from "@/lib/useProducts"
import { useSales } from "@/lib/useSales"
import { usePointsOfSale, type PointOfSale } from "@/lib/usePointsOfSale"
import { toast } from "sonner"
import { MapPin } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { usePullToRefresh } from "@/lib/usePullToRefresh"
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator"

// Componentes modulares
import { CartSection } from "./components/CartSection"
import { ProductGrid } from "./components/ProductGrid"
import { PaymentPanel } from "./components/PaymentPanel"
import { CustomerCheckoutDialog } from "./components/CustomerCheckoutDialog"
import { CashSessionPanel } from "./components/CashSessionPanel"
import {
  OpenSessionDialog,
  TransactionDialog,
  CloseSessionDialog,
} from "./components/CashDialogs"

// Hooks customizados
import { useCart } from "./hooks/useCart"
import { useCheckout } from "./hooks/useCheckout"
import { useCashSessionControls } from "./hooks/useCashSessionControls"
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts"

// Hardware integrations
import { useBarcodeScanner } from "@/lib/hardware/useBarcodeScanner"
import { useThermalPrinter } from "@/lib/hardware/useThermalPrinter"
import { BarcodeInput } from "@/components/hardware/BarcodeInput"
import { PrinterStatus } from "@/components/hardware/PrinterStatus"
import { HardwareSettings } from "@/components/hardware/HardwareSettings"

export default function SalesPage() {
  const queryClient = useQueryClient()

  // Pull to refresh
  const { isPulling, isRefreshing, progress, pullDistance } = usePullToRefresh({
    onRefresh: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] })
      await queryClient.invalidateQueries({ queryKey: ["points"] })
      await queryClient.invalidateQueries({ queryKey: ["cash-session"] })
    },
  })

  // Data fetching
  const { data: products = [], isLoading: loading } = useProducts()
  const { data: pointsData = [], isLoading: pointsLoading } = usePointsOfSale()
  
  const pointOptions = useMemo(
    () =>
      Array.isArray(pointsData)
        ? (pointsData as PointOfSale[]).filter((point) => point.isActive)
        : [],
    [pointsData]
  )

  // Point of Sale selection
  const [selectedPointOfSaleId, setSelectedPointOfSaleId] = useState<string | null>(null)
  
  const activePointOfSale = useMemo(
    () => pointOptions.find((point) => point.id === selectedPointOfSaleId) ?? null,
    [pointOptions, selectedPointOfSaleId]
  )

  // Hooks customizados
  const { createSale } = useSales(selectedPointOfSaleId ?? undefined)
  const cashSessionControls = useCashSessionControls(selectedPointOfSaleId)
  const {
    cart,
    addToCart: addToCartHook,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getItemCount,
  } = useCart()

  // Payment and sale state
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "pix">("cash")
  const [quickSaleMode, setQuickSaleMode] = useState(false)

  // Customer checkout dialog
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false)

  // Cash session dialogs
  const [isOpenSessionDialogOpen, setIsOpenSessionDialogOpen] = useState(false)
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
  const [isCloseSessionDialogOpen, setIsCloseSessionDialogOpen] = useState(false)
  
  // Hardware settings dialog
  const [isHardwareSettingsOpen, setIsHardwareSettingsOpen] = useState(false)

  const total = getCartTotal()
  const itemCount = getItemCount()
  const isSessionOpen = cashSessionControls.session?.status === "OPEN"

  // Checkout hook
  const { isProcessing, finalizeSale } = useCheckout()

  // Persist point of sale selection
  useEffect(() => {
    if (typeof window === "undefined") return
    const storedPoint = window.localStorage.getItem("nitro-active-point-of-sale")
    if (storedPoint !== null) {
      setSelectedPointOfSaleId(storedPoint === "null" ? null : storedPoint)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (selectedPointOfSaleId === null) {
      window.localStorage.setItem("nitro-active-point-of-sale", "null")
    } else {
      window.localStorage.setItem("nitro-active-point-of-sale", selectedPointOfSaleId)
    }
  }, [selectedPointOfSaleId])

  // Auto-select first point if none selected
  useEffect(() => {
    if (pointOptions.length === 0) return
    setSelectedPointOfSaleId((current) => {
      if (current && pointOptions.some((point) => point.id === current)) {
        return current
      }
      return pointOptions[0]?.id ?? null
    })
  }, [pointOptions])

  // Sound alert for low stock
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

  // Enrich products with stock from selected point
  const enrichedProducts = useMemo(() => {
    return products.map((product) => ({
      ...product,
      stock: selectedPointOfSaleId
        ? product.productPointsOfSale?.find(
            (pps) => pps.pointOfSaleId === selectedPointOfSaleId
          )?.quantity ?? 0
        : product.inventory?.salePointQuantity ?? 0,
    }))
  }, [products, selectedPointOfSaleId])

  // Hardware: Barcode Scanner
  const handleBarcodeScan = useCallback((barcode: string) => {
    // Buscar produto pelo código de barras
    const product = enrichedProducts.find(p => p.barcode === barcode)
    
    if (product) {
      addToCart(product)
      toast.success(`Produto adicionado: ${product.name}`)
    } else {
      toast.error("Produto não encontrado")
    }
  }, [enrichedProducts])

  const { isScanning, scanHistory } = useBarcodeScanner({
    enabled: true,
    onScan: handleBarcodeScan,
    onError: (error) => toast.error(error),
  })

  // Hardware: Thermal Printer
  const { status: printerStatus, isPrinting, print: printReceipt } = useThermalPrinter()

  // Add to cart with visual feedback
  const addToCart = useCallback(
    (product: Product) => {
      const enriched = enrichedProducts.find((p) => p.id === product.id)
      if (!enriched) return

      addToCartHook({
        id: product.id,
        name: product.name,
        salePrice: product.salePrice,
        stock: enriched.stock,
      })

      // Visual feedback
      const card = document.querySelector(`[data-product-id="${product.id}"]`)
      if (card) {
        card.classList.add("animate-pulse")
        setTimeout(() => card.classList.remove("animate-pulse"), 300)
      }
    },
    [enrichedProducts, addToCartHook]
  )

  // Handle sale finalization
  const handleFinalizeSale = useCallback(async () => {
    if (!isSessionOpen) {
      toast.error("Abra o caixa antes de registrar a venda.")
      return
    }

    // Sempre abrir o modal de cliente
    setCustomerDialogOpen(true)
  }, [isSessionOpen])

  // Função auxiliar para finalizar venda com sucesso
  const completeSale = useCallback(async (customerData?: any, customerId?: string) => {
    await finalizeSale({
      cart,
      paymentMethod,
      pointOfSaleId: selectedPointOfSaleId!,
      customerData: customerData ? {
        ...customerData,
        customerId: customerId || undefined,
      } : undefined,
      onSuccess: async (sale) => {
        clearCart()
        setCustomerDialogOpen(false)
        const audio = new Audio("/alert.mp3")
        audio.play().catch(() => {})
        
        // Imprimir recibo automaticamente
        if (printerStatus.connected && sale) {
          try {
            await printReceipt(sale, 'sale')
            toast.success("Recibo impresso!")
          } catch (error) {
            toast.error("Erro ao imprimir recibo")
          }
        }
      },
      createSale,
    })
  }, [finalizeSale, cart, paymentMethod, selectedPointOfSaleId, clearCart, createSale, printerStatus, printReceipt])

  // Handler para quando seleciona um cliente existente
  const handleSaveWithCustomer = useCallback(async (customer: any) => {
    await completeSale({
      name: customer.name,
      phone: customer.phone || undefined,
      address: customer.address || undefined,
    }, customer.id)
  }, [completeSale])

  // Handler para cadastrar novo cliente
  const handleSaveWithNewCustomer = useCallback(async (data: { name: string; phone: string; address: string; document?: string }) => {
    // Criar o cliente primeiro
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || "Erro ao criar cliente")
        return
      }

      const newCustomer = await response.json()
      
      // Finalizar venda com o novo cliente
      await completeSale({
        name: newCustomer.name,
        phone: newCustomer.phone || undefined,
        address: newCustomer.address || undefined,
      }, newCustomer.id)

      toast.success("Cliente cadastrado com sucesso!")
    } catch (error) {
      console.error("Erro ao criar cliente:", error)
      toast.error("Erro ao cadastrar cliente")
    }
  }, [completeSale])

  // Handler para finalizar sem cliente
  const handleSaveWithoutCustomer = useCallback(async () => {
    await completeSale()
  }, [completeSale])

  // Cash session handlers
  const handleOpenSession = useCallback(
    async (amount: number, notes?: string) => {
      const success = await cashSessionControls.handleOpenSession(amount, notes)
      if (success) {
        setIsOpenSessionDialogOpen(false)
      }
    },
    [cashSessionControls]
  )

  const handleTransaction = useCallback(
    async (
      type: "SUPPLY" | "WITHDRAWAL" | "ADJUSTMENT",
      amount: number,
      description?: string
    ) => {
      const success = await cashSessionControls.handleTransaction(type, amount, description)
      if (success) {
        setIsTransactionDialogOpen(false)
      }
    },
    [cashSessionControls]
  )

  const handleCloseSession = useCallback(
    async (closingAmount: number, notes?: string) => {
      const success = await cashSessionControls.handleCloseSession(closingAmount, notes)
      if (success) {
        setIsCloseSessionDialogOpen(false)
      }
    },
    [cashSessionControls]
  )

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onF1: () => setQuickSaleMode((prev) => !prev),
    onF2: () => clearCart(),
    onEscape: () => clearCart(),
    onEnter: handleFinalizeSale,
    enabled: !customerDialogOpen && !isOpenSessionDialogOpen && !isTransactionDialogOpen && !isCloseSessionDialogOpen,
  })

  if (pointsLoading) {
    return (
      <>
        <PullToRefreshIndicator
          isPulling={isPulling}
          isRefreshing={isRefreshing}
          progress={progress}
          pullDistance={pullDistance}
        />
        <div className="container mx-auto">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        progress={progress}
        pullDistance={pullDistance}
      />
      <div className="container mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">PDV</h1>
          <p className="text-sm text-muted-foreground">
            Ponto de venda rápido e eficiente
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Printer Status */}
          <PrinterStatus 
            status={printerStatus} 
            isPrinting={isPrinting}
            onClick={() => setIsHardwareSettingsOpen(true)}
          />

          {/* Point of Sale Selector */}
          <Card className="lg:w-80">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Ponto de Venda
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <Select
                value={selectedPointOfSaleId ?? ""}
                onValueChange={(value) => setSelectedPointOfSaleId(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {pointOptions.map((point) => (
                    <SelectItem key={point.id} value={point.id}>
                      {point.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Barcode Scanner Input */}
      <BarcodeInput
        onScan={handleBarcodeScan}
        onError={(error) => toast.error(error)}
        enabled={!!selectedPointOfSaleId && isSessionOpen}
        isScanning={isScanning}
        scanHistory={scanHistory}
        showHistory={true}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column - Products */}
        <div className="lg:col-span-8 space-y-4">
          <ProductGrid
            products={products}
            loading={loading}
            onAddToCart={addToCart}
            selectedPointOfSaleId={selectedPointOfSaleId}
            quickMode={quickSaleMode}
            onQuickModeChange={setQuickSaleMode}
          />
        </div>

        {/* Right Column - Cart, Payment & Cash */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-4 space-y-3">
            {/* Cart */}
            <CartSection
              cart={cart}
              onUpdateQuantity={updateQuantity}
              onRemove={removeFromCart}
              onClear={clearCart}
              total={total}
              itemCount={itemCount}
            />

            {/* Payment Panel */}
            <PaymentPanel
              total={total}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              onFinalizeSale={handleFinalizeSale}
              disabled={cart.length === 0 || !isSessionOpen}
              loading={isProcessing}
            />

            {/* Cash Session Panel */}
            <CashSessionPanel
              session={cashSessionControls.session ?? null}
              loading={cashSessionControls.isLoading}
              onOpenSession={() => setIsOpenSessionDialogOpen(true)}
              onRegisterTransaction={() => setIsTransactionDialogOpen(true)}
              onCloseSession={() => setIsCloseSessionDialogOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CustomerCheckoutDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        onSaveWithCustomer={handleSaveWithCustomer}
        onSaveWithNewCustomer={handleSaveWithNewCustomer}
        onSaveWithoutCustomer={handleSaveWithoutCustomer}
      />

      <OpenSessionDialog
        open={isOpenSessionDialogOpen}
        onOpenChange={setIsOpenSessionDialogOpen}
        onConfirm={handleOpenSession}
        loading={cashSessionControls.isOpening}
      />

      <TransactionDialog
        open={isTransactionDialogOpen}
        onOpenChange={setIsTransactionDialogOpen}
        onConfirm={handleTransaction}
        loading={cashSessionControls.isRegisteringTransaction}
      />

      <CloseSessionDialog
        open={isCloseSessionDialogOpen}
        onOpenChange={setIsCloseSessionDialogOpen}
        onConfirm={handleCloseSession}
        session={cashSessionControls.session ?? null}
        loading={cashSessionControls.isClosing}
      />

      {/* Hardware Settings */}
      {selectedPointOfSaleId && (
        <HardwareSettings 
          pointOfSaleId={selectedPointOfSaleId}
          open={isHardwareSettingsOpen}
          onOpenChange={setIsHardwareSettingsOpen}
        />
      )}
    </div>
    </>
  )
}
