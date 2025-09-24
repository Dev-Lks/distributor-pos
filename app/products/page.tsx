"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useProducts, type Product } from "@/lib/useProducts"
import { SidebarLayout } from "@/components/SidebarLayout"
import { Plus, Edit, Trash2, Search, Package } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export default function ProductsPage() {
  const { data: products = [], isLoading, refetch } = useProducts()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedSize, setSelectedSize] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    size: "",
    cost: "",
    salePrice: "",
    category: "",
    supplier: "",
    sku: "",
    bonifications: "0"
  })

  const categories = ["all", ...Array.from(new Set(products.map((p: Product) => p.category).filter(Boolean)))] as string[]
  const sizes = ["all", ...Array.from(new Set(products.map((p: Product) => p.size)))] as string[]

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    const matchesSize = selectedSize === "all" || product.size === selectedSize
    return matchesSearch && matchesCategory && matchesSize
  })

  const resetForm = () => {
    setFormData({
      name: "",
      size: "",
      cost: "",
      salePrice: "",
      category: "",
      supplier: "",
      sku: "",
      bonifications: "0"
    })
  }

  const handleAddProduct = async () => {
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          cost: parseFloat(formData.cost),
          salePrice: parseFloat(formData.salePrice),
          bonifications: parseInt(formData.bonifications)
        }),
      })

      if (response.ok) {
        refetch()
        setIsAddDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error("Error adding product:", error)
    }
  }

  const handleEditProduct = async () => {
    if (!editingProduct) return

    try {
      const response = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingProduct.id,
          ...formData,
          cost: parseFloat(formData.cost),
          salePrice: parseFloat(formData.salePrice),
          bonifications: parseInt(formData.bonifications)
        }),
      })

      if (response.ok) {
        refetch()
        setIsEditDialogOpen(false)
        setEditingProduct(null)
        resetForm()
      }
    } catch (error) {
      console.error("Error updating product:", error)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
      const response = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId }),
      })

      if (response.ok) {
        refetch()
      }
    } catch (error) {
      console.error("Error deleting product:", error)
    }
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      size: product.size,
      cost: product.cost.toString(),
      salePrice: product.salePrice.toString(),
      category: product.category || "",
      supplier: product.supplier || "",
      sku: product.sku || "",
      bonifications: product.bonifications.toString()
    })
    setIsEditDialogOpen(true)
  }

  const ProductForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Nome do produto"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="size">Tamanho</Label>
        <Input
          id="size"
          value={formData.size}
          onChange={(e) => setFormData({ ...formData, size: e.target.value })}
          placeholder="Ex: 1,5L, 600ml, 50L"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cost">Custo (R$)</Label>
        <Input
          id="cost"
          type="number"
          step="0.01"
          value={formData.cost}
          onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
          placeholder="0.00"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="salePrice">Preço de Venda (R$)</Label>
        <Input
          id="salePrice"
          type="number"
          step="0.01"
          value={formData.salePrice}
          onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
          placeholder="0.00"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoria</Label>
        <Input
          id="category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          placeholder="Ex: Cerveja, Vinho"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplier">Fornecedor</Label>
        <Input
          id="supplier"
          value={formData.supplier}
          onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
          placeholder="Nome do fornecedor"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sku">SKU</Label>
        <Input
          id="sku"
          value={formData.sku}
          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
          placeholder="Código único"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bonifications">Bonificações</Label>
        <Input
          id="bonifications"
          type="number"
          value={formData.bonifications}
          onChange={(e) => setFormData({ ...formData, bonifications: e.target.value })}
          placeholder="0"
        />
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando produtos...</div>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Produtos</h1>
            <p className="text-muted-foreground">Gerencie seu catálogo de produtos</p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Produto</DialogTitle>
              </DialogHeader>
              <ProductForm />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddProduct}>
                  Adicionar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <Input
                  id="search"
                  placeholder="Nome ou SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.slice(1).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Tamanho</Label>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tamanhos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tamanhos</SelectItem>
                    {sizes.slice(1).map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedCategory("all")
                    setSelectedSize("all")
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Produtos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Produtos ({filteredProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead>Preço Venda</TableHead>
                    <TableHead>Bonificações</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product: Product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.size}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.category || "Sem categoria"}</Badge>
                      </TableCell>
                      <TableCell>R$ {product.cost.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">R$ {product.salePrice.toFixed(2)}</TableCell>
                      <TableCell>
                        {product.bonifications > 0 && (
                          <Badge className="bg-blue-100 text-blue-800">
                            {product.bonifications}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{product.sku || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o produto "{product.name} {product.size}"?
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Dialog de Edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Produto</DialogTitle>
            </DialogHeader>
            <ProductForm isEdit />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditProduct}>
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarLayout>
  )
}