"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Store } from "lucide-react"
import { formatCurrency } from "@/lib/utils/formatters"
import type { Product } from "@/hooks/useProducts"

interface ProductTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onAllocateStock: (product: Product) => void
}

export function ProductTable({ products, onEdit, onDelete, onAllocateStock }: ProductTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Marca</TableHead>
            <TableHead>Tamanho</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Custo</TableHead>
            <TableHead>Preço venda</TableHead>
            <TableHead>Bonificações</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product: Product) => {
            const tags = Array.isArray(product.tags) ? product.tags : []
            const margin = product.salePrice - product.cost
            const marginPercent = product.cost > 0 ? (margin / product.cost) * 100 : undefined

            return (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.brand || <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell>
                  <Badge variant="outline">{product.size}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{product.category || "Sem categoria"}</Badge>
                </TableCell>
                <TableCell>{formatCurrency(product.cost)}</TableCell>
                <TableCell>
                  <div className="font-semibold">{formatCurrency(product.salePrice)}</div>
                  {marginPercent !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      Margem {formatCurrency(margin)} • {marginPercent.toFixed(1)}%
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  {product.bonifications > 0 ? (
                    <Badge className="bg-blue-100 text-blue-800">{product.bonifications}</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-sm">{product.sku || "-"}</TableCell>
                <TableCell>
                  {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {tags.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sem tags</span>
                  )}
                </TableCell>
                <TableCell className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAllocateStock(product)}
                    title="Distribuir estoque"
                  >
                    <Store className="h-4 w-4 text-blue-500" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(product)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(product)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
