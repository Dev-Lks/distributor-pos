"use client"

import type React from "react"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useProducts, type Product } from "@/lib/useProducts"
import { SidebarLayout } from "@/components/SidebarLayout"
import { Snowflake, Home, Store } from "lucide-react"

type Location = "coldRoom" | "house" | "salePoint"

const locationLabels = {
  coldRoom: "Câmara Fria",
  house: "Casa",
  salePoint: "Pontos de Venda"
}

const locationColors = {
  coldRoom: "bg-blue-100 text-blue-800",
  house: "bg-green-100 text-green-800",
  salePoint: "bg-orange-100 text-orange-800"
}

const locationIcons = {
  coldRoom: Snowflake,
  house: Home,
  salePoint: Store
}

const locationDescriptions = {
  coldRoom: "Armazenamento refrigerado",
  house: "Estoque residencial",
  salePoint: "Pontos de venda"
}

function getStockStatus(stock: number, minStock: number) {
  if (stock === 0) {
    return { label: "Esgotado", className: "bg-red-100 text-red-800" }
  } else if (stock <= minStock) {
    return { label: "Crítico", className: "bg-yellow-100 text-yellow-800" }
  } else {
    return { label: "OK", className: "bg-green-100 text-green-800" }
  }
}

type ProductInventory = NonNullable<Product["inventory"]>

const getInventoryQuantity = (inventory: ProductInventory | undefined, location: Location): number => {
  if (!inventory) {
    return 0
  }

  const key = `${location}Quantity` as keyof ProductInventory
  const value = inventory[key]
  return typeof value === "number" ? value : 0
}

