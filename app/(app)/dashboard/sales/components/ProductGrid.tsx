import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Zap, Package, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/useProducts"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
})

interface ProductGridProps {
  products: Product[]
  loading?: boolean
  onAddToCart: (product: Product) => void
  selectedPointOfSaleId: string | null
  quickMode?: boolean
  onQuickModeChange?: (enabled: boolean) => void
}

/**
 * Grade de produtos do PDV com filtros e modos de visualização
 */
export function ProductGrid({
  products,
  loading = false,
  onAddToCart,
  selectedPointOfSaleId,
  quickMode = false,
  onQuickModeChange,
}: ProductGridProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSize, setSelectedSize] = useState("all")

  // Filtrar produtos disponíveis no ponto de venda selecionado
  const availableProducts = useMemo(() => {
    if (!selectedPointOfSaleId) return []

    return products.filter((product) => {
      const pointStock = product.productPointsOfSale?.find(
        (ps) => ps.pointOfSaleId === selectedPointOfSaleId
      )
      return pointStock && pointStock.quantity > 0
    })
  }, [products, selectedPointOfSaleId])

  // Aplicar filtros de busca e tamanho
  const filteredProducts = useMemo(() => {
    return availableProducts.filter((product) => {
      // Filtro de busca
      const matchesSearch =
        searchTerm === "" ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())

      // Filtro de tamanho
      const matchesSize =
        selectedSize === "all" || product.size === selectedSize

      return matchesSearch && matchesSize
    })
  }, [availableProducts, searchTerm, selectedSize])

  // Tamanhos disponíveis
  const availableSizes = useMemo(() => {
    const sizes = new Set<string>()
    availableProducts.forEach((p) => {
      if (p.size) sizes.add(p.size)
    })
    return Array.from(sizes).sort()
  }, [availableProducts])

  // Obter estoque do produto no ponto de venda selecionado
  const getProductStock = (product: Product) => {
    if (!selectedPointOfSaleId) return 0
    const pointStock = product.productPointsOfSale?.find(
      (ps) => ps.pointOfSaleId === selectedPointOfSaleId
    )
    return pointStock?.quantity ?? 0
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!selectedPointOfSaleId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <Package className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p>Selecione um ponto de venda para começar</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produtos
            <Badge variant="secondary">{filteredProducts.length}</Badge>
          </CardTitle>

          {onQuickModeChange && (
            <div className="flex items-center gap-2">
              <Switch
                id="quick-mode"
                checked={quickMode}
                onCheckedChange={onQuickModeChange}
              />
              <Label htmlFor="quick-mode" className="flex items-center gap-1 cursor-pointer">
                <Zap className="h-4 w-4" />
                <span className="text-sm">Modo Rápido</span>
              </Label>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto, SKU ou código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {availableSizes.length > 0 && (
            <Select value={selectedSize} onValueChange={setSelectedSize}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tamanho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tamanhos</SelectItem>
                {availableSizes.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-8">
            <Package className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-sm">Nenhum produto encontrado</p>
            {searchTerm && (
              <p className="text-xs mt-1">Tente ajustar os filtros de busca</p>
            )}
          </div>
        ) : (
          <div className={cn(
            "grid gap-3",
            quickMode
              ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          )}>
            {filteredProducts.map((product) => {
              const stock = getProductStock(product)
              const isLowStock = stock <= 5

              return (
                <Button
                  key={product.id}
                  variant="outline"
                  className={cn(
                    "h-auto flex-col items-start gap-2 p-3 hover:bg-accent transition-all",
                    quickMode && "p-2"
                  )}
                  onClick={() => onAddToCart(product)}
                >
                  <div className="w-full">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={cn(
                        "font-medium text-left line-clamp-2",
                        quickMode ? "text-xs" : "text-sm"
                      )}>
                        {product.name}
                      </h4>
                      {isLowStock && (
                        <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      )}
                    </div>

                    {!quickMode && product.size && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {product.size}
                      </Badge>
                    )}
                  </div>

                  <div className="w-full flex items-end justify-between gap-2">
                    <div className="text-left">
                      <div className={cn(
                        "font-bold text-primary",
                        quickMode ? "text-sm" : "text-lg"
                      )}>
                        {currencyFormatter.format(product.salePrice)}
                      </div>
                      <div className={cn(
                        "text-muted-foreground",
                        quickMode ? "text-[10px]" : "text-xs"
                      )}>
                        Estoque: {stock}
                      </div>
                    </div>

                    {product.isBonified && (
                      <Badge variant="default" className="text-[10px] px-1">
                        Bônus
                      </Badge>
                    )}
                  </div>
                </Button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
