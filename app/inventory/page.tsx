"use client"

import type React from "react"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useProducts, type Product } from "@/lib/useProducts"
import { SidebarLayout } from "@/components/SidebarLayout"

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

export default function InventoryPage() {
  const { data: products = [], isLoading: loading } = useProducts()
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [editStock, setEditStock] = useState("")

  // Estados para adicionar estoque
  const [showAddModal, setShowAddModal] = useState(false)
  const [addProductId, setAddProductId] = useState("")
  const [addLocation, setAddLocation] = useState<Location>("coldRoom")
  const [addQuantity, setAddQuantity] = useState("")

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

  const addStock = async () => {
    const quantity = Number(addQuantity)
    if (quantity > 0 && addProductId) {
      // Buscar estoque atual
      const product = products.find((p: Product) => p.id === addProductId)
      if (product?.inventory) {
        const currentQuantity = product.inventory[`${addLocation}Quantity` as keyof Product['inventory']] as number || 0
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
  }

  const transferStock = async () => {
    const quantity = Number(transferQuantity)
    if (quantity > 0 && transferProductId && transferFrom !== transferTo) {
      const product = products.find((p: Product) => p.id === transferProductId)
      if (product?.inventory) {
        const fromQuantity = product.inventory[`${transferFrom}Quantity` as keyof Product['inventory']] as number || 0
        const toQuantity = product.inventory[`${transferTo}Quantity` as keyof Product['inventory']] as number || 0

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

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { label: "Esgotado", className: "bg-red-100 text-red-800" }
    if (stock <= minStock) return { label: "Crítico", className: "bg-yellow-100 text-yellow-800" }
    if (stock <= minStock * 2) return { label: "Baixo", className: "bg-orange-100 text-orange-800" }
    return { label: "Normal", className: "bg-green-100 text-green-800" }
  }

  if (loading) return <div>Loading...</div>

  const totalProducts = products.length

  // Calcular métricas gerais
  const totalColdRoom = products.reduce((sum: number, p: Product) => sum + (p.inventory?.coldRoomQuantity ?? 0), 0)
  const totalHouse = products.reduce((sum: number, p: Product) => sum + (p.inventory?.houseQuantity ?? 0), 0)
  const totalSalePoint = products.reduce((sum: number, p: Product) => sum + (p.inventory?.salePointQuantity ?? 0), 0)
  const totalValue = products.reduce((sum: number, p: Product) => sum + ((p.inventory?.totalQuantity ?? 0) * p.salePrice), 0)

  const lowStockAlerts = products.filter((p: Product) => 
    (p.inventory?.coldRoomAlert || p.inventory?.houseAlert || p.inventory?.salePointAlert)
  )

  const renderInventoryTable = (location: Location) => {
    const quantityField = `${location}Quantity` as keyof Product["inventory"]
    const minStockField = `${location}MinStock` as keyof Product["inventory"]
    const alertField = `${location}Alert` as keyof Product["inventory"]

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead>Tamanho</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Estoque</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product: Product) => {
            const stock = product.inventory?.[quantityField] ?? 0
            const minStock = product.inventory?.[minStockField] ?? 10
            const status = getStockStatus(stock, minStock)
            const isEditing = editingId === product.id && editingLocation === location

            return (
              <TableRow key={`${product.id}-${location}`}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{product.size}</Badge>
                </TableCell>
                <TableCell>R$ {product.salePrice.toFixed(2)}</TableCell>
                <TableCell>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={editStock}
                        onChange={(e) => setEditStock(e.target.value)}
                        className="w-20"
                      />
                      <Button size="sm" onClick={() => saveEdit(product.id, location)}>
                        
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditingLocation(null) }}>
                        
                      </Button>
                    </div>
                  ) : (
                    <span className="font-mono">{stock}</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={status.className}>{status.label}</Badge>
                </TableCell>
                <TableCell>R$ {(stock * product.salePrice).toFixed(2)}</TableCell>
                <TableCell>
                  {!isEditing && (
                    <Button variant="ghost" size="sm" onClick={() => startEdit(product.id, location, stock)}>
                      ✏️
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    )
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Métricas gerais */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="pos-metric-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Produtos</p>
                  <p className="text-3xl font-bold text-foreground">{totalProducts}</p>
                </div>
                <div className="text-2xl">📦</div>
              </div>
            </CardContent>
          </Card>

          <Card className="pos-metric-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Câmara Fria</p>
                  <p className="text-3xl font-bold text-blue-600">{totalColdRoom}</p>
                </div>
                <div className="text-2xl">🧊</div>
              </div>
            </CardContent>
          </Card>

          <Card className="pos-metric-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Casa</p>
                  <p className="text-3xl font-bold text-green-600">{totalHouse}</p>
                </div>
                <div className="text-2xl">🏠</div>
              </div>
            </CardContent>
          </Card>

          <Card className="pos-metric-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pontos de Venda</p>
                  <p className="text-3xl font-bold text-orange-600">{totalSalePoint}</p>
                </div>
                <div className="text-2xl">🏪</div>
              </div>
            </CardContent>
          </Card>

          <Card className="pos-metric-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                  <p className="text-3xl font-bold text-accent">R$ {(totalValue / 1000).toFixed(1)}k</p>
                </div>
                <div className="text-2xl">💰</div>
              </div>
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
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-lg font-bold mb-4">Adicionar Estoque</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Produto</label>
                  <Select value={addProductId} onValueChange={setAddProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product: Product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {product.size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Local</label>
                  <Select value={addLocation} onValueChange={(value: Location) => setAddLocation(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coldRoom">Câmara Fria</SelectItem>
                      <SelectItem value="house">Casa</SelectItem>
                      <SelectItem value="salePoint">Pontos de Venda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantidade</label>
                  <Input
                    type="number"
                    min="1"
                    value={addQuantity}
                    onChange={(e) => setAddQuantity(e.target.value)}
                    placeholder="Digite a quantidade"
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
            </div>
          </div>
        )}

        {/* Modal Transferir Estoque */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-lg font-bold mb-4">Transferir Estoque</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Produto</label>
                  <Select value={transferProductId} onValueChange={setTransferProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product: Product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {product.size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">De</label>
                    <Select value={transferFrom} onValueChange={(value: Location) => setTransferFrom(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="coldRoom">Câmara Fria</SelectItem>
                        <SelectItem value="house">Casa</SelectItem>
                        <SelectItem value="salePoint">Pontos de Venda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Para</label>
                    <Select value={transferTo} onValueChange={(value: Location) => setTransferTo(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="coldRoom">Câmara Fria</SelectItem>
                        <SelectItem value="house">Casa</SelectItem>
                        <SelectItem value="salePoint">Pontos de Venda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantidade</label>
                  <Input
                    type="number"
                    min="1"
                    value={transferQuantity}
                    onChange={(e) => setTransferQuantity(e.target.value)}
                    placeholder="Digite a quantidade"
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
            </div>
          </div>
        )}

        {/* Alertas */}
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
                        {product.inventory?.salePointAlert && `Pontos: ${product.inventory.salePointQuantity}`}
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
            <Tabs defaultValue="coldRoom" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="coldRoom">Câmara Fria</TabsTrigger>
                <TabsTrigger value="house">Casa</TabsTrigger>
                <TabsTrigger value="salePoint">Pontos de Venda</TabsTrigger>
              </TabsList>
              <TabsContent value="coldRoom">
                {renderInventoryTable("coldRoom")}
              </TabsContent>
              <TabsContent value="house">
                {renderInventoryTable("house")}
              </TabsContent>
              <TabsContent value="salePoint">
                {renderInventoryTable("salePoint")}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  )
}
