import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Plus, Minus, X } from "lucide-react"
import type { CartItem } from "../hooks/useCart"
import { formatCurrency } from "@/lib/utils/formatters"

interface CartSectionProps {
  cart: CartItem[]
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
  onClear: () => void
  total: number
  itemCount: number
}

/**
 * Componente de carrinho de compras do PDV
 * Exibe itens, permite ajustar quantidades e mostra totais
 */
export function CartSection({
  cart,
  onUpdateQuantity,
  onRemove,
  onClear,
  total,
  itemCount,
}: CartSectionProps) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrinho
            {itemCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {itemCount} {itemCount === 1 ? "item" : "itens"}
              </Badge>
            )}
          </CardTitle>
          {cart.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-muted-foreground hover:text-destructive"
            >
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Lista de itens - com scroll */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-8">
              <ShoppingCart className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-sm">Carrinho vazio</p>
              <p className="text-xs mt-1">Adicione produtos para começar</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.productId}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{item.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(item.price)}
                    </span>
                    {item.quantity > 1 && (
                      <>
                        <span className="text-xs text-muted-foreground">×</span>
                        <span className="text-sm font-medium">
                          {item.quantity}
                        </span>
                      </>
                    )}
                  </div>
                  {item.stock <= 5 && (
                    <Badge variant="outline" className="text-xs mt-1">
                      Estoque: {item.stock}
                    </Badge>
                  )}
                </div>

                {/* Controles de quantidade */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="min-h-[36px] min-w-[36px] active:scale-90"
                      onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      max={item.stock}
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1
                        onUpdateQuantity(item.productId, val)
                      }}
                      className="h-7 w-12 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="min-h-[36px] min-w-[36px] active:scale-90"
                      onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => onRemove(item.productId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totais */}
        {cart.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-sm">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-bold">Total</span>
                <span className="text-3xl font-bold text-primary">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
