"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Package, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  size: string
  salePrice: number
  category?: string
  brand?: string
  barcode?: string
  availableStock: number
}

interface POSProductsProps {
  products: Product[]
  searchQuery: string
  onSearchChange: (query: string) => void
  onProductClick: (product: Product) => void
  isSessionOpen: boolean
}

export function POSProducts({
  products,
  searchQuery,
  onSearchChange,
  onProductClick,
  isSessionOpen,
}: POSProductsProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)

  return (
    <div className="flex h-full flex-col">
      {/* Search */}
      <div className="border-b p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos... (nome, marca, código)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{products.length} produtos disponíveis</span>
          {!isSessionOpen && (
            <span className="text-amber-600">⚠️ Caixa fechado</span>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-2 gap-3 p-4 xl:grid-cols-3">
          {products.map((product) => {
            const outOfStock = product.availableStock <= 0
            const lowStock = product.availableStock > 0 && product.availableStock <= 5

            return (
              <Button
                key={product.id}
                variant="outline"
                className={cn(
                  "h-auto flex-col items-start gap-2 p-3 text-left transition-all hover:scale-[1.02] hover:shadow-md",
                  outOfStock && "opacity-50 hover:scale-100",
                  !isSessionOpen && "opacity-60"
                )}
                onClick={() => onProductClick(product)}
                disabled={!isSessionOpen || outOfStock}
              >
                {/* Header */}
                <div className="flex w-full items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-sm leading-tight">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {product.size}
                    </p>
                  </div>
                  {product.barcode && (
                    <Badge variant="secondary" className="h-5 shrink-0 text-xs">
                      EAN
                    </Badge>
                  )}
                </div>

                {/* Category/Brand */}
                {(product.category || product.brand) && (
                  <div className="flex w-full gap-1">
                    {product.category && (
                      <Badge variant="outline" className="h-5 text-xs">
                        {product.category}
                      </Badge>
                    )}
                    {product.brand && (
                      <Badge variant="outline" className="h-5 text-xs">
                        {product.brand}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex w-full items-end justify-between border-t pt-2">
                  <div className="text-lg font-bold text-primary">
                    {formatCurrency(product.salePrice)}
                  </div>
                  <div
                    className={cn(
                      "text-xs",
                      outOfStock && "text-destructive font-medium",
                      lowStock && "text-amber-600 font-medium",
                      !outOfStock && !lowStock && "text-muted-foreground"
                    )}
                  >
                    {outOfStock ? (
                      <span className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Sem estoque
                      </span>
                    ) : (
                      <span>
                        {lowStock && "⚠️ "}
                        {product.availableStock} un.
                      </span>
                    )}
                  </div>
                </div>
              </Button>
            )
          })}
        </div>

        {products.length === 0 && (
          <div className="flex h-64 flex-col items-center justify-center text-center p-8">
            <Package className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              Nenhum produto encontrado
            </p>
            {searchQuery && (
              <p className="mt-2 text-xs text-muted-foreground/70">
                Tente ajustar sua busca
              </p>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