function LocationSelector({ value, onChange, label }: { value: Location | null, onChange: (location: Location) => void, label: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-3">{label}</label>
      <div className="grid grid-cols-1 gap-3">
        {(Object.keys(locationLabels) as Location[]).map((location) => {
          const Icon = locationIcons[location]
          const isSelected = value === location
          return (
            <Card
              key={location}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected
                  ? "ring-2 ring-primary bg-primary/5 border-primary"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => onChange(location)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{locationLabels[location]}</h4>
                    <p className="text-sm text-muted-foreground">{locationDescriptions[location]}</p>
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const { data: rawProducts = [], isLoading: loading } = useProducts()
  const queryClient = useQueryClient()

  // Calcular alertas para produtos
  const products = rawProducts.map((product: Product) => ({
    ...product,
    inventory: product.inventory ? {
      ...product.inventory,
      coldRoomAlert: (product.inventory.coldRoomQuantity ?? 0) <= (product.inventory.coldRoomMinStock ?? 10),
      houseAlert: (product.inventory.houseQuantity ?? 0) <= (product.inventory.houseMinStock ?? 5),
      salePointAlert: (product.inventory.salePointQuantity ?? 0) <= (product.inventory.salePointMinStock ?? 2),
      totalQuantity: (product.inventory.coldRoomQuantity ?? 0) + (product.inventory.houseQuantity ?? 0) + (product.inventory.salePointQuantity ?? 0)
    } : undefined
  }))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [editStock, setEditStock] = useState("")
  const [editingBonifications, setEditingBonifications] = useState<string | null>(null)
  const [editBonifications, setEditBonifications] = useState("")

  // Estados para filtros
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterAlert, setFilterAlert] = useState("all") // 'all', 'with_alert', 'no_alert'
  const [searchQuery, setSearchQuery] = useState("") // Busca por nome do produto

  // Estados para adicionar estoque
  const [showAddModal, setShowAddModal] = useState(false)
  const [addProductId, setAddProductId] = useState("")
  const [addLocation, setAddLocation] = useState<Location>("coldRoom")
  const [addQuantity, setAddQuantity] = useState("")
  const [addProductSearch, setAddProductSearch] = useState("")

  // Estados para transferir estoque
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferProductId, setTransferProductId] = useState("")
  const [transferFrom, setTransferFrom] = useState<Location>("coldRoom")
  const [transferTo, setTransferTo] = useState<Location>("house")
  const [transferQuantity, setTransferQuantity] = useState("")

  const startEdit = (id: string, location: Location, currentStock: number) => {
    setEditingId(id)
    setEditingLocation(location)
    setEditStock(currentStock.toString())
  }

  const saveEdit = async (id: string, location: Location) => {
    const newStock = Number(editStock)
    if (newStock >= 0) {
      await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id, location, quantity: newStock }),
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
    if (newBonifications >= 0) {
      await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, bonifications: newBonifications }),
      })
      queryClient.invalidateQueries({ queryKey: ["products"] })
    }
    setEditingBonifications(null)
    setEditBonifications("")
  }

  const addStock = async () => {
    const quantity = Number(addQuantity)
    if (quantity > 0 && addProductId) {
      // Buscar estoque atual
      const product = products.find((p: Product) => p.id === addProductId)
      if (product) {
        const currentQuantity = getInventoryQuantity(product.inventory, addLocation)
        const newQuantity = currentQuantity + quantity

        await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: addProductId, location: addLocation, quantity: newQuantity }),
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
      const product = products.find((p: Product) => p.id === transferProductId)
      if (product?.inventory) {
        const fromQuantity = getInventoryQuantity(product.inventory, transferFrom)
        const toQuantity = getInventoryQuantity(product.inventory, transferTo)

        if (fromQuantity >= quantity) {
          // Atualizar origem (diminuir)
          await fetch("/api/inventory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: transferProductId, location: transferFrom, quantity: fromQuantity - quantity }),
          })

          // Atualizar destino (aumentar)
          await fetch("/api/inventory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: transferProductId, location: transferTo, quantity: toQuantity + quantity }),
          })

          queryClient.invalidateQueries({ queryKey: ["products"] })
        }
      }
    }
    setShowTransferModal(false)
    setTransferProductId("")
    setTransferQuantity("")
  }

  const totalBonifications = products.reduce((sum: number, p: Product) => sum + p.bonifications, 0)

  // Calcular métricas gerais (removidas da UI, mas mantidas para referência)
  const totalColdRoom = products.reduce((sum: number, p: Product) => sum + (p.inventory?.coldRoomQuantity ?? 0), 0)
  const totalHouse = products.reduce((sum: number, p: Product) => sum + (p.inventory?.houseQuantity ?? 0), 0)
  const totalSalePoint = products.reduce((sum: number, p: Product) => sum + (p.inventory?.salePointQuantity ?? 0), 0)
  const lowStockAlerts = products.filter((p: Product) =>
    (p.inventory?.coldRoomAlert || p.inventory?.houseAlert || p.inventory?.salePointAlert)
  )  // Filtrar produtos
  const categories = ["all", ...Array.from(new Set(products.map((p: Product) => p.category).filter(Boolean))) as string[]]
  const filteredProducts = products.filter((product: Product) => {
    const matchesCategory = filterCategory === "all" || product.category === filterCategory
    const matchesAlert = filterAlert === "all" || 
      (filterAlert === "with_alert" && (product.inventory?.coldRoomAlert || product.inventory?.houseAlert || product.inventory?.salePointAlert)) ||
      (filterAlert === "no_alert" && !(product.inventory?.coldRoomAlert || product.inventory?.houseAlert || product.inventory?.salePointAlert))
    const matchesSearch = searchQuery === "" || product.name.toLowerCase().includes(searchQuery.toLowerCase()) || product.size.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesAlert && matchesSearch
  })

  const renderInventoryTable = (location: Location) => {
    const quantityField = `${location}Quantity` as keyof Product["inventory"]
    const minStockField = `${location}MinStock` as keyof Product["inventory"]
    const alertField = `${location}Alert` as keyof Product["inventory"]

    const locationData = {
      coldRoom: { icon: "🧊", title: "Câmara Fria", desc: "Produtos refrigerados" },
      house: { icon: "🏠", title: "Casa", desc: "Estoque residencial" },
      salePoint: { icon: "🏪", title: "Pontos de Venda", desc: "Disponível para venda" }
    }

    const { icon, title, desc } = locationData[location]

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <div>
              <div>{title}</div>
              <div className="text-sm font-normal text-muted-foreground">{desc}</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm">Produto</TableHead>
                  <TableHead className="text-xs md:text-sm">Categoria</TableHead>
                  <TableHead className="text-center text-xs md:text-sm">Bonificações</TableHead>
                  <TableHead className="text-right text-xs md:text-sm">Estoque</TableHead>
                  <TableHead className="text-center text-xs md:text-sm">Status</TableHead>
                  <TableHead className="text-right text-xs md:text-sm">Valor</TableHead>
                  <TableHead className="w-16 md:w-20 text-xs md:text-sm">Ações</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {filteredProducts.map((product: Product) => {
                const stock = product.inventory?.[quantityField] ?? 0
                const minStock = product.inventory?.[minStockField] ?? 10
                const status = getStockStatus(stock, minStock)
                const isEditing = editingId === product.id && editingLocation === location

                return (
                  <TableRow key={`${product.id}-${location}`} className={`${product.inventory?.[alertField] ? "bg-orange-50" : ""} ${product.bonifications > 0 ? "bg-blue-50/30" : ""}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">{product.size}</div>
                        </div>
                        {product.bonifications > 0 && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            🎁 {product.bonifications}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category || "Sem categoria"}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {editingBonifications === product.id ? (
                        <div className="flex items-center gap-2 justify-center">
                          <Input
                            type="number"
                            min="0"
                            value={editBonifications}
                            onChange={(e) => setEditBonifications(e.target.value)}
                            className="w-16 text-center"
                          />
                        </div>
                      ) : (
                        <span className={`font-mono font-bold ${product.bonifications > 0 ? "text-blue-600" : "text-gray-400"}`}>
                          {product.bonifications}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex items-center gap-2 justify-end">
                          <Input
                            type="number"
                            min="0"
                            value={editStock}
                            onChange={(e) => setEditStock(e.target.value)}
                            className="w-20 text-right"
                          />
                        </div>
                      ) : (
                        <span className={`font-mono font-bold ${stock <= minStock ? "text-red-600" : "text-green-600"}`}>
                          {stock}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={status.className}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {(stock * product.salePrice).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {isEditing ? (
                          <>
                            <Button size="sm" onClick={() => saveEdit(product.id, location)}>
                              ✓
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditingLocation(null) }}>
                              ✕
                            </Button>
                          </>
                        ) : editingBonifications === product.id ? (
                          <>
                            <Button size="sm" onClick={() => saveBonifications(product.id)}>
                              ✓
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingBonifications(null)}>
                              ✕
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => startEdit(product.id, location, stock)}>
                              ✏️
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => startEditBonifications(product.id, product.bonifications)}>
                              🎁
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
        </CardContent>
      </Card>
    )
  }

  return (
    <SidebarLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Métricas gerais - movidas para o layout superior */}

        {/* Filtros e Métricas */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🔍</span>
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="search" className="text-sm font-medium">Buscar Produto</Label>
                <Input
                  id="search"
                  type="text"
                  placeholder="Nome ou tamanho do produto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="category-filter" className="text-sm font-medium">Categoria</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">📦 Todas</SelectItem>
                    {categories.filter(c => c !== "all").map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="alert-filter" className="text-sm font-medium">Status de Estoque</Label>
                <Select value={filterAlert} onValueChange={setFilterAlert}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Todos os produtos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">📊 Todos</SelectItem>
                    <SelectItem value="with_alert">⚠️ Com Alertas</SelectItem>
                    <SelectItem value="no_alert">✅ Sem Alertas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Métricas Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📈</span>
                Visão Geral
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total de Produtos</span>
                <span className="font-bold text-lg">{filteredProducts.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Com Alertas</span>
                <span className="font-bold text-orange-600">{lowStockAlerts.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Bonificações Disponíveis</span>
                <span className="font-bold text-blue-600">{totalBonifications}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Valor Total</span>
                <span className="font-bold text-green-600">R$ {(filteredProducts.reduce((sum: number, p: Product) => sum + ((p.inventory?.totalQuantity ?? 0) * p.salePrice), 0) / 1000).toFixed(1)}k</span>
              </div>
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>⚡</span>
                Ações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={() => setShowAddModal(true)}
                className="w-full justify-start"
                variant="outline"
              >
                ➕ Adicionar Estoque
              </Button>
              <Button
                onClick={() => setShowTransferModal(true)}
                className="w-full justify-start"
                variant="outline"
              >
                🔄 Transferir Estoque
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Ações de Estoque */}
        <Card className="pos-metric-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">🔄 Movimentações de Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={() => setShowAddModal(true)} className="bg-green-600 hover:bg-green-700">
                ➕ Adicionar Estoque
              </Button>
              <Button onClick={() => setShowTransferModal(true)} className="bg-blue-600 hover:bg-blue-700">
                ⇄ Transferir Estoque
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Modal Adicionar Estoque */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="w-[500px]">
            <DialogHeader>
              <DialogTitle>Adicionar Estoque</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="addProductSearch">Buscar Produto</Label>
                <Input
                  id="addProductSearch"
                  type="text"
                  placeholder="Digite o nome do produto..."
                  value={addProductSearch}
                  onChange={(e) => setAddProductSearch(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="addProductId">Produto</Label>
                <select
                  id="addProductId"
                  value={addProductId}
                  onChange={(e) => setAddProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="">Selecione um produto</option>
                  {products
                    .filter((product: Product) => 
                      addProductSearch === "" || 
                      product.name.toLowerCase().includes(addProductSearch.toLowerCase()) ||
                      product.size.toLowerCase().includes(addProductSearch.toLowerCase())
                    )
                    .map((product: Product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {product.size} (Estoque atual: {product.inventory?.[`${addLocation}Quantity`] || 0})
                      </option>
                    ))}
                </select>
              </div>
              <LocationSelector
                value={addLocation}
                onChange={setAddLocation}
                label="Local de Destino"
              />
              <div>
                <Label htmlFor="addQuantity">Quantidade</Label>
                <Input
                  id="addQuantity"
                  type="number"
                  min="1"
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(e.target.value)}
                  placeholder="Digite a quantidade"
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={addStock} disabled={!addProductId || !addQuantity}>
                  Adicionar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Transferir Estoque */}
        <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
          <DialogContent className="w-[600px]">
            <DialogHeader>
              <DialogTitle>Transferir Estoque</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="transferProductId">Produto</Label>
                <select
                  id="transferProductId"
                  value={transferProductId}
                  onChange={(e) => setTransferProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="">Selecione um produto</option>
                  {products.map((product: Product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.size}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <LocationSelector
                  value={transferFrom}
                  onChange={setTransferFrom}
                  label="De"
                />
                <LocationSelector
                  value={transferTo}
                  onChange={setTransferTo}
                  label="Para"
                />
              </div>
              <div>
                <Label htmlFor="transferQuantity">Quantidade</Label>
                <Input
                  id="transferQuantity"
                  type="number"
                  min="1"
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(e.target.value)}
                  placeholder="Digite a quantidade"
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowTransferModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={transferStock} disabled={!transferProductId || !transferQuantity || transferFrom === transferTo}>
                  Transferir
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>        {/* Alertas */}
        {lowStockAlerts.length > 0 && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                 Alertas de Estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStockAlerts.map((product: Product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.inventory?.coldRoomAlert && `Câmara Fria: ${product.inventory.coldRoomQuantity} `}
                        {product.inventory?.houseAlert && `Casa: ${product.inventory.houseQuantity} `}
                        {product.inventory?.salePointAlert && `Pontos: ${product.inventory.salePointQuantity} `}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controle de Estoque por Local */}
        <Card className="pos-metric-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"> Controle de Estoque por Local</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Tente ajustar os filtros ou adicionar produtos ao inventário.
                </p>
                <Button onClick={() => { setFilterCategory("all"); setFilterAlert("all") }}>
                  Mostrar Todos os Produtos
                </Button>
              </div>
            ) : (
              <Tabs defaultValue="coldRoom" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-auto">
                  <TabsTrigger value="coldRoom" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-3">
                    <span className="hidden sm:inline">🧊</span> <span className="sm:hidden">❄️</span>
                    <span className="hidden sm:inline">Câmara Fria</span>
                    <span className="sm:inline hidden md:inline">Câmara</span>
                  </TabsTrigger>
                  <TabsTrigger value="house" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-3">
                    <span className="hidden sm:inline">🏠</span> <span className="sm:hidden">🏡</span>
                    <span className="hidden sm:inline">Casa</span>
                  </TabsTrigger>
                  <TabsTrigger value="salePoint" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2 md:py-3">
                    <span className="hidden sm:inline">🏪</span> <span className="sm:hidden">🏪</span>
                    <span className="hidden sm:inline">Pontos de Venda</span>
                    <span className="sm:inline hidden md:inline">Pontos</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="coldRoom" className="mt-6">
                  {renderInventoryTable("coldRoom")}
                </TabsContent>
                <TabsContent value="house" className="mt-6">
                  {renderInventoryTable("house")}
                </TabsContent>
                <TabsContent value="salePoint" className="mt-6">
                  {renderInventoryTable("salePoint")}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  )
}
