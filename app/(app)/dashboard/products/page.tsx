"use client"

import { useState, useMemo, useCallback } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useProducts, type Product } from "@/hooks/useProducts"
import { usePointsOfSale } from "@/hooks/usePointsOfSale"
import { usePullToRefresh } from "@/hooks/usePullToRefresh"
import { useDebounce } from "@/hooks/useDebounce"
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator"
import { StockAllocationDialog } from "@/components/inventory/StockAllocationDialog"
import { 
  Sparkles, 
  X, 
  Loader2, 
  Plus, 
  Package, 
  Grid3x3, 
  List, 
  Upload, 
  Copy,
  LayoutGrid,
  Barcode
} from "lucide-react"

// Componentes modulares
import { ProductCard } from "./components/ProductCard"
import { ProductTable } from "./components/ProductTable"
import { ProductFilters } from "./components/ProductFilters"
import { BasicTab } from "./components/ProductForm/BasicTab"
import { PricingTab } from "./components/ProductForm/PricingTab"
import { IdentityTab } from "./components/ProductForm/IdentityTab"
import { ImportDialog } from "./components/ImportDialog"
import { QuickBarcodeCreate } from "@/components/products/QuickBarcodeCreate"
import { formatCurrency } from "@/lib/utils/formatters"

// Hook e tipos
import { useProductForm, mapProductToForm } from "./hooks/useProductForm"
import { type ProductFormState, initialFormState } from "./types"

// Hardware
import { useBarcodeScanner } from "@/lib/hardware/useBarcodeScanner"
import { BarcodeInput } from "@/components/hardware/BarcodeInput"

type ViewMode = "card" | "table"

