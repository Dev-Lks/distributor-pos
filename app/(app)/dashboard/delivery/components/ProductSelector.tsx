"use client"

import { useState, useMemo } from "react"
import { Search, Package, Barcode } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useProducts } from "@/hooks/useProducts"
import { Loader } from "@/components/Loader"
import { formatCurrency } from "@/lib/utils/formatters"

interface ProductSelectorProps {
  onSelectProduct: (product: {
    id: string
    name: string
    salePrice: number
    stock: number
  }) => void
}

export function ProductSelector({ onSelectProduct }: ProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const { data: products, isLoading } = useProducts()

  // Calcular estoque total para cada produto
  const enrichedProducts = useMemo(() => {
    if (!products) return []

    return products.map((product) => {
      // Soma estoque de todos os pontos de venda
      const totalStock = product.productPointsOfSale?.reduce(
        (sum, pos) => sum + pos.quantity,
        0
      ) || 0

      return {
        ...product,
        totalStock,
      }
    })
  }, [products])

  // Filtrar produtos
  const filteredProducts = useMemo(() => {
    if (!enrichedProducts) return []

    const searchLower = searchTerm.toLowerCase()

    return enrichedProducts.filter((product) => {
      const matchesSearch =
        searchTerm === "" ||
        product.name.toLowerCase().includes(searchLower) ||
        product.sku?.toLowerCase().includes(searchLower) ||
        product.barcode?.toLowerCase().includes(searchLower)

      return matchesSearch && product.isActive
    })
  }, [enrichedProducts, searchTerm])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, SKU ou código de barras..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Products List */}
      <ScrollArea className="h-[500px] border rounded-lg">
        <div className="p-4 space-y-2">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                {searchTerm ? "Nenhum produto encontrado" : "Nenhum produto disponível"}
              </p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{product.name}</h4>
                  
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {product.sku && (
                      <Badge variant="outline" className="text-xs">
                        SKU: {product.sku}
                      </Badge>
                    )}
                    {product.barcode && (
                      <Badge variant="outline" className="text-xs">
                        <Barcode className="h-3 w-3 mr-1" />
                        {product.barcode}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-sm">
                    <span className="font-semibold text-primary">
                      {formatCurrency(product.salePrice)}
                    </span>
                    <Badge
                      variant={product.totalStock > 0 ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      <Package className="h-3 w-3 mr-1" />
                      Estoque: {product.totalStock}
                    </Badge>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() =>
                    onSelectProduct({
                      id: product.id,
                      name: product.name,
                      salePrice: product.salePrice,
                      stock: product.totalStock,
                    })
                  }
                  disabled={product.totalStock <= 0}
                >
                  Adicionar
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {filteredProducts.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {filteredProducts.length} {filteredProducts.length === 1 ? "produto encontrado" : "produtos encontrados"}
        </p>
      )}
    </div>
  )
}
