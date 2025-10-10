"use client"

import React, { useMemo, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useProducts, type Product } from "@/lib/useProducts"
import { usePointsOfSale, type PointOfSale } from "@/lib/usePointsOfSale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { handleError } from "@/lib/errors"
import { logger } from "@/lib/logger"
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  CircleDollarSign,
  Edit2,
  Gift,
  Package,
  Plus,
  Search,
  Snowflake,
  Home,
  Store,
  Upload,
  FileDown,
  Loader2,
  X,
  BarChart3,
  TrendingUp,
  Calendar,
  ClipboardCheck,
  History
} from "lucide-react"

// Importar novos componentes avançados
import { AdvancedFilters } from "@/components/inventory/AdvancedFilters"
import { BulkToolbar } from "@/components/inventory/BulkToolbar"
import { InventoryDashboard } from "@/components/inventory/InventoryDashboard"
import { InventoryHistoryDialog } from "@/components/inventory/InventoryHistoryDialog"
import { ABCAnalysisTab } from "@/components/inventory/ABCAnalysisTab"
import { DemandForecastCard } from "@/components/inventory/DemandForecastCard"
import { ExpirationAlertsCard } from "@/components/inventory/ExpirationAlertsCard"
import { BatchManagementTab } from "@/components/inventory/BatchManagementTab"
import { AuditManagementTab } from "@/components/inventory/AuditManagementTab"
import { MovementHistoryTab } from "@/components/inventory/MovementHistoryTab"
import { ProductQuickActions } from "@/components/inventory/ProductQuickActions"
import { StockLevelBar } from "@/components/inventory/StockLevelBar"
import { LocationPills } from "@/components/inventory/LocationPills"
import { ProductHealthScore } from "@/components/inventory/ProductHealthScore"
import { ViewToggle, type ViewType } from "@/components/inventory/ViewToggle"
import { ProductCard } from "@/components/inventory/ProductCard"
import { DistributeStockDialog } from "@/components/inventory/DistributeStockDialog"
import { AddStockDialog } from "@/components/inventory/AddStockDialog"

// Sprint 2: Pull-to-Refresh e Gestos
import { usePullToRefresh } from "@/lib/usePullToRefresh"
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator"

// Hardware
import { useBarcodeScanner } from "@/lib/hardware/useBarcodeScanner"
import { BarcodeInput } from "@/components/hardware/BarcodeInput"

type Location = "coldRoom" | "house" | "salePoint"
type ProductInventory = NonNullable<Product["inventory"]>

type LocationConfig = {
  label: string
  description: string
  accent: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
})

const locationConfig: Record<Location, LocationConfig> = {
  coldRoom: {
    label: "Câmara Fria",
    description: "Produtos refrigerados",
    accent: "from-sky-500/10 to-sky-500/5 border-sky-500/30",
    icon: Snowflake
  },
  house: {
    label: "Casa",
    description: "Estoque de apoio",
    accent: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/30",
    icon: Home
  },
  salePoint: {
    label: "Pontos de Venda",
    description: "Disponível para venda",
    accent: "from-amber-500/10 to-amber-500/5 border-amber-500/30",
    icon: Store
  }
}

const stockStatusStyles = {
  ok: "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-50",
  warning: "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-50",
  danger: "border-red-200 bg-red-100 text-red-700 dark:border-red-500/40 dark:bg-red-500/20 dark:text-red-50"
}

const COLD_ROOM_LOCATION: Location = "coldRoom"
const QUICK_ADD_PRESETS = [6, 12, 24] as const

function getStockStatus(stock: number, minStock: number) {
  if (stock === 0) {
    return { label: "Esgotado", className: stockStatusStyles.danger }
  }
  if (stock <= minStock) {
    return { label: "Crítico", className: stockStatusStyles.warning }
  }
  return { label: "Saudável", className: stockStatusStyles.ok }
}

