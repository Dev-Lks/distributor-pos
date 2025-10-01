"use client"

import type React from "react"
import { useMemo, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useProducts, type Product } from "@/lib/useProducts"
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
  const queryClient = useQueryClient()

  // Estado para seleção em massa
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  const [historyProductId, setHistoryProductId] = useState<string | null>(null)

  // Estados existentes
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [editStock, setEditStock] = useState("")
  const [editingBonifications, setEditingBonifications] = useState<string | null>(null)
  const [editBonifications, setEditBonifications] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterAlert, setFilterAlert] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [addProductId, setAddProductId] = useState("")
  const [addQuantity, setAddQuantity] = useState("")
  const [addProductSearch, setAddProductSearch] = useState("")
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferProductId, setTransferProductId] = useState("")
  const [transferFrom, setTransferFrom] = useState<Location>("coldRoom")
  const [transferTo, setTransferTo] = useState<Location>("house")
  const [transferQuantity, setTransferQuantity] = useState("")
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const importInputRef = useRef<HTMLInputElement | null>(null)

  // Estado para filtros avançados
  const [advancedFilters, setAdvancedFilters] = useState<any>({})

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

  const handleAddModalChange = (open: boolean) => {
    setShowAddModal(open)
    if (!open) {
      setAddProductId("")
      setAddQuantity("")
      setAddProductSearch("")
    }
  }

  const handleTransferModalChange = (open: boolean) => {
    setShowTransferModal(open)
    if (!open) {
      setTransferProductId("")
      setTransferQuantity("")
      setTransferFrom(COLD_ROOM_LOCATION)
      setTransferTo("house")
    }
  }

  const handleImportModalChange = (open: boolean) => {
    setShowImportModal(open)
    if (!open) {
      setImportFile(null)
      if (importInputRef.current) {
        importInputRef.current.value = ""
      }
    }
  }

  const handleUpdateStock = async (productId: string, location: Location, newStock: number) => {
    try {
      const response = await fetch(`/api/inventory`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          location,
          quantity: newStock
        })
      })

      if (!response.ok) throw new Error("Erro ao atualizar estoque")

      toast.success("Estoque atualizado com sucesso")
      queryClient.invalidateQueries({ queryKey: ["products"] })
      setEditingId(null)
      setEditingLocation(null)
    } catch (error) {
      toast.error("Erro ao atualizar estoque")
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

  const handleTransfer = async () => {
    try {
      const quantity = Number.parseInt(transferQuantity, 10)
      if (!transferProductId || isNaN(quantity) || quantity <= 0) {
        toast.error("Dados inválidos")
        return
      }

      const response = await fetch(`/api/inventory/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "transfer",
          productIds: [transferProductId],
          params: {
            fromLocation: transferFrom,
            toLocation: transferTo,
            quantity
          }
        })
      })

      if (!response.ok) throw new Error("Erro ao transferir")

      toast.success("Transferência realizada com sucesso")
      queryClient.invalidateQueries({ queryKey: ["products"] })
      handleTransferModalChange(false)
    } catch (error) {
      toast.error("Erro ao realizar transferência")
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
    } catch (error: any) {
      toast.error(error.message || "Erro ao importar arquivo")
    } finally {
      setImporting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Inventário</h1>
          <p className="text-muted-foreground">
            Controle avançado de estoque com análises inteligentes
          </p>
        </div>
        <div className="flex gap-2">
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

      {/* Sistema de Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="gap-2">
            <Package className="size-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="abc" className="gap-2">
            <BarChart3 className="size-4" />
            Análise ABC
          </TabsTrigger>
          <TabsTrigger value="forecast" className="gap-2">
            <TrendingUp className="size-4" />
            Previsões
          </TabsTrigger>
          <TabsTrigger value="expiration" className="gap-2">
            <Calendar className="size-4" />
            Vencimentos
          </TabsTrigger>
          <TabsTrigger value="batches" className="gap-2">
            <Package className="size-4" />
            Lotes
          </TabsTrigger>
          <TabsTrigger value="audits" className="gap-2">
            <ClipboardCheck className="size-4" />
            Auditorias
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="size-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          {/* Dashboard KPIs */}
          <InventoryDashboard data={dashboardData} />

          {/* Filtros e Ações */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1">
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
            <Button
              variant="outline"
              onClick={() => setShowTransferModal(true)}
            >
              <ArrowLeftRight className="mr-2 size-4" />
              Transferir
            </Button>
          </div>

          {/* Tabela de Produtos com Seleção */}
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
            <CardContent>
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
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-center">Câmara Fria</TableHead>
                    <TableHead className="text-center">Casa</TableHead>
                    <TableHead className="text-center">Ponto de Venda</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const inv = product.inventory
                    const isSelected = selectedProducts.includes(product.id)

                    return (
                      <TableRow key={product.id} className={isSelected ? "bg-muted/50" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {currencyFormatter.format(product.salePrice)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {editingId === product.id && editingLocation === "coldRoom" ? (
                            <div className="flex items-center justify-center gap-1">
                              <Input
                                type="number"
                                value={editStock}
                                onChange={(e) => setEditStock(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleUpdateStock(product.id, "coldRoom", Number.parseInt(editStock, 10))
                                  }
                                  if (e.key === "Escape") {
                                    setEditingId(null)
                                    setEditingLocation(null)
                                  }
                                }}
                                className="h-8 w-20 text-center"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUpdateStock(product.id, "coldRoom", Number.parseInt(editStock, 10))}
                              >
                                <Check className="size-4 text-emerald-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingId(null)
                                  setEditingLocation(null)
                                }}
                              >
                                <X className="size-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingId(product.id)
                                setEditingLocation("coldRoom")
                                setEditStock(String(inv?.coldRoomQuantity ?? 0))
                              }}
                              className="hover:text-primary hover:underline"
                            >
                              {inv?.coldRoomQuantity ?? 0}
                            </button>
                          )}
                          {inv?.coldRoomAlert && (
                            <AlertTriangle className="ml-1 inline size-4 text-amber-500" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {editingId === product.id && editingLocation === "house" ? (
                            <div className="flex items-center justify-center gap-1">
                              <Input
                                type="number"
                                value={editStock}
                                onChange={(e) => setEditStock(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleUpdateStock(product.id, "house", Number.parseInt(editStock, 10))
                                  }
                                  if (e.key === "Escape") {
                                    setEditingId(null)
                                    setEditingLocation(null)
                                  }
                                }}
                                className="h-8 w-20 text-center"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUpdateStock(product.id, "house", Number.parseInt(editStock, 10))}
                              >
                                <Check className="size-4 text-emerald-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingId(null)
                                  setEditingLocation(null)
                                }}
                              >
                                <X className="size-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingId(product.id)
                                setEditingLocation("house")
                                setEditStock(String(inv?.houseQuantity ?? 0))
                              }}
                              className="hover:text-primary hover:underline"
                            >
                              {inv?.houseQuantity ?? 0}
                            </button>
                          )}
                          {inv?.houseAlert && (
                            <AlertTriangle className="ml-1 inline size-4 text-amber-500" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {editingId === product.id && editingLocation === "salePoint" ? (
                            <div className="flex items-center justify-center gap-1">
                              <Input
                                type="number"
                                value={editStock}
                                onChange={(e) => setEditStock(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleUpdateStock(product.id, "salePoint", Number.parseInt(editStock, 10))
                                  }
                                  if (e.key === "Escape") {
                                    setEditingId(null)
                                    setEditingLocation(null)
                                  }
                                }}
                                className="h-8 w-20 text-center"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUpdateStock(product.id, "salePoint", Number.parseInt(editStock, 10))}
                              >
                                <Check className="size-4 text-emerald-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingId(null)
                                  setEditingLocation(null)
                                }}
                              >
                                <X className="size-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingId(product.id)
                                setEditingLocation("salePoint")
                                setEditStock(String(inv?.salePointQuantity ?? 0))
                              }}
                              className="hover:text-primary hover:underline"
                            >
                              {inv?.salePointQuantity ?? 0}
                            </button>
                          )}
                          {inv?.salePointAlert && (
                            <AlertTriangle className="ml-1 inline size-4 text-amber-500" />
                          )}
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {inv?.totalQuantity ?? 0}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const hasAlert = inv?.coldRoomAlert || inv?.houseAlert || inv?.salePointAlert
                            if ((inv?.totalQuantity ?? 0) === 0) {
                              return <Badge className={stockStatusStyles.danger}>Esgotado</Badge>
                            }
                            if (hasAlert) {
                              return <Badge className={stockStatusStyles.warning}>Crítico</Badge>
                            }
                            return <Badge className={stockStatusStyles.ok}>Saudável</Badge>
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setHistoryProductId(product.id)}
                              title="Ver histórico de movimentações"
                            >
                              <Package className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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

      {/* Modais Existentes (Add, Transfer, Import) */}
      
      {/* Modal de Adicionar Estoque */}
      <Dialog open={showAddModal} onOpenChange={handleAddModalChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Estoque</DialogTitle>
            <DialogDescription>
              Adicione produtos ao estoque em uma localização específica
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="addProduct">Produto</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar produto..."
                  value={addProductSearch}
                  onChange={(e) => setAddProductSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-[200px] overflow-y-auto rounded-md border">
                {products
                  .filter((p) =>
                    p.name.toLowerCase().includes(addProductSearch.toLowerCase())
                  )
                  .map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        setAddProductId(product.id)
                        setAddProductSearch(product.name)
                      }}
                      className={cn(
                        "w-full p-3 text-left hover:bg-muted/50",
                        addProductId === product.id && "bg-muted"
                      )}
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Estoque atual: {product.inventory?.totalQuantity || 0}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="addQuantity">Quantidade</Label>
              <Input
                id="addQuantity"
                type="number"
                min="1"
                value={addQuantity}
                onChange={(e) => setAddQuantity(e.target.value)}
                placeholder="Digite a quantidade"
              />
            </div>
            <div className="grid gap-2">
              <Label>Localização</Label>
              <LocationSelector
                value={editingLocation}
                onChange={setEditingLocation}
                label=""
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleAddModalChange(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!addProductId || !addQuantity || !editingLocation) {
                  toast.error("Preencha todos os campos")
                  return
                }
                await handleQuickAdd(
                  addProductId,
                  editingLocation,
                  Number.parseInt(addQuantity, 10)
                )
                handleAddModalChange(false)
              }}
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Transferência */}
      <Dialog open={showTransferModal} onOpenChange={handleTransferModalChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transferir Estoque</DialogTitle>
            <DialogDescription>
              Transfira produtos entre localizações
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="transferProduct">Produto</Label>
              <Select
                value={transferProductId}
                onValueChange={setTransferProductId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - Estoque: {product.inventory?.totalQuantity || 0}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>De</Label>
                <LocationSelector
                  value={transferFrom}
                  onChange={setTransferFrom}
                  label=""
                />
              </div>
              <div className="grid gap-2">
                <Label>Para</Label>
                <LocationSelector
                  value={transferTo}
                  onChange={setTransferTo}
                  label=""
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="transferQuantity">Quantidade</Label>
              <Input
                id="transferQuantity"
                type="number"
                min="1"
                value={transferQuantity}
                onChange={(e) => setTransferQuantity(e.target.value)}
                placeholder="Digite a quantidade"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleTransferModalChange(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleTransfer}>
              Transferir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  )
}
