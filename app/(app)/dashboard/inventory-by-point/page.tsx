"use client"

import { useState, useMemo, AwaitedReactNode, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from "react"
import { Plus, Edit, Trash2, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useProducts } from "@/lib/useProducts"
import { usePointsOfSale, type PointOfSale } from "@/lib/usePointsOfSale"
import {
  useProductPointsOfSale,
  useCreateProductPointOfSale,
  useUpdateProductPointOfSale,
  useDeleteProductPointOfSale
} from "@/lib/useProductPointsOfSale"

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

  const pointsOptions = useMemo(
    () => points.map((point: PointOfSale) => ({ id: point.id, name: point.name })),
    [points]
  )

  const handleCreate = () => {
    if (selectedProductId && selectedPointId && selectedPointId !== "all" && quantity) {
      createMutation.mutate({
        productId: selectedProductId,
        pointOfSaleId: selectedPointId,
        quantity: Number.parseInt(quantity, 10),
        minStock: Number.parseInt(minStock, 10)
      })
      setSelectedProductId("")
      setQuantity("")
      setMinStock("2")
    }
  }

  const handleEdit = (pps: any) => {
    setEditingId(pps.id)
    setEditQuantity(String(pps.quantity))
    setEditMinStock(String(pps.minStock))
  }

  const handleSaveEdit = () => {
    if (!editingId) return

    updateMutation.mutate({
      id: editingId,
      quantity: Number.parseInt(editQuantity, 10),
      minStock: Number.parseInt(editMinStock, 10)
    })
    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja remover este produto deste ponto de venda?")) {
      deleteMutation.mutate(id)
    }
  }

  const filteredProductPointsOfSale = selectedPointId === "all"
    ? productPointsOfSale
    : productPointsOfSale.filter((pps: any) => pps.pointOfSaleId === selectedPointId)

  if (productsLoading || pointsLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Carregando estoque por ponto...
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <Card className="border-none bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 shadow-none">
        <CardHeader className="pb-4">
          <div className="space-y-2">
            <Badge variant="secondary" className="bg-primary/15 text-primary">
              Distribuição inteligente
            </Badge>
            <CardTitle className="text-2xl md:text-3xl">Estoque por ponto de venda</CardTitle>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Acompanhe a disponibilidade em cada unidade e distribua bonificações com rapidez.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Package className="size-4" />
              {productPointsOfSale.length.toLocaleString("pt-BR")}
              <span className="text-xs uppercase tracking-wide">cadastros de distribuição</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {pointsOptions.length} ponto(s) ativo(s)
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-5" />
            Filtrar por ponto de venda
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:max-w-sm">
          <Label>Escolha o ponto</Label>
          <Select value={selectedPointId} onValueChange={setSelectedPointId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um ponto de venda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os pontos</SelectItem>
              {pointsOptions.map((point: { id: Key | null | undefined; name: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined }) => (
                <SelectItem key={String(point.id)} value={String(point.id)}>
                  {point.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="size-5" />
            Adicionar produto a um ponto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label htmlFor="product">Produto</Label>
              <Select value={selectedProductId || undefined} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product: any) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                      {product.sku ? ` (${product.sku})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="point">Ponto de venda</Label>
              <Select value={selectedPointId} onValueChange={setSelectedPointId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um ponto" />
                </SelectTrigger>
                <SelectContent>
                  {pointsOptions.map((point: { id: Key | null | undefined; name: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined }) => (
                    <SelectItem key={String(point.id)} value={String(point.id)}>
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
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="minStock">Estoque mínimo</Label>
              <Input
                id="minStock"
                type="number"
                value={minStock}
                onChange={(event) => setMinStock(event.target.value)}
                placeholder="2"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleCreate}
                disabled={!selectedProductId || selectedPointId === "all" || !quantity || createMutation.isPending}
              >
                {createMutation.isPending ? "Adicionando..." : "Adicionar"}
              </Button>
            </div>
          </div>
          {createMutation.error && (
            <p className="mt-2 text-sm text-red-500">
              Erro ao adicionar: {createMutation.error.message}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produtos por ponto de venda</CardTitle>
        </CardHeader>
        <CardContent>
          {updateMutation.error && (
            <p className="mb-4 text-sm text-red-500">
              Erro ao atualizar: {updateMutation.error.message}
            </p>
          )}
          {deleteMutation.error && (
            <p className="mb-4 text-sm text-red-500">
              Erro ao remover: {deleteMutation.error.message}
            </p>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm">Produto</TableHead>
                  <TableHead className="text-xs md:text-sm">Ponto de venda</TableHead>
                  <TableHead className="text-xs md:text-sm">Quantidade</TableHead>
                  <TableHead className="text-xs md:text-sm">Estoque mínimo</TableHead>
                  <TableHead className="text-xs md:text-sm">Status</TableHead>
                  <TableHead className="w-28 text-xs md:text-sm">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProductPointsOfSale.map((pps: any) => (
                  <TableRow key={pps.id}>
                    <TableCell className="text-xs md:text-sm">
                      {pps.product.name}
                      {pps.product.sku ? ` (${pps.product.sku})` : ""}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm">{pps.pointOfSale.name}</TableCell>
                    <TableCell className="text-xs md:text-sm">
                      {editingId === pps.id ? (
                        <Input
                          type="number"
                          value={editQuantity}
                          onChange={(event) => setEditQuantity(event.target.value)}
                          className="h-8 text-xs md:text-sm"
                        />
                      ) : (
                        pps.quantity
                      )}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm">
                      {editingId === pps.id ? (
                        <Input
                          type="number"
                          value={editMinStock}
                          onChange={(event) => setEditMinStock(event.target.value)}
                          className="h-8 text-xs md:text-sm"
                        />
                      ) : (
                        pps.minStock
                      )}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm">
                      <span className={pps.quantity <= pps.minStock ? "text-red-600" : "text-green-600"}>
                        {pps.quantity <= pps.minStock ? "Baixo" : "OK"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {editingId === pps.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={handleSaveEdit}
                              disabled={updateMutation.isPending}
                              className="h-7 text-xs"
                            >
                              {updateMutation.isPending ? "Salvando..." : "Salvar"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                              className="h-7 text-xs"
                            >
                              Cancelar
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(pps)}
                              className="h-7 p-0.5 text-xs"
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(pps.id)}
                              disabled={deleteMutation.isPending}
                              className="h-7 p-0.5 text-xs"
                            >
                              {deleteMutation.isPending ? "Removendo..." : <Trash2 className="size-4" />}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
