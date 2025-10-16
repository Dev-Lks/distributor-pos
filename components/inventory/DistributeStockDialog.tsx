"use client"

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
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import {
  Snowflake,
  Store,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Package,
  TrendingUp,
  Zap,
} from "lucide-react"
import type { Product } from "@/hooks/useProducts"
import type { PointOfSale } from "@/hooks/usePointsOfSale"

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
  const distributionPercentage = coldRoomStock > 0 ? (totalToDistribute / coldRoomStock) * 100 : 0

  const canDistribute = totalToDistribute > 0 && remainingStock >= 0
  const isOverDistributed = remainingStock < 0

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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Store className="h-6 w-6 text-primary" />
            Transferir para Pontos de Venda
          </DialogTitle>
          <DialogDescription className="text-base">
            Distribua estoque da câmara fria para os pontos de venda ativos
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-5">
          {/* Informações do Produto */}
          <div className="p-4 rounded-lg border-2 bg-gradient-to-br from-muted/50 to-muted/30">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-lg">{product.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{product.size}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Preço de Venda</p>
                <p className="font-bold text-lg">{currencyFormatter.format(product.salePrice)}</p>
              </div>
            </div>
          </div>

          {/* Status do Estoque - Melhorado */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="relative overflow-hidden p-4 rounded-xl border-2 border-sky-200 dark:border-sky-800 bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-950/30 dark:to-sky-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-sky-600/10">
                    <Snowflake className="h-4 w-4 text-sky-600" />
                  </div>
                  <span className="text-xs font-semibold text-sky-900 dark:text-sky-100 uppercase tracking-wide">
                    Câmara Fria
                  </span>
                </div>
                <p className="text-3xl font-black text-sky-600">{coldRoomStock}</p>
                <p className="text-xs text-sky-600/70 mt-1">unidades disponíveis</p>
              </div>

              <div className="relative overflow-hidden p-4 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-amber-600/10">
                    <ArrowRight className="h-4 w-4 text-amber-600" />
                  </div>
                  <span className="text-xs font-semibold text-amber-900 dark:text-amber-100 uppercase tracking-wide">
                    A Distribuir
                  </span>
                </div>
                <p className="text-3xl font-black text-amber-600">{totalToDistribute}</p>
                <p className="text-xs text-amber-600/70 mt-1">
                  {distributionPercentage.toFixed(0)}% do estoque
                </p>
              </div>

              <div
                className={`relative overflow-hidden p-4 rounded-xl border-2 bg-gradient-to-br ${
                  isOverDistributed
                    ? "border-red-200 dark:border-red-800 from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20"
                    : "border-emerald-200 dark:border-emerald-800 from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isOverDistributed ? "bg-red-600/10" : "bg-emerald-600/10"
                    }`}
                  >
                    {isOverDistributed ? (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      isOverDistributed
                        ? "text-red-900 dark:text-red-100"
                        : "text-emerald-900 dark:text-emerald-100"
                    }`}
                  >
                    Restante
                  </span>
                </div>
                <p
                  className={`text-3xl font-black ${
                    isOverDistributed ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {remainingStock}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    isOverDistributed ? "text-red-600/70" : "text-emerald-600/70"
                  }`}
                >
                  {isOverDistributed ? "excedeu o limite!" : "ficará na câmara"}
                </p>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progresso da Distribuição</span>
                <span className="font-semibold">
                  {totalToDistribute} / {coldRoomStock}
                </span>
              </div>
              <Progress
                value={isOverDistributed ? 100 : distributionPercentage}
                className={`h-2 ${isOverDistributed ? "[&>div]:bg-red-500" : ""}`}
              />
            </div>
          </div>

          {/* Alerta se exceder - Melhorado */}
          {isOverDistributed && (
            <div className="flex items-start gap-3 p-4 rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100 dark:border-red-800 dark:from-red-950/30 dark:to-red-900/20">
              <div className="p-2 rounded-lg bg-red-600/10">
                <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-red-900 dark:text-red-100">
                  Quantidade excede o estoque disponível!
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Reduza a distribuição em{" "}
                  <span className="font-bold">{Math.abs(remainingStock)} unidades</span> para
                  continuar.
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Ações Rápidas - Melhoradas */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Ações Rápidas
            </Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDistributeEvenly}
                disabled={coldRoomStock === 0 || pointsOfSale.length === 0}
                className="flex-1 h-auto py-3"
              >
                <div className="flex flex-col items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-medium">Distribuir Igualmente</span>
                </div>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDistributeAll}
                disabled={coldRoomStock === 0 || pointsOfSale.length === 0}
                className="flex-1 h-auto py-3"
              >
                <div className="flex flex-col items-center gap-1">
                  <Package className="h-4 w-4" />
                  <span className="text-xs font-medium">Distribuir Tudo</span>
                </div>
              </Button>
            </div>
          </div>

          {/* Lista de Pontos de Venda - Melhorada */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              Pontos de Venda ({pointsOfSale.length})
            </Label>
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2">
                {pointsOfSale.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Store className="h-16 w-16 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">Nenhum ponto de venda ativo</p>
                    <p className="text-xs mt-1">Crie pontos de venda para distribuir estoque</p>
                  </div>
                ) : (
                  pointsOfSale.map((point) => {
                    const currentStock =
                      product.productPointsOfSale?.find((pps) => pps.pointOfSaleId === point.id)
                        ?.quantity ?? 0
                    const distributionQty = distributions[point.id] || 0
                    const newStock = currentStock + distributionQty
                    const hasDistribution = distributionQty > 0

                    return (
                      <div
                        key={point.id}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          hasDistribution
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-transparent bg-card hover:border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-primary/10">
                                <Store className="h-4 w-4 text-primary" />
                              </div>
                              <span className="font-semibold">{point.name}</span>
                              {hasDistribution && (
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs">
                              <div className="flex items-center gap-1">
                                <Package className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">Atual:</span>
                                <span className="font-semibold">{currentStock}</span>
                              </div>
                              {hasDistribution && (
                                <>
                                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                  <div className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3 text-emerald-600" />
                                    <span className="text-muted-foreground">Novo:</span>
                                    <span className="font-bold text-emerald-600">{newStock}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <Badge
                            variant={point.isActive ? "default" : "secondary"}
                            className="flex-shrink-0"
                          >
                            {point.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <Label
                              htmlFor={`qty-${point.id}`}
                              className="text-xs text-muted-foreground mb-1.5 block"
                            >
                              Quantidade a Transferir
                            </Label>
                            <Input
                              id={`qty-${point.id}`}
                              type="number"
                              min="0"
                              max={coldRoomStock}
                              value={distributions[point.id] || ""}
                              onChange={(e) => handleQuantityChange(point.id, e.target.value)}
                              placeholder="0"
                              className={`h-10 text-center font-semibold ${
                                hasDistribution ? "border-primary" : ""
                              }`}
                            />
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleQuantityChange(
                                  point.id,
                                  String((distributions[point.id] || 0) + 10)
                                )
                              }
                              disabled={coldRoomStock === 0}
                              className="h-10 px-2"
                            >
                              +10
                            </Button>
                            {distributionQty > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleQuantityChange(point.id, "0")}
                                className="h-10 px-2 text-red-600 hover:text-red-700"
                              >
                                Limpar
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
            </div>
          </div>
        </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
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
