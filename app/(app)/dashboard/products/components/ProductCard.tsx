"use client"

import { memo, useMemo, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Store } from "lucide-react"
import { formatCurrency } from "@/lib/utils/formatters"
import type { Product } from "@/hooks/useProducts"

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onAllocateStock: (product: Product) => void
  showStock?: boolean
  showMargin?: boolean
}

// Memo evita re-render se props não mudaram
export const ProductCard = memo(function ProductCard({
  product,
  onEdit,
  onDelete,
  onAllocateStock,
  showStock = true,
  showMargin = true,
}: ProductCardProps) {
  const tags = Array.isArray(product.tags) ? product.tags : []
  
  // useMemo para cálculos pesados
  const { margin, marginPercent, formattedPrice } = useMemo(() => {
    const margin = product.salePrice - product.cost
    const marginPercent = product.cost > 0 ? (margin / product.cost) * 100 : undefined
    const formattedPrice = formatCurrency(product.salePrice)
    
    return { margin, marginPercent, formattedPrice }
  }, [product.salePrice, product.cost])

  // useCallback para callbacks (evita quebrar memo do parent)
  const handleEdit = useCallback(() => onEdit(product), [onEdit, product])
  const handleDelete = useCallback(() => onDelete(product), [onDelete, product])
  const handleAllocate = useCallback(() => onAllocateStock(product), [onAllocateStock, product])

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-lg leading-tight">{product.name}</h3>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {product.brand && <span>{product.brand}</span>}
                {product.brand && <span>•</span>}
                <Badge variant="outline" className="text-xs">
                  {product.size}
                </Badge>
              </div>
            </div>
            
            {/* Ações - visíveis no hover em desktop, sempre visíveis em mobile */}
            <div className="flex gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAllocate}
                title="Distribuir estoque"
                className="h-8 w-8 p-0"
              >
                <Store className="h-4 w-4 text-blue-500" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                title="Editar"
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                title="Excluir"
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>

          {/* Category & SKU */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {product.category || "Sem categoria"}
            </Badge>
            {product.sku && (
              <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
                {product.sku}
              </code>
            )}
            {product.bonifications > 0 && (
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                {product.bonifications} bonif.
              </Badge>
            )}
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
            <div>
              <p className="text-xs text-muted-foreground">Preço</p>
              <p className="text-lg font-bold">{formattedPrice}</p>
            </div>
            {showMargin && (
              <div>
                <p className="text-xs text-muted-foreground">Margem</p>
                <p className="text-lg font-bold">
                  {marginPercent !== undefined ? `${marginPercent.toFixed(1)}%` : "--"}
                </p>
                {margin !== undefined && (
                  <p className="text-xs text-muted-foreground">{formatCurrency(margin)}</p>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 4).map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {tags.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{tags.length - 4}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