export default function ProductsPage() {
  const { data: products = [], isLoading, refetch } = useProducts()
  const { data: pointsOfSale = [] } = usePointsOfSale()
  
  // Pull-to-Refresh
  const { isPulling, isRefreshing, progress, pullDistance } = usePullToRefresh({
    onRefresh: async () => {
      await refetch()
    },
    threshold: 80,
  })
  
  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>("card")
  
  // Filters (com debounce para search)
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearch = useDebounce(searchTerm, 300) // Debounce de 300ms
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedSize, setSelectedSize] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  
  // Dialogs
  const [showCreatePanel, setShowCreatePanel] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isStockAllocationOpen, setIsStockAllocationOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isQuickBarcodeCreateOpen, setIsQuickBarcodeCreateOpen] = useState(false)
  
  // State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [productForAllocation, setProductForAllocation] = useState<Product | null>(null)
  const [productToDuplicate, setProductToDuplicate] = useState<Product | null>(null)

  // Forms usando custom hook
  const createForm = useProductForm({
    onSuccess: () => {
      refetch()
      setShowCreatePanel(false)
    },
  })

  const editForm = useProductForm({
    initialData: editingProduct ?? undefined,
    onSuccess: () => {
      refetch()
      setIsEditDialogOpen(false)
      setEditingProduct(null)
    },
  })

  // Computed values
  const categories = useMemo(
    () => ["all", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))] as string[],
    [products]
  )
  
  const sizes = useMemo(
    () => ["all", ...Array.from(new Set(products.map((p) => p.size)))],
    [products]
  )
  
  const brandSuggestions = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand).filter(Boolean))) as string[],
    [products]
  )
  
  const packagingSuggestions = useMemo(
    () => Array.from(new Set(products.map((p) => p.packaging).filter(Boolean))) as string[],
    [products]
  )

  const filteredProducts = useMemo(() => {
    return products.filter((product: Product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        product.sku?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (Array.isArray(product.tags) && product.tags.some((tag: string) => 
          tag.toLowerCase().includes(debouncedSearch.toLowerCase())
        ))
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
      const matchesSize = selectedSize === "all" || product.size === selectedSize
      return matchesSearch && matchesCategory && matchesSize
    })
  }, [products, debouncedSearch, selectedCategory, selectedSize])

  // Handlers com useCallback para memoization
  const handleAddProduct = useCallback(async () => {
    const success = await createForm.submitForm("/api/products", "POST")
    if (success) {
      createForm.resetForm()
    }
  }, [createForm])

  const handleEditProduct = useCallback(async () => {
    if (!editingProduct) return
    await editForm.submitForm("/api/products", "PATCH", editingProduct.id)
  }, [editForm, editingProduct])

  const handleDeleteProduct = useCallback(async (productId: string) => {
    try {
      const response = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(data?.error || "Não foi possível excluir o produto.")
      }

      toast.success("Produto removido")
      await refetch()
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error(error instanceof Error ? error.message : "Falha ao excluir produto.")
    }
  }, [refetch])

  const handleDuplicateProduct = useCallback((product: Product) => {
    const formData = mapProductToForm(product)
    // Adiciona (Cópia) ao nome
    formData.name = `${formData.name} (Cópia)`
    formData.sku = formData.sku ? `${formData.sku}-COPY` : ""
    
    createForm.formData.name = formData.name
    createForm.formData.size = formData.size
    createForm.formData.category = formData.category
    createForm.formData.brand = formData.brand
    createForm.formData.tags = formData.tags
    createForm.formData.cost = formData.cost
    createForm.formData.salePrice = formData.salePrice
    createForm.formData.supplier = formData.supplier
    createForm.formData.bonifications = formData.bonifications
    createForm.formData.sku = formData.sku
    createForm.formData.packaging = formData.packaging
    createForm.formData.origin = formData.origin
    createForm.formData.abv = formData.abv
    createForm.formData.ibu = formData.ibu
    createForm.formData.shelfLifeDays = formData.shelfLifeDays
    
    setShowCreatePanel(true)
    toast.success("Produto duplicado para edição")
  }, [createForm])

  const openEditDialog = useCallback((product: Product) => {
    setEditingProduct(product)
    // Reset form with product data
    const formData = mapProductToForm(product)
    Object.entries(formData).forEach(([key, value]) => {
      editForm.handleFieldChange(key as keyof ProductFormState, value)
    })
    setIsEditDialogOpen(true)
  }, [editForm])

  const handleClearFilters = useCallback(() => {
    setSearchTerm("")
    setSelectedCategory("all")
    setSelectedSize("all")
    setStockFilter("all")
  }, [])

  // Hardware: Barcode Scanner para buscar produtos
  const handleBarcodeScan = useCallback((barcode: string) => {
    const product = products.find(p => p.barcode === barcode)
    
    if (product) {
      // Abrir dialog de edição com o produto encontrado
      openEditDialog(product)
      toast.success(`Produto encontrado: ${product.name}`)
    } else {
      // Abrir cadastro rápido com o código de barras pré-preenchido
      setIsQuickBarcodeCreateOpen(true)
      toast.info("Produto não encontrado. Cadastre agora!")
    }
  }, [products, openEditDialog])

  const { isScanning, scanHistory } = useBarcodeScanner({
    enabled: true,
    onScan: handleBarcodeScan,
    onError: (error) => toast.error(error),
  })

  if (isLoading) {
    return (
      <>
        <PullToRefreshIndicator
          isPulling={isPulling}
          isRefreshing={isRefreshing}
          progress={progress}
          pullDistance={pullDistance}
        />
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Carregando produtos...
        </div>
      </>
    )
  }

  const quickTags = createForm.formData.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)

  return (
    <>
      <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isRefreshing || isLoading}
        progress={progress}
        pullDistance={pullDistance}
      />
      <div className="space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Produtos</h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Gerencie e evolua seu portfólio com cadastros inteligentes
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsQuickBarcodeCreateOpen(true)}
              className="text-xs sm:text-sm border-dashed"
            >
              <Barcode className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Cadastro Rápido</span>
              <span className="sm:hidden">Barcode</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportDialogOpen(true)}
              className="text-xs sm:text-sm"
            >
              <Upload className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Importar CSV</span>
              <span className="sm:hidden">Importar</span>
            </Button>
            {showCreatePanel ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCreatePanel(false)
                  createForm.resetForm()
                }}
                className="text-xs sm:text-sm"
              >
                <X className="mr-2 h-4 w-4" />
                Fechar
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  createForm.resetForm()
                  setShowCreatePanel(true)
                }}
                className="text-xs sm:text-sm"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Novo produto
              </Button>
            )}
          </div>
        </div>

        {/* Barcode Scanner para buscar produtos */}
        <BarcodeInput
          onScan={handleBarcodeScan}
          onError={(error) => toast.error(error)}
          enabled={true}
          isScanning={isScanning}
          scanHistory={scanHistory}
          showHistory={true}
        />

        {/* Create Panel */}
        {showCreatePanel && (
          <Card className="border-dashed border-primary/40">
            <CardHeader>
              <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Estúdio de produtos
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Estruture o lançamento com etapas guiadas, visualize margens em tempo real.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <div className="space-y-6">
                  <Tabs value={createForm.activeTab} onValueChange={(v) => createForm.setActiveTab(v as any)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="basic" className="text-xs sm:text-sm">
                        Fundamentos
                      </TabsTrigger>
                      <TabsTrigger value="pricing" className="text-xs sm:text-sm">
                        Financeiro
                      </TabsTrigger>
                      <TabsTrigger value="identity" className="text-xs sm:text-sm">
                        Identidade
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="basic" className="mt-4">
                      <BasicTab
                        formData={createForm.formData}
                        onFieldChange={createForm.handleFieldChange}
                        errors={createForm.errors}
                        categorySuggestions={categories.slice(1)}
                        brandSuggestions={brandSuggestions}
                        onQuickFill={createForm.handleFieldChange}
                        showSuggestions
                      />
                    </TabsContent>
                    <TabsContent value="pricing" className="mt-4">
                      <PricingTab
                        formData={createForm.formData}
                        onFieldChange={createForm.handleFieldChange}
                        errors={createForm.errors}
                        marginPreview={createForm.marginPreview}
                      />
                    </TabsContent>
                    <TabsContent value="identity" className="mt-4">
                      <IdentityTab
                        formData={createForm.formData}
                        onFieldChange={createForm.handleFieldChange}
                        packagingSuggestions={packagingSuggestions}
                        errors={createForm.errors}
                        onQuickFill={createForm.handleFieldChange}
                      />
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Snapshot - Hidden on mobile */}
                <aside className="hidden lg:flex flex-col gap-4">
                  <div className="rounded-2xl border bg-muted/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Snapshot</p>
                    <div className="mt-3 space-y-2">
                      <p className="text-xl font-semibold">
                        {createForm.formData.name || "Nome do produto"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {createForm.formData.brand || "Marca"} • {createForm.formData.size || "Volume"}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border bg-background p-3">
                          <p className="text-xs uppercase text-muted-foreground">Preço</p>
                          <p className="text-lg font-semibold">
                            {formatCurrency(createForm.marginPreview.salePrice)}
                          </p>
                        </div>
                        <div className="rounded-lg border bg-background p-3">
                          <p className="text-xs uppercase text-muted-foreground">Margem</p>
                          <p className="text-lg font-semibold">
                            {createForm.marginPreview.marginPercent !== undefined
                              ? `${createForm.marginPreview.marginPercent.toFixed(1)}%`
                              : "--"}
                          </p>
                        </div>
                      </div>
                    </div>
                    {quickTags.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Tags</p>
                        <div className="flex flex-wrap gap-2">
                          {quickTags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1 text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </aside>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreatePanel(false)
                  createForm.resetForm()
                }}
                className="text-xs sm:text-sm"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleAddProduct} 
                disabled={createForm.isSubmitting}
                className="text-xs sm:text-sm"
              >
                {createForm.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Publicar produto
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Filters */}
        <ProductFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedSize={selectedSize}
          onSizeChange={setSelectedSize}
          categories={categories}
          sizes={sizes}
          onClearFilters={handleClearFilters}
          showStockFilter={false}
          stockFilter={stockFilter}
          onStockFilterChange={setStockFilter}
        />

        {/* View Mode Toggle & Products */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Package className="h-5 w-5" />
                Catálogo ({filteredProducts.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "card" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("card")}
                  className="text-xs sm:text-sm"
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Cards</span>
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="text-xs sm:text-sm"
                >
                  <List className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">Tabela</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Nenhum produto encontrado
                </p>
              </div>
            ) : viewMode === "card" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={openEditDialog}
                    onDelete={(p) => {
                      setProductToDelete(p)
                      setIsDeleteDialogOpen(true)
                    }}
                    onAllocateStock={(p) => {
                      setProductForAllocation(p)
                      setIsStockAllocationOpen(true)
                    }}
                  />
                ))}
              </div>
            ) : (
              <ProductTable
                products={filteredProducts}
                onEdit={openEditDialog}
                onDelete={(p) => {
                  setProductToDelete(p)
                  setIsDeleteDialogOpen(true)
                }}
                onAllocateStock={(p) => {
                  setProductForAllocation(p)
                  setIsStockAllocationOpen(true)
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar produto</DialogTitle>
            </DialogHeader>
            <Tabs value={editForm.activeTab} onValueChange={(v) => editForm.setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Fundamentos</TabsTrigger>
                <TabsTrigger value="pricing">Financeiro</TabsTrigger>
                <TabsTrigger value="identity">Identidade</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="mt-4">
                <BasicTab
                  formData={editForm.formData}
                  onFieldChange={editForm.handleFieldChange}
                  errors={editForm.errors}
                  categorySuggestions={categories.slice(1)}
                  brandSuggestions={brandSuggestions}
                />
              </TabsContent>
              <TabsContent value="pricing" className="mt-4">
                <PricingTab
                  formData={editForm.formData}
                  onFieldChange={editForm.handleFieldChange}
                  errors={editForm.errors}
                  marginPreview={editForm.marginPreview}
                />
              </TabsContent>
              <TabsContent value="identity" className="mt-4">
                <IdentityTab
                  formData={editForm.formData}
                  onFieldChange={editForm.handleFieldChange}
                  packagingSuggestions={packagingSuggestions}
                  errors={editForm.errors}
                />
              </TabsContent>
            </Tabs>
            <DialogFooter className="mt-6">
              <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditProduct} disabled={editForm.isSubmitting}>
                {editForm.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar alterações"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stock Allocation Dialog */}
        <StockAllocationDialog
          open={isStockAllocationOpen}
          onOpenChange={setIsStockAllocationOpen}
          product={productForAllocation}
          pointsOfSale={Array.isArray(pointsOfSale) ? pointsOfSale : []}
        />

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
            </DialogHeader>
            <p className="text-sm">
              Tem certeza que deseja excluir o produto "{productToDelete?.name} {productToDelete?.size}"?
              Esta ação não pode ser desfeita.
            </p>
            <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (productToDelete) {
                    handleDeleteProduct(productToDelete.id)
                    setIsDeleteDialogOpen(false)
                    setProductToDelete(null)
                  }
                }}
              >
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <ImportDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          onImportComplete={() => {
            refetch()
            setIsImportDialogOpen(false)
          }}
        />

        {/* Quick Barcode Create Dialog */}
        <QuickBarcodeCreate
          open={isQuickBarcodeCreateOpen}
          onOpenChange={setIsQuickBarcodeCreateOpen}
          onSuccess={() => {
            refetch()
          }}
        />
      </div>
      </div>
    </>
  )
}
