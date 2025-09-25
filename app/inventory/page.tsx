"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { SidebarLayout } from "@/components/SidebarLayout"
import { useProducts, type Product } from "@/lib/useProducts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
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
  X
} from "lucide-react"

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
  ok: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700"
}

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
  const [addLocation, setAddLocation] = useState<Location>("coldRoom")
  const [addQuantity, setAddQuantity] = useState("")
  const [addProductSearch, setAddProductSearch] = useState("")
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferProductId, setTransferProductId] = useState("")
  const [transferFrom, setTransferFrom] = useState<Location>("coldRoom")
  const [transferTo, setTransferTo] = useState<Location>("house")
  const [transferQuantity, setTransferQuantity] = useState("")

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

  const startEdit = (id: string, location: Location, currentStock: number) => {
    setEditingId(id)
    setEditingLocation(location)
    setEditStock(currentStock.toString())
  }

  const saveEdit = async (id: string, location: Location) => {
    const newStock = Number(editStock)
    if (Number.isFinite(newStock) && newStock >= 0) {
      await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id, location, quantity: newStock })
      })
      queryClient.invalidateQueries({ queryKey: ["products"] })
    }
    setEditingId(null)
    setEditingLocation(null)
    setEditStock("")
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
    const quantity = Number(addQuantity)
    if (quantity > 0 && addProductId) {
      const product = products.find((p) => p.id === addProductId)
      if (product) {
        const currentQuantity = getInventoryQuantity(product.inventory, addLocation)
        const newQuantity = currentQuantity + quantity

        await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: addProductId, location: addLocation, quantity: newQuantity })
        })
        queryClient.invalidateQueries({ queryKey: ["products"] })
      }
    }

    setShowAddModal(false)
    setAddProductId("")
    setAddQuantity("")
    setAddProductSearch("")
  }

  const transferStock = async () => {
    const quantity = Number(transferQuantity)
    if (quantity > 0 && transferProductId && transferFrom !== transferTo) {
      const product = products.find((p) => p.id === transferProductId)
      if (product?.inventory) {
        const fromQuantity = getInventoryQuantity(product.inventory, transferFrom)
        const toQuantity = getInventoryQuantity(product.inventory, transferTo)

        if (fromQuantity >= quantity) {
          await fetch("/api/inventory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: transferProductId, location: transferFrom, quantity: fromQuantity - quantity })
          })

          await fetch("/api/inventory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: transferProductId, location: transferTo, quantity: toQuantity + quantity })
          })

          queryClient.invalidateQueries({ queryKey: ["products"] })
        }
      }
    }

    setShowTransferModal(false)
    setTransferProductId("")
    setTransferQuantity("")
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
                            product.inventory?.[alertField] && "bg-amber-50/60",
                            product.bonifications > 0 && !isEditingBonifications && "bg-primary/5"
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
                                  stock <= minStock ? "text-red-600" : "text-emerald-600"
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
      <SidebarLayout>
        <div className="space-y-6 pb-8">
          <InventoryPageSkeleton />
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      <div className="space-y-6 pb-8">
        <Card className="border-none bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 shadow-none">
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <Badge variant="secondary" className="bg-primary/15 text-primary">
                  Inventário em tempo real
                </Badge>
                <CardTitle className="text-2xl md:text-3xl">Painel de inventário</CardTitle>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Acompanhe estoques, identifique alertas críticos e movimente produtos entre locais com rapidez.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setShowTransferModal(true)} className="w-full sm:w-auto">
                  <ArrowLeftRight className="size-4" />
                  Transferir estoque
                </Button>
                <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
                  <Plus className="size-4" />
                  Registrar entrada
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <Card className="border-amber-400/50 bg-amber-50/60 dark:bg-amber-500/10">
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

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar entrada de estoque</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
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
                            {product.size} • Estoque atual: {getInventoryQuantity(product.inventory, addLocation)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <LocationSelector value={addLocation} onChange={setAddLocation} label="Local de destino" />
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min="1"
                value={addQuantity}
                onChange={(event) => setAddQuantity(event.target.value)}
                placeholder="Informe a quantidade"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancelar
              </Button>
              <Button onClick={addStock} disabled={!addProductId || !addQuantity}>
                Confirmar entrada
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Transferir estoque entre locais</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
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
              <Button variant="outline" onClick={() => setShowTransferModal(false)}>
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
    </SidebarLayout>
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
