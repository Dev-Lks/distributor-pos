"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Search,
  Plus,
  Loader2,
  Package,
  Snowflake,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react"
import type { Product } from "@/lib/useProducts"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

interface AddStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
  preSelectedProductId?: string | null
  preSelectedProductName?: string
  onSuccess: () => void
}

/**
 * Modal melhorado para adicionar estoque à câmara fria
 */
export function AddStockDialog({
  open,
  onOpenChange,
  products,
  preSelectedProductId,
  preSelectedProductName,
  onSuccess,
}: AddStockDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProductId, setSelectedProductId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  // Sincronizar com props quando o modal abre
  useEffect(() => {
    if (open) {
      setSearchQuery(preSelectedProductName || "")
      setSelectedProductId(preSelectedProductId || "")
    }
  }, [open, preSelectedProductId, preSelectedProductName])

  // Filtrar produtos
  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
    )
  }, [products, searchQuery])

  // Produto selecionado
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  )

  // Resetar ao abrir/fechar
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSearchQuery("")
      setSelectedProductId("")
      setQuantity("")
    }
    onOpenChange(newOpen)
  }

  // Selecionar produto
  const handleSelectProduct = (product: Product) => {
    setSelectedProductId(product.id)
    setSearchQuery(product.name)
  }

  // Adicionar estoque
  const handleAddStock = async () => {
    if (!selectedProductId || !quantity) {
      toast.error("Preencha todos os campos")
      return
    }

    const qty = parseInt(quantity)
    if (isNaN(qty) || qty <= 0) {
      toast.error("Quantidade inválida")
      return
    }

    setIsAdding(true)

    try {
      const response = await fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          location: "coldRoom",
          quantity: (selectedProduct?.inventory?.coldRoomQuantity || 0) + qty,
        }),
      })

      if (!response.ok) throw new Error("Erro ao adicionar estoque")

      toast.success("Estoque adicionado com sucesso!", {
        description: `+${qty} unidades de ${selectedProduct?.name}`,
      })

      onSuccess()
      handleOpenChange(false)
    } catch (error: any) {
      console.error("Erro ao adicionar estoque:", error)
      toast.error("Erro ao adicionar estoque", {
        description: error.message || "Tente novamente",
      })
    } finally {
      setIsAdding(false)
    }
  }

  const canAdd = selectedProductId && quantity && parseInt(quantity) > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Estoque à Câmara Fria
          </DialogTitle>
          <DialogDescription>
            Dê entrada de novos produtos na câmara fria para depois distribuir aos PDVs
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
          {/* Busca de Produto */}
          <div className="space-y-2">
            <Label htmlFor="product-search">Produto</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="product-search"
                placeholder="Buscar por nome, código de barras ou categoria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Lista de Produtos */}
          <div className="space-y-2">
            <div className="h-[280px] rounded-md border overflow-y-auto">
              <div className="p-2">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium">Nenhum produto encontrado</p>
                    <p className="text-xs mt-1">Tente buscar por outro termo</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredProducts.map((product) => {
                      const isSelected = selectedProductId === product.id
                      const coldRoomStock = product.inventory?.coldRoomQuantity || 0
                      const totalStock = product.inventory?.totalQuantity || 0

                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleSelectProduct(product)}
                          className={cn(
                            "w-full p-3 text-left rounded-lg border transition-all",
                            isSelected
                              ? "bg-primary/10 border-primary ring-2 ring-primary/20"
                              : "hover:bg-muted/50 border-transparent"
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium truncate">{product.name}</h4>
                                {isSelected && (
                                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {product.size}
                                </span>
                                {product.category && (
                                  <Badge variant="secondary" className="text-xs">
                                    {product.category}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-xs">
                                <div className="flex items-center gap-1 text-sky-600">
                                  <Snowflake className="h-3 w-3" />
                                  <span className="font-medium">{coldRoomStock}</span>
                                  <span className="text-muted-foreground">câmara</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Package className="h-3 w-3 text-muted-foreground" />
                                  <span className="font-medium">{totalStock}</span>
                                  <span className="text-muted-foreground">total</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-semibold">
                                {currencyFormatter.format(product.salePrice)}
                              </p>
                              <p className="text-xs text-muted-foreground">por unidade</p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Produto Selecionado + Quantidade */}
          {selectedProduct && (
            <>
              <Separator />

              <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{selectedProduct.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedProduct.size}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Estoque Atual (Câmara)</p>
                    <p className="text-2xl font-bold text-sky-600">
                      {selectedProduct.inventory?.coldRoomQuantity || 0}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade a Adicionar</Label>
                  <div className="flex gap-2">
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Digite a quantidade..."
                      className="text-lg"
                      autoFocus
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity("10")}
                      disabled={isAdding}
                    >
                      +10
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity("50")}
                      disabled={isAdding}
                    >
                      +50
                    </Button>
                  </div>
                </div>

                {/* Preview do Novo Estoque */}
                {quantity && parseInt(quantity) > 0 && (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-medium">Novo estoque será:</span>
                      </div>
                      <span className="text-xl font-bold text-emerald-600">
                        {(selectedProduct.inventory?.coldRoomQuantity || 0) + parseInt(quantity)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Dica */}
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <p>
                    O estoque será adicionado à <strong>câmara fria</strong>. Use "Transferir para
                    PDVs" para distribuir aos pontos de venda.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isAdding}>
            Cancelar
          </Button>
          <Button onClick={handleAddStock} disabled={!canAdd || isAdding}>
            {isAdding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adicionando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Estoque
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
