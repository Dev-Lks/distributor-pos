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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, Store, Plus, Minus, Trash2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import type { Product } from "@/hooks/useProducts"
import type { PointOfSale } from "@/hooks/usePointsOfSale"
import {
  useCreateProductPointOfSale,
  useUpdateProductPointOfSale,
  useDeleteProductPointOfSale,
} from "@/hooks/useProductPointsOfSale"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
})

interface StockAllocationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  pointsOfSale: PointOfSale[]
}

/**
 * Diálogo para gerenciar distribuição de estoque entre pontos de venda
 */
export function StockAllocationDialog({
  open,
  onOpenChange,
  product,
  pointsOfSale,
}: StockAllocationDialogProps) {
  const [selectedPointId, setSelectedPointId] = useState<string>("")
  const [quantity, setQuantity] = useState("")
  const [minStock, setMinStock] = useState("2")

  const createMutation = useCreateProductPointOfSale()
  const updateMutation = useUpdateProductPointOfSale()
  const deleteMutation = useDeleteProductPointOfSale()

  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  // Estoque disponível na câmara fria
  const coldRoomStock = product?.inventory?.coldRoomQuantity ?? 0
  
  // Total já alocado nos pontos de venda
  const allocatedStock = useMemo(() => {
    return product?.productPointsOfSale?.reduce((sum, pps) => sum + pps.quantity, 0) ?? 0
  }, [product])

  // Estoque disponível para alocar
  const availableStock = coldRoomStock - allocatedStock

  // Pontos já configurados
  const configuredPoints = useMemo(() => {
    return product?.productPointsOfSale?.map(pps => pps.pointOfSaleId) ?? []
  }, [product])

  // Pontos disponíveis para adicionar
  const availablePoints = useMemo(() => {
    return pointsOfSale.filter(
      point => point.isActive && !configuredPoints.includes(point.id)
    )
  }, [pointsOfSale, configuredPoints])

  const handleAddPoint = async () => {
    if (!product || !selectedPointId) {
      toast.error("Selecione um ponto de venda")
      return
    }

    const qty = parseInt(quantity) || 0
    if (qty <= 0) {
      toast.error("Informe uma quantidade válida")
      return
    }

    if (qty > availableStock) {
      toast.error(`Apenas ${availableStock} unidades disponíveis na câmara fria`)
      return
    }

    await createMutation.mutateAsync({
      productId: product.id,
      pointOfSaleId: selectedPointId,
      quantity: qty,
      minStock: parseInt(minStock) || 2,
    })

    // Reset
    setSelectedPointId("")
    setQuantity("")
    setMinStock("2")
  }

  const handleUpdateQuantity = async (allocationId: string, newQuantity: number, currentMinStock: number) => {
    if (newQuantity < 0) return

    await updateMutation.mutateAsync({
      id: allocationId,
      quantity: newQuantity,
      minStock: currentMinStock,
    })
  }

  const handleUpdateMinStock = async (allocationId: string, currentQuantity: number, newMinStock: number) => {
    if (newMinStock < 0) return

    await updateMutation.mutateAsync({
      id: allocationId,
      quantity: currentQuantity,
      minStock: newMinStock,
    })
  }

  const handleRemoveAllocation = async (allocationId: string) => {
    if (confirm("Remover este ponto de venda? O estoque voltará para a câmara fria.")) {
      await deleteMutation.mutateAsync(allocationId)
    }
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Distribuir Estoque
          </DialogTitle>
          <DialogDescription>
            {product.name} - {product.size}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Resumo de Estoque */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/50">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Câmara Fria</p>
              <p className="text-2xl font-bold">{coldRoomStock}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Alocado</p>
              <p className="text-2xl font-bold text-blue-600">{allocatedStock}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Disponível</p>
              <p className={`text-2xl font-bold ${availableStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {availableStock}
              </p>
            </div>
          </div>

          {availableStock < 10 && availableStock > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
              <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-900 dark:text-orange-100">
                <p className="font-medium">Estoque baixo na câmara fria</p>
                <p className="text-xs mt-1">Considere reabastecer antes de alocar mais unidades.</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Adicionar Novo Ponto */}
          {availablePoints.length > 0 && availableStock > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Ponto de Venda
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ponto de Venda</Label>
                  <Select value={selectedPointId} onValueChange={setSelectedPointId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePoints.map((point) => (
                        <SelectItem key={point.id} value={point.id}>
                          {point.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    min="1"
                    max={availableStock}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Máx: {availableStock}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estoque Mínimo</Label>
                  <Input
                    type="number"
                    min="0"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    placeholder="2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Alerta quando atingir este valor
                  </p>
                </div>
              </div>

              <Button
                onClick={handleAddPoint}
                disabled={!selectedPointId || !quantity || isLoading}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>

              <Separator />
            </div>
          )}

          {availablePoints.length === 0 && allocatedStock === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Store className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Nenhum ponto de venda disponível</p>
            </div>
          )}

          {/* Pontos Configurados */}
          {product.productPointsOfSale && product.productPointsOfSale.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Store className="h-4 w-4" />
                Pontos Configurados
              </h3>

              <div className="space-y-3">
                {product.productPointsOfSale.map((allocation) => (
                  <div
                    key={allocation.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">
                          {allocation.pointOfSale?.name || "Ponto desconhecido"}
                        </h4>
                        {allocation.quantity <= allocation.minStock && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            Estoque baixo
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleRemoveAllocation(allocation.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Quantidade</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleUpdateQuantity(
                              allocation.id,
                              allocation.quantity - 1,
                              allocation.minStock
                            )}
                            disabled={allocation.quantity <= 0 || isLoading}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            value={allocation.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0
                              handleUpdateQuantity(allocation.id, val, allocation.minStock)
                            }}
                            className="h-8 text-center"
                            disabled={isLoading}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleUpdateQuantity(
                              allocation.id,
                              allocation.quantity + 1,
                              allocation.minStock
                            )}
                            disabled={availableStock <= 0 || isLoading}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Estoque Mínimo</Label>
                        <Input
                          type="number"
                          min="0"
                          value={allocation.minStock}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0
                            handleUpdateMinStock(allocation.id, allocation.quantity, val)
                          }}
                          className="h-8"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