const getInventoryQuantity = (inventory: ProductInventory | undefined, location: Location): number => {
  if (!inventory) {
    return 0
  }
  const key = `${location}Quantity` as keyof ProductInventory
  const value = inventory[key]
  return typeof value === "number" ? value : 0
}

function LocationSelector({
  value,
  onChange,
  label,
  className
}: {
  value: Location | null
  onChange: (location: Location) => void
  label: string
  className?: string
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-sm font-semibold text-muted-foreground">{label}</Label>
      <div className="grid gap-3">
        {(Object.keys(locationConfig) as Location[]).map((location) => {
          const { label: locationLabel, description, icon: Icon } = locationConfig[location]
          const isSelected = value === location

          return (
            <button
              key={location}
              type="button"
              onClick={() => onChange(location)}
              className={cn(
                "group flex h-full w-full flex-col items-start gap-3 rounded-lg border p-4 text-left transition-all",
                "hover:border-primary/60 hover:bg-primary/5",
                isSelected && "border-primary bg-primary/10 shadow-sm"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg border",
                    isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted"
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="font-medium leading-tight">{locationLabel}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
              {isSelected && <Badge className="bg-primary/10 text-primary">Selecionado</Badge>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const { data: rawProducts = [], isLoading: loading } = useProducts()
  const { data: pointsData = [], isLoading: pointsLoading } = usePointsOfSale()
  const queryClient = useQueryClient()

  // Estado para seleção em massa
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  const [historyProductId, setHistoryProductId] = useState<string | null>(null)
  const [viewType, setViewType] = useState<ViewType>("table")

  // Estados de filtros e busca
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterAlert, setFilterAlert] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Estados para modais
  const [showAddModal, setShowAddModal] = useState(false)
  const [addProductId, setAddProductId] = useState("")
  const [addProductSearch, setAddProductSearch] = useState("")
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const importInputRef = useRef<HTMLInputElement | null>(null)
  
  // Estado para distribuição de estoque
  const [showDistributeDialog, setShowDistributeDialog] = useState(false)
  const [distributeProductId, setDistributeProductId] = useState<string | null>(null)

  // Estado para filtros avançados
  const [advancedFilters, setAdvancedFilters] = useState<any>({})

  // Sprint 2: Pull-to-Refresh
  const { isPulling, isRefreshing, progress, pullDistance } = usePullToRefresh({
    onRefresh: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] })
      await queryClient.invalidateQueries({ queryKey: ["points"] })
    },
    threshold: 80,
    enabled: true,
  })

  const products = useMemo(
    () =>
      rawProducts.map((product: Product) => ({
        ...product,
        inventory: product.inventory
          ? {
              ...product.inventory,
              coldRoomAlert:
                (product.inventory.coldRoomQuantity ?? 0) <=
                (product.inventory.coldRoomMinStock ?? 10),
              houseAlert:
                (product.inventory.houseQuantity ?? 0) <= (product.inventory.houseMinStock ?? 5),
              salePointAlert:
                (product.inventory.salePointQuantity ?? 0) <=
                (product.inventory.salePointMinStock ?? 2),
              totalQuantity:
                (product.inventory.coldRoomQuantity ?? 0) +
                (product.inventory.houseQuantity ?? 0) +
                (product.inventory.salePointQuantity ?? 0)
            }
          : undefined
      })),
    [rawProducts]
  )

  // Hardware: Barcode Scanner para buscar produtos no inventário
  const handleBarcodeScan = React.useCallback((barcode: string) => {
    const product = products.find(p => p.barcode === barcode)
    
    if (product) {
      // Scrollar até o produto e destacá-lo
      setSearchQuery(product.name)
      // Abrir modal de adicionar estoque com o produto selecionado
      setAddProductId(product.id)
      setShowAddModal(true)
      toast.success(`Produto encontrado: ${product.name}`)
    } else {
      toast.error("Produto não encontrado no inventário")
    }
  }, [products])

  const { isScanning, scanHistory } = useBarcodeScanner({
    enabled: true,
    onScan: handleBarcodeScan,
    onError: (error) => toast.error(error),
  })

  // Pontos de venda ativos
  const activePointsOfSale = useMemo(
    () =>
      Array.isArray(pointsData)
        ? (pointsData as PointOfSale[]).filter((point) => point.isActive)
        : [],
    [pointsData]
  )

  // Funções de seleção em massa
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map(p => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId])
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId))
    }
  }

  const handleClearSelection = () => {
    setSelectedProducts([])
  }

  // Aplicar filtros (básicos + avançados)
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Filtro de busca
      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Filtro de categoria
      if (filterCategory !== "all" && product.category !== filterCategory) {
        return false
      }

      // Filtro de alerta
      if (filterAlert !== "all") {
        const hasAlert = product.inventory?.coldRoomAlert || 
                        product.inventory?.houseAlert || 
                        product.inventory?.salePointAlert
        if (filterAlert === "alert" && !hasAlert) {
          return false
        }
        if (filterAlert === "ok" && hasAlert) {
          return false
        }
      }

      // Filtros avançados
      if (advancedFilters.categories?.length > 0 && !advancedFilters.categories.includes(product.category)) {
        return false
      }

      if (advancedFilters.priceMin !== undefined && product.salePrice < advancedFilters.priceMin) {
        return false
      }

      if (advancedFilters.priceMax !== undefined && product.salePrice > advancedFilters.priceMax) {
        return false
      }

      if (advancedFilters.stockMin !== undefined && (product.inventory?.totalQuantity ?? 0) < advancedFilters.stockMin) {
        return false
      }

      if (advancedFilters.stockMax !== undefined && (product.inventory?.totalQuantity ?? 0) > advancedFilters.stockMax) {
        return false
      }

      if (advancedFilters.sku && !product.id.toLowerCase().includes(advancedFilters.sku.toLowerCase())) {
        return false
      }

      return true
    })
  }, [products, searchQuery, filterCategory, filterAlert, advancedFilters])

  // Calcular estatísticas para o dashboard
  const dashboardData = useMemo(() => {
    const totalValue = products.reduce((sum, p) => {
      const quantity = p.inventory?.totalQuantity ?? 0
      return sum + (quantity * (p.cost ?? p.salePrice))
    }, 0)

    const totalItems = products.reduce((sum, p) => sum + (p.inventory?.totalQuantity ?? 0), 0)

    const lowStockCount = products.filter(p => {
      const inv = p.inventory
      return inv?.coldRoomAlert || inv?.houseAlert || inv?.salePointAlert
    }).length

    const outOfStockCount = products.filter(p => (p.inventory?.totalQuantity ?? 0) === 0).length

    return {
      totalValue,
      totalItems,
      lowStockCount,
      outOfStockCount,
      expiringCount: 0, // Será calculado pelos componentes específicos
      averageTurnover: 0,
      deadStock: 0,
      inventoryAccuracy: 0
    }
  }, [products])

  // Extrair categorias únicas para filtros
  const availableCategories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[]
  }, [products])

  const handleImportModalChange = (open: boolean) => {
    setShowImportModal(open)
    if (!open) {
      setImportFile(null)
      if (importInputRef.current) {
        importInputRef.current.value = ""
      }
    }
  }

  const handleQuickAdd = async (productId: string, location: Location, quantity: number) => {
    try {
      const product = products.find(p => p.id === productId)
      if (!product?.inventory) return

      const currentStock = getInventoryQuantity(product.inventory, location)
      const newStock = currentStock + quantity

      const response = await fetch(`/api/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          location,
          quantity: newStock
        })
      })

      if (!response.ok) throw new Error("Erro ao adicionar estoque")

      toast.success("Estoque adicionado com sucesso")
      queryClient.invalidateQueries({ queryKey: ["products"] })
    } catch (error) {
      toast.error("Erro ao adicionar estoque")
    }
  }

  const handleImport = async () => {
    if (!importFile) return

    setImporting(true)
    try {
      const text = await importFile.text()
      const lines = text.split("\n").filter(line => line.trim())
      const header = lines[0].toLowerCase()
      
      // Validar cabeçalho
      if (!header.includes("productid") || !header.includes("location") || !header.includes("quantity")) {
        throw new Error("CSV inválido. Formato esperado: productId,location,quantity")
      }

      let successCount = 0
      let errorCount = 0

      // Processar cada linha (pular cabeçalho)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const [productId, location, quantity] = line.split(",").map(s => s.trim())

        try {
          const response = await fetch(`/api/inventory`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId,
              location,
              quantity: Number.parseInt(quantity, 10)
            })
          })

          if (response.ok) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          errorCount++
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} produto(s) importado(s) com sucesso!`)
        queryClient.invalidateQueries({ queryKey: ["products"] })
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} erro(s) durante a importação`)
      }

      handleImportModalChange(false)
    } catch (error) {
      const { message } = handleError(error)
      logger.error("Erro ao importar arquivo", { error })
      toast.error(message || "Erro ao importar arquivo")
    } finally {
      setImporting(false)
    }
  }

  if (loading) {
    return (
      <>
        <PullToRefreshIndicator
          isPulling={isPulling}
          isRefreshing={isRefreshing || loading}
          progress={progress}
          pullDistance={pullDistance}
        />
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </>
    )
  }

  return (
    <>
      {/* Sprint 2: Pull-to-Refresh Indicator */}
      <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isRefreshing || loading}
        progress={progress}
        pullDistance={pullDistance}
      />
      
      <div className="space-y-6">
      {/* Cabeçalho Melhorado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventário</h1>
          <p className="text-muted-foreground mt-1">
            Gestão completa de estoque com análises inteligentes
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">
            <ClipboardCheck className="mr-2 size-4" />
            Auditar
          </Button>
          <Button variant="outline" onClick={() => setShowImportModal(true)}>
            <Upload className="mr-2 size-4" />
            Importar
          </Button>
          <Button variant="outline">
            <FileDown className="mr-2 size-4" />
            Exportar
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 size-4" />
            Adicionar Estoque
          </Button>
        </div>
      </div>

      {/* Barcode Scanner para buscar produtos no inventário */}
      <BarcodeInput
        onScan={handleBarcodeScan}
        onError={(error) => toast.error(error)}
        enabled={true}
        isScanning={isScanning}
        scanHistory={scanHistory}
        showHistory={true}
      />

      {/* Sistema de Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="inline-flex h-auto w-full justify-start overflow-x-auto overflow-y-hidden whitespace-nowrap rounded-lg p-1 md:grid md:grid-cols-7">
          <TabsTrigger value="overview" className="gap-2 shrink-0">
            <Package className="size-4" />
            <span className="hidden sm:inline">Visão Geral</span>
            <span className="sm:hidden">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="abc" className="gap-2 shrink-0">
            <BarChart3 className="size-4" />
            <span className="hidden sm:inline">Análise ABC</span>
            <span className="sm:hidden">ABC</span>
          </TabsTrigger>
          <TabsTrigger value="forecast" className="gap-2 shrink-0">
            <TrendingUp className="size-4" />
            <span className="hidden sm:inline">Previsões</span>
            <span className="sm:hidden">Previsão</span>
          </TabsTrigger>
          <TabsTrigger value="expiration" className="gap-2 shrink-0">
            <Calendar className="size-4" />
            <span className="hidden sm:inline">Vencimentos</span>
            <span className="sm:hidden">Venc.</span>
          </TabsTrigger>
          <TabsTrigger value="batches" className="gap-2 shrink-0">
            <Package className="size-4" />
            <span className="hidden sm:inline">Lotes</span>
            <span className="sm:hidden">Lotes</span>
          </TabsTrigger>
          <TabsTrigger value="audits" className="gap-2 shrink-0">
            <ClipboardCheck className="size-4" />
            <span className="hidden sm:inline">Auditorias</span>
            <span className="sm:hidden">Audit.</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 shrink-0">
            <History className="size-4" />
            <span className="hidden sm:inline">Histórico</span>
            <span className="sm:hidden">Hist.</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          {/* Dashboard KPIs */}
          <InventoryDashboard data={dashboardData} />

          {/* Filtros e Ações */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {availableCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterAlert} onValueChange={setFilterAlert}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="alert">Com Alerta</SelectItem>
                <SelectItem value="ok">Saudável</SelectItem>
              </SelectContent>
            </Select>
            <AdvancedFilters
              filters={advancedFilters}
              onChange={setAdvancedFilters}
              availableCategories={availableCategories}
              availableSuppliers={[]}
              availableBrands={[]}
            />
            <ViewToggle value={viewType} onChange={setViewType} />
          </div>

          {/* Visualização de Produtos */}
          {viewType === "table" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Produtos ({filteredProducts.length})</span>
                  {selectedProducts.length > 0 && (
                    <Badge variant="secondary">
                      {selectedProducts.length} selecionado{selectedProducts.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-visible">
                <div className="relative overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-center">Estoque</TableHead>
                      <TableHead>Localizações</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const inv = product.inventory
                      const isSelected = selectedProducts.includes(product.id)
                      const totalStock = inv?.totalQuantity ?? 0
                      const hasAlert = inv?.coldRoomAlert || inv?.houseAlert || inv?.salePointAlert

                      return (
                        <TableRow key={product.id} className={isSelected ? "bg-muted/50" : ""}>
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{product.name}</div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{currencyFormatter.format(product.salePrice)}</span>
                                {product.size && (
                                  <>
                                    <span>•</span>
                                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                                      <Package className="mr-1 size-3" />
                                      {product.size}
                                    </Badge>
                                  </>
                                )}
                              </div>
                              {product.category && (
                                <Badge variant="outline" className="text-xs">{product.category}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2 min-w-[120px]">
                              <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold tabular-nums">{totalStock}</span>
                                {hasAlert && <AlertTriangle className="size-4 text-amber-500" />}
                              </div>
                              <StockLevelBar
                                current={totalStock}
                                min={10}
                                max={50}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <LocationPills
                              coldRoom={inv?.coldRoomQuantity ?? 0}
                              house={inv?.houseQuantity ?? 0}
                              salePoint={inv?.salePointQuantity ?? 0}
                              coldRoomAlert={inv?.coldRoomAlert}
                              houseAlert={inv?.houseAlert}
                              salePointAlert={inv?.salePointAlert}
                            />
                          </TableCell>
                          <TableCell>
                            {totalStock === 0 ? (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="size-3" />
                                Esgotado
                              </Badge>
                            ) : hasAlert ? (
                              <Badge variant="secondary" className="gap-1 border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                                <AlertTriangle className="size-3" />
                                Crítico
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1 border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                                Saudável
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <ProductQuickActions
                              productId={product.id}
                              productName={product.name}
                              onViewHistory={() => setHistoryProductId(product.id)}
                              onAddStock={() => {
                                setAddProductId(product.id)
                                setAddProductSearch(product.name)
                                setShowAddModal(true)
                              }}
                              onTransfer={() => {
                                setDistributeProductId(product.id)
                                setShowDistributeDialog(true)
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          ) : viewType === "cards" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Produtos ({filteredProducts.length})</h3>
                {selectedProducts.length > 0 && (
                  <Badge variant="secondary">
                    {selectedProducts.length} selecionado{selectedProducts.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                {filteredProducts.map((product) => {
                  const isSelected = selectedProducts.includes(product.id)
                  
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isSelected={isSelected}
                      onSelect={(checked) => handleSelectProduct(product.id, checked)}
                      onViewHistory={() => setHistoryProductId(product.id)}
                      onAddStock={() => {
                        setAddProductId(product.id)
                        setAddProductSearch(product.name)
                        setShowAddModal(true)
                      }}
                      onTransfer={() => {
                        setDistributeProductId(product.id)
                        setShowDistributeDialog(true)
                      }}
                    />
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Produtos ({filteredProducts.length})</h3>
                {selectedProducts.length > 0 && (
                  <Badge variant="secondary">
                    {selectedProducts.length} selecionado{selectedProducts.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => {
                  const isSelected = selectedProducts.includes(product.id)
                  
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isSelected={isSelected}
                      onSelect={(checked) => handleSelectProduct(product.id, checked)}
                      onViewHistory={() => setHistoryProductId(product.id)}
                      onAddStock={() => {
                        setAddProductId(product.id)
                        setAddProductSearch(product.name)
                        setShowAddModal(true)
                      }}
                      onTransfer={() => {
                        setDistributeProductId(product.id)
                        setShowDistributeDialog(true)
                      }}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab: Análise ABC */}
        <TabsContent value="abc">
          <ABCAnalysisTab />
        </TabsContent>

        {/* Tab: Previsões de Demanda */}
        <TabsContent value="forecast">
          <DemandForecastCard />
        </TabsContent>

        {/* Tab: Alertas de Vencimento */}
        <TabsContent value="expiration">
          <ExpirationAlertsCard />
        </TabsContent>

        {/* Tab: Lotes */}
        <TabsContent value="batches">
          <BatchManagementTab />
        </TabsContent>

        {/* Tab: Auditorias */}
        <TabsContent value="audits">
          <AuditManagementTab />
        </TabsContent>

        {/* Tab: Histórico de Movimentações */}
        <TabsContent value="history">
          <MovementHistoryTab />
        </TabsContent>
      </Tabs>

      {/* Bulk Toolbar (aparece quando há seleção) */}
      {selectedProducts.length > 0 && (
        <BulkToolbar
          selectedIds={selectedProducts}
          totalCount={filteredProducts.length}
          onClearSelection={handleClearSelection}
          onSelectAll={() => handleSelectAll(true)}
        />
      )}

      {/* Dialog de Histórico */}
      {historyProductId && (
        <InventoryHistoryDialog
          productId={historyProductId}
          productName={products.find(p => p.id === historyProductId)?.name ?? "Produto"}
          open={!!historyProductId}
          onOpenChange={(open) => !open && setHistoryProductId(null)}
        />
      )}
      {/* Modal Melhorado de Adicionar Estoque */}
      <AddStockDialog
        open={showAddModal}
        onOpenChange={setShowAddModal}
        products={products}
        preSelectedProductId={addProductId}
        preSelectedProductName={addProductSearch}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["products"] })
          setAddProductId("")
          setAddProductSearch("")
        }}
      />

      {/* Modal de Importação */}
      <Dialog open={showImportModal} onOpenChange={handleImportModalChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Inventário</DialogTitle>
            <DialogDescription>
              Importe dados de inventário via arquivo CSV
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Arquivo CSV</Label>
              <Input
                ref={importInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setImportFile(file)
                }}
              />
              <p className="text-sm text-muted-foreground">
                Formato: productId, location, quantity
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleImportModalChange(false)}
            >
              Cancelar
            </Button>
            <Button disabled={!importFile || importing} onClick={handleImport}>
              {importing ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Importando...
                </>
              ) : (
                "Importar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Distribuição para Pontos de Venda */}
      <DistributeStockDialog
        open={showDistributeDialog}
        onOpenChange={setShowDistributeDialog}
        product={products.find(p => p.id === distributeProductId) || null}
        pointsOfSale={activePointsOfSale}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["products"] })
          setDistributeProductId(null)
        }}
      />
      </div>
    </>
  )
}
