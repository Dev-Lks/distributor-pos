"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useProducts } from "@/lib/useProducts"
import { usePointsOfSale } from "@/lib/usePointsOfSale"
import { useProductPointsOfSale, useCreateProductPointOfSale, useUpdateProductPointOfSale, useDeleteProductPointOfSale } from "@/lib/useProductPointsOfSale"
import { SidebarLayout } from "@/components/SidebarLayout"
import { Plus, Edit, Trash2, Package } from "lucide-react"

export default function InventoryByPointPage() {
  const { data: products = [], isLoading: productsLoading } = useProducts()
  const { data: points = [], isLoading: pointsLoading } = usePointsOfSale()
  const { data: productPointsOfSale = [] } = useProductPointsOfSale()

  const createMutation = useCreateProductPointOfSale()
  const updateMutation = useUpdateProductPointOfSale()
  const deleteMutation = useDeleteProductPointOfSale()

  const [selectedPointId, setSelectedPointId] = useState<string>("all")
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [quantity, setQuantity] = useState("")
  const [minStock, setMinStock] = useState("2")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQuantity, setEditQuantity] = useState("")
  const [editMinStock, setEditMinStock] = useState("")

  const handleCreate = () => {
    if (selectedProductId && selectedPointId && quantity) {
      createMutation.mutate({
        productId: selectedProductId,
        pointOfSaleId: selectedPointId,
        quantity: parseInt(quantity),
        minStock: parseInt(minStock)
      })
      setSelectedProductId("")
      setSelectedPointId("")
      setQuantity("")
      setMinStock("2")
    }
  }

  const handleEdit = (pps: any) => {
    setEditingId(pps.id)
    setEditQuantity(pps.quantity.toString())
    setEditMinStock(pps.minStock.toString())
  }

  const handleSaveEdit = () => {
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        quantity: parseInt(editQuantity),
        minStock: parseInt(editMinStock)
      })
      setEditingId(null)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja remover este produto deste ponto de venda?")) {
      deleteMutation.mutate(id)
    }
  }

  const filteredProductPointsOfSale = selectedPointId === "all"
    ? productPointsOfSale
    : productPointsOfSale.filter((pps: any) => pps.pointOfSaleId === selectedPointId)

  if (productsLoading || pointsLoading) return <div className="flex justify-center items-center h-64">Carregando...</div>

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Estoque por Ponto de Venda</h1>
          <p className="text-muted-foreground">Gerencie o estoque de produtos em cada ponto de venda</p>
        </div>

        {/* Filtro por Ponto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Filtrar por Ponto de Venda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedPointId} onValueChange={setSelectedPointId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um ponto de venda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os pontos</SelectItem>
                {points.map((point: any) => (
                  <SelectItem key={point.id} value={point.id}>
                    {point.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Adicionar Produto a Ponto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Adicionar Produto a Ponto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="product">Produto</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product: any) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} {product.sku && `(${product.sku})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="point">Ponto de Venda</Label>
                <Select value={selectedPointId} onValueChange={setSelectedPointId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um ponto" />
                  </SelectTrigger>
                  <SelectContent>
                    {points.map((point: any) => (
                      <SelectItem key={point.id} value={point.id}>
                        {point.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="minStock">Estoque Mínimo</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  placeholder="2"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleCreate}
                  disabled={!selectedProductId || !selectedPointId || !quantity || createMutation.isPending}
                >
                  {createMutation.isPending ? "Adicionando..." : "Adicionar"}
                </Button>
              </div>
            </div>
            {createMutation.error && (
              <div className="text-red-500 mt-2">Erro ao adicionar: {createMutation.error.message}</div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Produtos por Ponto */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos por Ponto de Venda</CardTitle>
          </CardHeader>
          <CardContent>
            {updateMutation.error && (
              <div className="text-red-500 mb-4">Erro ao atualizar: {updateMutation.error.message}</div>
            )}
            {deleteMutation.error && (
              <div className="text-red-500 mb-4">Erro ao remover: {deleteMutation.error.message}</div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Ponto de Venda</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Estoque Mínimo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProductPointsOfSale.map((pps: any) => (
                  <TableRow key={pps.id}>
                    <TableCell>
                      {pps.product.name} {pps.product.sku && `(${pps.product.sku})`}
                    </TableCell>
                    <TableCell>{pps.pointOfSale.name}</TableCell>
                    <TableCell>
                      {editingId === pps.id ? (
                        <Input
                          type="number"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(e.target.value)}
                        />
                      ) : (
                        pps.quantity
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === pps.id ? (
                        <Input
                          type="number"
                          value={editMinStock}
                          onChange={(e) => setEditMinStock(e.target.value)}
                        />
                      ) : (
                        pps.minStock
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={pps.quantity <= pps.minStock ? "text-red-600" : "text-green-600"}>
                        {pps.quantity <= pps.minStock ? "Baixo" : "OK"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {editingId === pps.id ? (
                          <>
                            <Button size="sm" onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                              {updateMutation.isPending ? "Salvando..." : "Salvar"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                              Cancelar
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleEdit(pps)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(pps.id)} disabled={deleteMutation.isPending}>
                              {deleteMutation.isPending ? "Removendo..." : <Trash2 className="w-4 h-4" />}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  )
}