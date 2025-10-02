import { useState, useMemo } from "react"
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
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { Snowflake, Store, AlertTriangle, CheckCircle2, ArrowRight, Loader2 } from "lucide-react"
import type { Product } from "@/lib/useProducts"
import type { PointOfSale } from "@/lib/usePointsOfSale"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
})

interface DistributeStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  pointsOfSale: PointOfSale[]
  onSuccess: () => void
}

interface DistributionItem {
  pointOfSaleId: string
  quantity: number
}

/**
 * Diálogo para distribuir estoque da câmara fria para pontos de venda
 */
export function DistributeStockDialog({
  open,
  onOpenChange,
  product,
  pointsOfSale,
  onSuccess,
}: DistributeStockDialogProps) {
  const [distributions, setDistributions] = useState<Record<string, number>>({})
  const [isDistributing, setIsDistributing] = useState(false)

  const coldRoomStock = product?.inventory?.coldRoomQuantity ?? 0

  // Calcular totais
  const totalToDistribute = useMemo(() => {
    return Object.values(distributions).reduce((sum, qty) => sum + (qty || 0), 0)
  }, [distributions])

  const remainingStock = coldRoomStock - totalToDistribute

  const canDistribute = totalToDistribute > 0 && remainingStock >= 0

  // Resetar ao fechar
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setDistributions({})
    }
    onOpenChange(newOpen)
  }

  // Atualizar quantidade para um ponto específico
  const handleQuantityChange = (pointOfSaleId: string, value: string) => {
    const qty = parseInt(value) || 0
    setDistributions((prev) => ({
      ...prev,
      [pointOfSaleId]: qty,
    }))
  }

  // Distribuir igualmente
  const handleDistributeEvenly = () => {
    if (pointsOfSale.length === 0 || coldRoomStock === 0) return

    const qtyPerPoint = Math.floor(coldRoomStock / pointsOfSale.length)
    const newDistributions: Record<string, number> = {}

    pointsOfSale.forEach((point) => {
      newDistributions[point.id] = qtyPerPoint
    })

    setDistributions(newDistributions)
  }

  // Distribuir todo o estoque
  const handleDistributeAll = () => {
    if (pointsOfSale.length === 0 || coldRoomStock === 0) return

    // Se houver apenas um ponto, colocar tudo nele
    if (pointsOfSale.length === 1) {
      setDistributions({ [pointsOfSale[0].id]: coldRoomStock })
      return
    }

    // Distribuir igualmente
    handleDistributeEvenly()
  }

  // Confirmar distribuição
  const handleConfirm = async () => {
    if (!product || !canDistribute) return

    setIsDistributing(true)

    try {
      // Primeiro, reduzir estoque da câmara fria
      const coldRoomResponse = await fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          location: "coldRoom",
          quantity: remainingStock,
        }),
      })

      if (!coldRoomResponse.ok) {
        throw new Error("Erro ao atualizar câmara fria")
      }

      // Distribuir para cada ponto de venda
      const distributionPromises = Object.entries(distributions)
        .filter(([, qty]) => qty > 0)
        .map(async ([pointOfSaleId, quantity]) => {
          // Verificar se já existe registro para este produto e ponto
          const existingPoint = product.productPointsOfSale?.find(
            (pps) => pps.pointOfSaleId === pointOfSaleId
          )

          if (existingPoint) {
            // Atualizar quantidade existente
            const newQuantity = existingPoint.quantity + quantity
            
            const response = await fetch("/api/product-points-of-sale", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: existingPoint.id,
                quantity: newQuantity,
              }),
            })

            if (!response.ok) throw new Error(`Erro ao atualizar ${pointOfSaleId}`)
          } else {
            // Criar novo registro
            const response = await fetch("/api/product-points-of-sale", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                productId: product.id,
                pointOfSaleId,
                quantity,
                minStock: 2,
              }),
            })

            if (!response.ok) throw new Error(`Erro ao criar registro para ${pointOfSaleId}`)
          }
        })

      await Promise.all(distributionPromises)

      toast.success("Estoque distribuído com sucesso!", {
        description: `${totalToDistribute} unidades distribuídas`,
      })

      onSuccess()
      handleOpenChange(false)
    } catch (error: any) {
      console.error("Erro ao distribuir estoque:", error)
      toast.error("Erro ao distribuir estoque", {
        description: error.message || "Tente novamente",
      })
    } finally {
      setIsDistributing(false)
    }
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Distribuir Estoque para Pontos de Venda
          </DialogTitle>
          <DialogDescription>
            Transfira estoque da câmara fria para os pontos de venda ativos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do Produto */}
          <div className="p-4 rounded-lg border bg-muted/50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.size}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Preço de Venda</p>
                <p className="font-semibold">{currencyFormatter.format(product.salePrice)}</p>
              </div>
            </div>
          </div>

          {/* Status do Estoque */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border bg-sky-50 dark:bg-sky-950/20">
              <div className="flex items-center gap-2 mb-1">
                <Snowflake className="h-4 w-4 text-sky-600" />
                <span className="text-xs font-medium text-sky-900 dark:text-sky-100">
                  Câmara Fria
                </span>
              </div>
              <p className="text-2xl font-bold text-sky-600">{coldRoomStock}</p>
            </div>

            <div className="p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 mb-1">
                <ArrowRight className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-medium text-amber-900 dark:text-amber-100">
                  A Distribuir
                </span>
              </div>
              <p className="text-2xl font-bold text-amber-600">{totalToDistribute}</p>
            </div>

            <div className="p-3 rounded-lg border bg-emerald-50 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-900 dark:text-emerald-100">
                  Restante
                </span>
              </div>
              <p
                className={`text-2xl font-bold ${
                  remainingStock < 0 ? "text-red-600" : "text-emerald-600"
                }`}
              >
                {remainingStock}
              </p>
            </div>
          </div>

          {/* Alerta se exceder */}
          {remainingStock < 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-900 dark:text-red-100">
                <p className="font-medium">Quantidade excede o estoque disponível</p>
                <p className="text-red-700 dark:text-red-300">
                  Reduza a distribuição em {Math.abs(remainingStock)} unidades
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Ações Rápidas */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDistributeEvenly}
              disabled={coldRoomStock === 0 || pointsOfSale.length === 0}
            >
              Distribuir Igualmente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDistributeAll}
              disabled={coldRoomStock === 0 || pointsOfSale.length === 0}
            >
              Distribuir Tudo
            </Button>
          </div>

          {/* Lista de Pontos de Venda */}
          <div className="space-y-2">
            <Label>Pontos de Venda</Label>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {pointsOfSale.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Store className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum ponto de venda ativo</p>
                  </div>
                ) : (
                  pointsOfSale.map((point) => {
                    const currentStock =
                      product.productPointsOfSale?.find((pps) => pps.pointOfSaleId === point.id)
                        ?.quantity ?? 0
                    const distributionQty = distributions[point.id] || 0
                    const newStock = currentStock + distributionQty

                    return (
                      <div
                        key={point.id}
                        className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Store className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{point.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Estoque atual: <span className="font-medium">{currentStock}</span>
                              {distributionQty > 0 && (
                                <>
                                  {" → "}
                                  <span className="font-medium text-emerald-600">{newStock}</span>
                                </>
                              )}
                            </p>
                          </div>
                          <Badge variant="secondary">{point.isActive ? "Ativo" : "Inativo"}</Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <Label htmlFor={`qty-${point.id}`} className="text-xs whitespace-nowrap">
                            Quantidade:
                          </Label>
                          <Input
                            id={`qty-${point.id}`}
                            type="number"
                            min="0"
                            max={coldRoomStock}
                            value={distributions[point.id] || ""}
                            onChange={(e) => handleQuantityChange(point.id, e.target.value)}
                            placeholder="0"
                            className="h-9"
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isDistributing}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!canDistribute || isDistributing}>
            {isDistributing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Distribuindo...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirmar Distribuição
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
