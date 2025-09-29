"use client"

import type React from "react"
import { useMemo, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useProducts, type Product } from "@/lib/useProducts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
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
  X
} from "lucide-react"
import type { InventoryImportResponse, InventoryImportSummary } from "@/lib/inventoryImport"

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
  const [importSummary, setImportSummary] = useState<InventoryImportSummary | null>(null)
  const importInputRef = useRef<HTMLInputElement | null>(null)

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
      setImportSummary(null)
      if (importInputRef.current) {
        importInputRef.current.value = ""
      }
    }
  }

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target
    if (!files || !files.length) {
      setImportFile(null)
      return
    }
    setImportFile(files[0])
  }

  const handleTemplateDownload = () => {
    window.open('/api/inventory/import', '_blank')
  }

  const handleImportSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!importFile) {
      toast.error('Selecione um arquivo XLSX para continuar.')
      return
    }

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', importFile)

      const response = await fetch('/api/inventory/import', {
        method: 'POST',
        body: formData
      })

      const data = (await response.json()) as Partial<InventoryImportResponse> & { error?: string }
      if (data.summary) {
        setImportSummary(data.summary)
      }

      if (!response.ok) {
        const summary = data.summary
        const errorMessage =
          data.error ??
          (summary && (summary.errors.length > 0 || summary.warnings.length > 0)
            ? 'Importação interrompida. Revise os erros e avisos listados para continuar.'
            : 'Não foi possível importar a planilha. Tente novamente.')
        toast.error(errorMessage)
        return
      }

      await queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success(
        data.summary
          ? `Importação concluída! ${data.summary.processedCount} produtos atualizados.`
          : 'Inventário atualizado com sucesso.'
      )

      setImportFile(null)
      if (importInputRef.current) {
        importInputRef.current.value = ""
      }
    } catch (error) {
      console.error('Import inventory: client error', error)
      toast.error('Erro inesperado ao enviar a planilha. Tente novamente.')
    } finally {
      setImporting(false)
    }
  }

  const focusAlertsSection = () => {
    setFilterAlert("with_alert")
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        document.getElementById("inventory-alerts")?.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    }
  }

  const categories = useMemo(
    () => [
      "all",
      ...Array.from(
        new Set(
          products
            .map((product) => product.category)
            .filter((category): category is string => Boolean(category))
        )
      )
    ],
    [products]
  )

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = filterCategory === "all" || product.category === filterCategory
      const hasAlerts = Boolean(
        product.inventory?.coldRoomAlert || product.inventory?.houseAlert || product.inventory?.salePointAlert
      )
      const matchesAlert =
        filterAlert === "all" ||
        (filterAlert === "with_alert" && hasAlerts) ||
        (filterAlert === "no_alert" && !hasAlerts)
      const lowerSearch = searchQuery.trim().toLowerCase()
      const matchesSearch =
        lowerSearch.length === 0 ||
        product.name.toLowerCase().includes(lowerSearch) ||
        product.size.toLowerCase().includes(lowerSearch)

      return matchesCategory && matchesAlert && matchesSearch
    })
  }, [products, filterCategory, filterAlert, searchQuery])

  const lowStockAlerts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.inventory?.coldRoomAlert || product.inventory?.houseAlert || product.inventory?.salePointAlert
      ),
    [products]
  )

  const totalBonifications = useMemo(
    () => products.reduce((sum, product) => sum + product.bonifications, 0),
    [products]
  )

  const totalQuantity = useMemo(
    () => products.reduce((sum, product) => sum + (product.inventory?.totalQuantity ?? 0), 0),
    [products]
  )

  const totalInventoryValue = useMemo(
    () =>
      products.reduce(
        (sum, product) =>
          sum + ((product.inventory?.coldRoomQuantity ?? 0) + (product.inventory?.houseQuantity ?? 0) + (product.inventory?.salePointQuantity ?? 0)) * product.salePrice,
        0
      ),
    [products]
  )

  const locationSummaries = useMemo(() => {
    return (Object.keys(locationConfig) as Location[]).map((location) => {
      const locationQuantity = filteredProducts.reduce(
        (sum, product) => sum + getInventoryQuantity(product.inventory, location),
        0
      )
      const alertCount = filteredProducts.filter((product) =>
        Boolean(product.inventory?.[`${location}Alert` as keyof ProductInventory])
      ).length

      return {
        location,
        quantity: locationQuantity,
        alerts: alertCount
      }
    })
  }, [filteredProducts])

  const heroStats = useMemo(
    () => [
      {
        label: "Produtos monitorados",
        value: products.length,
        helper: `${filteredProducts.length} na visualização`,
        icon: Package
      },
      {
        label: "Unidades em estoque",
        value: totalQuantity,
        helper: `${lowStockAlerts.length} com alerta`,
        icon: Check
      },
      {
        label: "Valor estimado",
        value: currencyFormatter.format(totalInventoryValue),
        helper: `${totalBonifications} bonificações`,
        icon: CircleDollarSign
      }
    ],
    [filteredProducts.length, lowStockAlerts.length, products.length, totalBonifications, totalInventoryValue, totalQuantity]
  )

  const quickActions = [
    {
      title: "Importar planilha",
      description: "Atualize o estoque em massa com uma planilha Excel no modelo padrão.",
      icon: Upload,
      buttonIcon: Upload,
      cta: "Importar XLSX",
      variant: "outline" as const,
      onClick: () => setShowImportModal(true)
    },
    {
      title: "Entrada centralizada",
      description: "Receba mercadorias e mantenha a câmara fria sempre atualizada.",
      icon: Snowflake,
      buttonIcon: Plus,
      cta: "Registrar entrada",
      variant: "default" as const,
      onClick: () => setShowAddModal(true)
    },
    {
      title: "Distribuir estoque",
      description: "Use a transferência para abastecer casa e pontos de venda com controle total.",
      icon: ArrowLeftRight,
      buttonIcon: ArrowLeftRight,
      cta: "Abrir transferência",
      variant: "outline" as const,
      onClick: () => setShowTransferModal(true)
    },
    {
      title: "Zerar alertas",
      description: "Visualize rapidamente os produtos críticos para agir antes da ruptura.",
      icon: AlertTriangle,
      buttonIcon: AlertTriangle,
      cta: "Ver produtos em alerta",
      variant: "outline" as const,
      onClick: focusAlertsSection
    }
  ]

  const selectedTransferProduct = useMemo(
    () => products.find((product) => product.id === transferProductId),
    [products, transferProductId]
  )

  const transferFromQuantity = getInventoryQuantity(selectedTransferProduct?.inventory, transferFrom)
  const transferToQuantity = getInventoryQuantity(selectedTransferProduct?.inventory, transferTo)

  const startEdit = (id: string, location: Location, currentStock: number) => {
    setEditingId(id)
    setEditingLocation(location)
    setEditStock(currentStock.toString())
  }

  const saveEdit = async (id: string, location: Location) => {
    const parsedQuantity = Number(editStock)
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
      toast.error("Informe uma quantidade válida.")
      return
    }

    const product = products.find((item) => item.id === id)
    if (!product?.inventory) {
      toast.error("Produto não encontrado para ajuste.")
      return
    }

    const currentQuantity = getInventoryQuantity(product.inventory, location)

    if (location !== COLD_ROOM_LOCATION && parsedQuantity > currentQuantity) {
      toast.error("Para aumentar o estoque deste local use a transferência a partir da câmara fria.")
      return
    }

    if (parsedQuantity === currentQuantity) {
      setEditingId(null)
      setEditingLocation(null)
      setEditStock("")
      return
    }

    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id, location, quantity: parsedQuantity })
      })

      if (!response.ok) {
        throw new Error("Erro ao atualizar estoque")
      }

      toast.success("Estoque atualizado com sucesso.")
      queryClient.invalidateQueries({ queryKey: ["products"] })
      setEditingId(null)
      setEditingLocation(null)
      setEditStock("")
    } catch (error) {
      console.error(error)
      toast.error("Não foi possível atualizar o estoque agora.")
    }
  }

  const startEditBonifications = (id: string, currentBonifications: number) => {
    setEditingBonifications(id)
    setEditBonifications(currentBonifications.toString())
  }

  const saveBonifications = async (id: string) => {
    const newBonifications = Number(editBonifications)
    if (Number.isFinite(newBonifications) && newBonifications >= 0) {
      await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, bonifications: newBonifications })
      })
      queryClient.invalidateQueries({ queryKey: ["products"] })
    }
    setEditingBonifications(null)
    setEditBonifications("")
  }

  const addStock = async () => {
    if (!addProductId) {
      toast.error("Selecione um produto para registrar a entrada.")
      return
    }

    const quantity = Number(addQuantity)
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error("Informe uma quantidade válida.")
      return
    }

    const product = products.find((item) => item.id === addProductId)
    if (!product) {
      toast.error("Produto não encontrado.")
      return
    }

    const currentQuantity = getInventoryQuantity(product.inventory, COLD_ROOM_LOCATION)
    const targetQuantity = currentQuantity + quantity

    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: addProductId, location: COLD_ROOM_LOCATION, quantity: targetQuantity })
      })

      if (!response.ok) {
        throw new Error("Erro ao registrar entrada")
      }

      toast.success("Entrada registrada na câmara fria.")
      queryClient.invalidateQueries({ queryKey: ["products"] })
      setShowAddModal(false)
      setAddProductId("")
      setAddQuantity("")
      setAddProductSearch("")
    } catch (error) {
      console.error(error)
      toast.error("Não foi possível registrar a entrada agora.")
    }
  }

  const transferStock = async () => {
    if (!transferProductId) {
      toast.error("Selecione um produto para transferir.")
      return
    }

    const quantity = Number(transferQuantity)
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error("Informe uma quantidade válida para transferir.")
      return
    }

    if (transferFrom === transferTo) {
      toast.error("Escolha locais diferentes para a transferência.")
      return
    }

    const product = products.find((item) => item.id === transferProductId)
    if (!product?.inventory) {
      toast.error("Produto não encontrado para transferência.")
      return
    }

  const fromQuantity = getInventoryQuantity(product.inventory, transferFrom)

    if (fromQuantity < quantity) {
      toast.error("Quantidade indisponível no local de origem.")
      return
    }

    try {
      const transferResponse = await fetch("/api/inventory/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: transferProductId,
          fromLocation: transferFrom,
          toLocation: transferTo,
          quantity
        })
      })

      if (!transferResponse.ok) {
        const data = (await transferResponse.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? "Erro ao transferir estoque")
      }

      toast.success("Transferência concluída.")
      queryClient.invalidateQueries({ queryKey: ["products"] })
      setShowTransferModal(false)
      setTransferProductId("")
      setTransferQuantity("")
      setTransferFrom(COLD_ROOM_LOCATION)
      setTransferTo("house")
    } catch (error) {
      console.error(error)
      const message = error instanceof Error ? error.message : "Não foi possível completar a transferência agora."
      toast.error(message)
    }
  }

  const renderInventoryTable = (location: Location) => {
    const quantityField = `${location}Quantity` as keyof Product["inventory"]
    const minStockField = `${location}MinStock` as keyof Product["inventory"]
    const alertField = `${location}Alert` as keyof Product["inventory"]
    const locationSummary = locationSummaries.find((summary) => summary.location === location)

    return (
      <div className="space-y-4">
        <div
          className={cn("rounded-xl border bg-gradient-to-br p-4", locationConfig[location].accent)}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">{locationConfig[location].description}</p>
              <h3 className="text-lg font-semibold">{locationConfig[location].label}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="bg-background/60">
                {(locationSummary?.quantity ?? 0).toLocaleString("pt-BR")} itens
              </Badge>
              {locationSummary && (
                <Badge
                  variant="outline"
                  className={cn(
                    "border text-xs",
                    locationSummary.alerts > 0
                      ? "border-amber-300 bg-amber-100 text-amber-700"
                      : "border-border bg-transparent text-muted-foreground"
                  )}
                >
                  {locationSummary.alerts > 0 ? `${locationSummary.alerts} alerta(s)` : "Sem alertas"}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {location !== COLD_ROOM_LOCATION && (
          <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 px-4 py-3 text-xs text-muted-foreground sm:text-sm">
            Para aumentar o estoque em {locationConfig[location].label}, registre a chegada na câmara fria e em seguida realize uma transferência.
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-3 md:hidden">
            {filteredProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nenhum produto encontrado para este filtro.
              </div>
            ) : (
              filteredProducts.map((product) => {
                const stock = product.inventory?.[quantityField] ?? 0
                const minStock = product.inventory?.[minStockField] ?? 0
                const status = getStockStatus(stock, minStock)
                const isEditing = editingId === product.id && editingLocation === location
                const isEditingBonifications = editingBonifications === product.id

                return (
                  <div
                    key={`${product.id}-${location}-card`}
                    className={cn(
                      "space-y-4 rounded-xl border bg-card p-4 shadow-sm transition-colors",
                      product.inventory?.[alertField] && "border-amber-300 bg-amber-50/70 dark:bg-amber-500/10",
                      product.bonifications > 0 && !isEditingBonifications && "border-primary/40"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold leading-tight">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.size}</p>
                      </div>
                      <Badge className={status.className}>{status.label}</Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="uppercase tracking-tight">
                        {product.category || "Sem categoria"}
                      </Badge>
                      {product.bonifications > 0 && !isEditingBonifications && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          {product.bonifications} brinde(s)
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Estoque</p>
                        {isEditing ? (
                          <div className="mt-1 flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              value={editStock}
                              onChange={(event) => setEditStock(event.target.value)}
                              className="h-9 w-full text-right"
                            />
                            <Button size="icon" onClick={() => saveEdit(product.id, location)}>
                              <Check className="size-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingId(null)
                                setEditingLocation(null)
                                setEditStock("")
                              }}
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                        ) : (
                          <p
                            className={cn(
                              "font-mono text-lg",
                              stock <= minStock ? "text-red-600" : "text-emerald-600"
                            )}
                          >
                            {stock.toLocaleString("pt-BR")} un
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Bonificações</p>
                        {isEditingBonifications ? (
                          <div className="mt-1 flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              value={editBonifications}
                              onChange={(event) => setEditBonifications(event.target.value)}
                              className="h-9 w-full text-right"
                            />
                            <Button size="icon" variant="ghost" onClick={() => saveBonifications(product.id)}>
                              <Check className="size-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingBonifications(null)
                                setEditBonifications("")
                              }}
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                        ) : (
                          <p
                            className={cn(
                              "font-mono text-lg",
                              product.bonifications > 0 ? "text-primary" : "text-muted-foreground"
                            )}
                          >
                            {product.bonifications}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Valor estimado</span>
                        <span className="font-medium text-foreground">
                          {currencyFormatter.format(stock * product.salePrice)}
                        </span>
                      </div>
                    </div>

                    {!isEditing && !isEditingBonifications && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(product.id, location, stock)}
                          className="flex-1 min-w-[120px]"
                        >
                          <Edit2 className="size-4" />
                          Estoque
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditBonifications(product.id, product.bonifications)}
                          className="flex-1 min-w-[120px]"
                        >
                          <Gift className="size-4" />
                          Brindes
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          <div className="hidden md:block">
            <div className="rounded-xl border">
              <div className="relative overflow-x-auto">
                <Table className="min-w-[780px]">
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[240px]">Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-center">Bonificações</TableHead>
                      <TableHead className="text-right">Estoque</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-[120px] text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const stock = product.inventory?.[quantityField] ?? 0
                      const minStock = product.inventory?.[minStockField] ?? 0
                      const status = getStockStatus(stock, minStock)
                      const isEditing = editingId === product.id && editingLocation === location
                      const isEditingBonifications = editingBonifications === product.id

                      return (
                        <TableRow
                          key={`${product.id}-${location}`}
                          className={cn(
                            "transition-colors",
                            product.inventory?.[alertField] && "bg-amber-50/60 dark:bg-amber-500/15",
                            product.bonifications > 0 && !isEditingBonifications && "bg-primary/5 dark:bg-primary/20"
                          )}
                        >
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{product.name}</span>
                                {product.bonifications > 0 && (
                                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                                    {product.bonifications} brinde(s)
                                  </Badge>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground">{product.size}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="uppercase tracking-tight">
                              {product.category || "Sem categoria"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {isEditingBonifications ? (
                              <div className="flex items-center justify-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  value={editBonifications}
                                  onChange={(event) => setEditBonifications(event.target.value)}
                                  className="h-9 w-20 text-center"
                                />
                                <div className="flex gap-2">
                                  <Button size="icon" variant="ghost" onClick={() => saveBonifications(product.id)}>
                                    <Check className="size-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingBonifications(null)
                                      setEditBonifications("")
                                    }}
                                  >
                                    <X className="size-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <span
                                className={cn(
                                  "font-mono text-lg",
                                  product.bonifications > 0 ? "text-primary" : "text-muted-foreground"
                                )}
                              >
                                {product.bonifications}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  value={editStock}
                                  onChange={(event) => setEditStock(event.target.value)}
                                  className="h-9 w-24 text-right"
                                />
                                <div className="flex gap-2">
                                  <Button size="icon" onClick={() => saveEdit(product.id, location)}>
                                    <Check className="size-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingId(null)
                                      setEditingLocation(null)
                                      setEditStock("")
                                    }}
                                  >
                                    <X className="size-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <span
                                className={cn(
                                  "font-mono text-lg",
                                  stock <= minStock
                                    ? "text-red-600 dark:text-red-300"
                                    : "text-emerald-600 dark:text-emerald-300"
                                )}
                              >
                                {stock}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={status.className}>{status.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {currencyFormatter.format(stock * product.salePrice)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              {!isEditing && !isEditingBonifications && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => startEdit(product.id, location, stock)}
                                    aria-label={`Editar estoque de ${product.name}`}
                                  >
                                    <Edit2 className="size-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => startEditBonifications(product.id, product.bonifications)}
                                    aria-label={`Editar bonificações de ${product.name}`}
                                  >
                                    <Gift className="size-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <InventoryPageSkeleton />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6 pb-8">
        <Card className="border-none bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 shadow-none">
          <CardHeader className="pb-4">
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-primary/15 text-primary">
                Inventário em tempo real
              </Badge>
              <CardTitle className="text-2xl md:text-3xl">Painel de inventário</CardTitle>
              <p className="max-w-3xl text-sm text-muted-foreground">
                Todas as entradas chegam primeiro à câmara fria. A partir dela, distribua para casa ou pontos de venda com total visibilidade e sem atropelos.
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
            <CardTitle className="text-base">Filtrar produtos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <div className="relative flex min-w-[220px] w-full flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nome ou tamanho"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-9"
              />
            </div>
            <div className="min-w-[180px] w-full sm:w-auto">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories
                    .filter((category) => category !== "all")
                    .map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[200px] w-full sm:w-auto">
              <Select value={filterAlert} onValueChange={setFilterAlert}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os produtos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os produtos</SelectItem>
                  <SelectItem value="with_alert">Apenas com alerta</SelectItem>
                  <SelectItem value="no_alert">Sem alerta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Distribuição por local</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {locationSummaries.map(({ location, quantity, alerts }) => {
              const { label: locationLabel, icon: Icon } = locationConfig[location]
              return (
                <div key={location} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <p className="text-xs uppercase text-muted-foreground">{locationLabel}</p>
                    <p className="text-xl font-semibold tracking-tight">{quantity.toLocaleString("pt-BR")}</p>
                    <p className="text-xs text-muted-foreground">
                      {alerts > 0 ? `${alerts} produto(s) em alerta` : "Sem alertas"}
                    </p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <Icon className="size-5" />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {lowStockAlerts.length > 0 && (
          <Card id="inventory-alerts" className="border-amber-400/50 bg-amber-50/60 dark:bg-amber-500/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-600" />
                <CardTitle className="text-base">Centro de alertas</CardTitle>
              </div>
              <Badge className="bg-amber-600 text-white">{lowStockAlerts.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {lowStockAlerts.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white/80 p-3 dark:bg-amber-500/10"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.size}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {(Object.keys(locationConfig) as Location[]).map((location) => {
                      const flag = product.inventory?.[
                        `${location}Alert` as keyof ProductInventory
                      ]
                      if (!flag) return null

                      const quantity = getInventoryQuantity(product.inventory, location)
                      return (
                        <Badge key={location} variant="outline" className="bg-amber-100 text-amber-700">
                          {locationConfig[location].label}: {quantity}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-base">Inventário detalhado</CardTitle>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {filteredProducts.length} produto(s) exibidos
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <Package className="size-12 text-muted-foreground" />
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Nenhum produto encontrado</h3>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Ajuste os filtros acima ou limpe a busca para visualizar todos os produtos novamente.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterAlert("all")
                    setFilterCategory("all")
                    setSearchQuery("")
                  }}
                >
                  Limpar filtros
                </Button>
              </div>
            ) : (
              <Tabs defaultValue="coldRoom" className="w-full">
                <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
                  {(Object.keys(locationConfig) as Location[]).map((location) => {
                    const { label } = locationConfig[location]
                    return (
                      <TabsTrigger key={location} value={location} className="text-xs sm:text-sm">
                        {label}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
                {(Object.keys(locationConfig) as Location[]).map((location) => (
                  <TabsContent key={location} value={location} className="mt-6">
                    {renderInventoryTable(location)}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
  </div>

      <Dialog open={showImportModal} onOpenChange={handleImportModalChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Importar inventário via planilha</DialogTitle>
            <DialogDescription>
              Utilize o modelo sugerido para atualizar quantidades, mínimos e reservas de vários produtos de uma só vez.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleImportSubmit} className="space-y-5">
            <div className="flex items-start gap-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-primary dark:text-primary-foreground">
              <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary dark:bg-primary/20">
                <Upload className="size-5" />
              </div>
              <div className="space-y-1 text-left">
                <p className="font-semibold">Atualize o estoque em lote</p>
                <p className="text-xs text-muted-foreground">
                  Cada linha deve conter o SKU ou Nome do produto e as quantidades desejadas. Campos não informados permanecem inalterados.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="inventory-import-file">Arquivo XLSX</Label>
                <Input
                  id="inventory-import-file"
                  ref={importInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportFileChange}
                  disabled={importing}
                />
                <p className="text-xs text-muted-foreground">
                  Colunas reconhecidas: SKU, Nome, Câmara fria, Casa, Pontos de venda, Estoque mínimo (por local), Reservado, Avariado, Em trânsito, Estoque de segurança.
                </p>
              </div>

              {importSummary && (
                <div className="space-y-4 rounded-lg border border-muted-foreground/30 bg-muted/20 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[{
                      label: 'Linhas na planilha',
                      value: importSummary.totalRows
                    }, {
                      label: 'Processadas',
                      value: importSummary.processedCount
                    }, {
                      label: 'Atualizadas',
                      value: importSummary.updatedCount
                    }, {
                      label: 'Criadas',
                      value: importSummary.createdCount
                    }, {
                      label: 'Ignoradas',
                      value: importSummary.ignoredCount
                    }].map((item) => (
                      <div key={item.label} className="rounded-md bg-background/60 p-3 shadow-sm">
                        <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                        <p className="text-lg font-semibold">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {importSummary.errors.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-destructive">Erros</p>
                      <ul className="list-disc space-y-1 pl-5 text-xs text-destructive/80">
                        {importSummary.errors.slice(0, 5).map((error) => (
                          <li key={`${error.row}-${error.message}`}>
                            Linha {error.row}: {error.message}
                          </li>
                        ))}
                      </ul>
                      {importSummary.errors.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          ... e mais {importSummary.errors.length - 5} erro(s).
                        </p>
                      )}
                    </div>
                  )}

                  {importSummary.warnings.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Avisos</p>
                      <ul className="list-disc space-y-1 pl-5 text-xs text-amber-600/80 dark:text-amber-400/80">
                        {importSummary.warnings.slice(0, 5).map((warning, index) => (
                          <li key={`${index}-${warning}`}>{warning}</li>
                        ))}
                      </ul>
                      {importSummary.warnings.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          ... e mais {importSummary.warnings.length - 5} aviso(s).
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                className="pl-0"
                onClick={handleTemplateDownload}
                disabled={importing}
              >
                <FileDown className="mr-2 size-4" /> Baixar modelo XLSX
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => handleImportModalChange(false)} disabled={importing}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={!importFile || importing}>
                  {importing && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Importar planilha
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddModal} onOpenChange={handleAddModalChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Entrada na câmara fria</DialogTitle>
            <DialogDescription>
              Registre novas chegadas direto no estoque central. Para abastecer os demais locais, finalize a
              transferência após esta etapa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-lg border border-sky-500/40 bg-sky-500/10 p-3 text-sm text-sky-900 dark:text-sky-200">
              <div className="flex size-10 items-center justify-center rounded-md bg-white/70 text-sky-600 dark:bg-sky-500/20">
                <Snowflake className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold">
                  Destino único: {locationConfig[COLD_ROOM_LOCATION].label}
                </p>
                <p className="text-xs text-muted-foreground">
                  Entradas sempre chegam à câmara fria. Use a transferência para abastecer casa ou pontos de venda.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Buscar produto</Label>
              <Input
                value={addProductSearch}
                onChange={(event) => setAddProductSearch(event.target.value)}
                placeholder="Nome ou tamanho"
              />
            </div>
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select value={addProductId || undefined} onValueChange={setAddProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {products
                    .filter((product) => {
                      const term = addProductSearch.trim().toLowerCase()
                      return (
                        term.length === 0 ||
                        product.name.toLowerCase().includes(term) ||
                        product.size.toLowerCase().includes(term)
                      )
                    })
                    .map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex flex-col text-sm">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {product.size} • Câmara fria: {getInventoryQuantity(product.inventory, COLD_ROOM_LOCATION)} un
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min="1"
                value={addQuantity}
                onChange={(event) => setAddQuantity(event.target.value)}
                placeholder="Informe a quantidade"
              />
              <div className="flex flex-wrap gap-2">
                {QUICK_ADD_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setAddQuantity((current) => {
                        const currentNumber = Number(current)
                        const safeCurrent = Number.isFinite(currentNumber) ? currentNumber : 0
                        return (safeCurrent + preset).toString()
                      })
                    }
                  >
                    +{preset}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => handleAddModalChange(false)}>
                Cancelar
              </Button>
              <Button onClick={addStock} disabled={!addProductId || !addQuantity}>
                Confirmar entrada
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

  <Dialog open={showTransferModal} onOpenChange={handleTransferModalChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Transferir estoque entre locais</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm text-primary dark:text-primary-foreground">
              <div className="flex size-10 items-center justify-center rounded-md bg-white/70 text-primary dark:bg-primary/20">
                <ArrowLeftRight className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold">Movimente estoques entre locais</p>
                <p className="text-xs text-muted-foreground">
                  Aumente casa e pontos de venda em duas etapas: debite da origem e credite o destino sem sair desta tela.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select value={transferProductId || undefined} onValueChange={setTransferProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex flex-col text-sm">
                        <span className="font-medium">{product.name}</span>
                        <span className="text-xs text-muted-foreground">{product.size}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <LocationSelector value={transferFrom} onChange={setTransferFrom} label="De" />
              <LocationSelector value={transferTo} onChange={setTransferTo} label="Para" />
            </div>
            {selectedTransferProduct && (
              <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 px-4 py-3 text-xs text-muted-foreground sm:text-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Origem ({locationConfig[transferFrom].label}): {transferFromQuantity.toLocaleString("pt-BR")} un disponíveis
                  </span>
                  <span>
                    Destino ({locationConfig[transferTo].label}): {transferToQuantity.toLocaleString("pt-BR")} un atuais
                  </span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min="1"
                value={transferQuantity}
                onChange={(event) => setTransferQuantity(event.target.value)}
                placeholder="Informe a quantidade"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => handleTransferModalChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={transferStock}
                disabled={!transferProductId || !transferQuantity || transferFrom === transferTo}
              >
                Transferir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function InventoryPageSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="border-none">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-72" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3 pt-6">
          <Skeleton className="h-9 w-full" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3 pt-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-24" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    </div>
  )
}
