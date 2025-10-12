"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
  Tag,
  FileText,
} from "lucide-react"
import type { DeliveryCartItem } from "../hooks/useDeliveryCart"

interface DeliveryCartProps {
  cart: DeliveryCartItem[]
  onUpdateQuantity: (productId: string, quantity: number) => void
  onUpdateDiscount?: (productId: string, discount: number) => void
  onUpdateNotes?: (productId: string, notes: string) => void
  onRemoveItem: (productId: string) => void
  onClearCart: () => void
  subtotal: number
  totalDiscount: number
  deliveryFee?: number
  total: number
}

export function DeliveryCart({
  cart,
  onUpdateQuantity,
  onUpdateDiscount,
  onUpdateNotes,
  onRemoveItem,
  onClearCart,
  subtotal,
  totalDiscount,
  deliveryFee = 0,
  total,
}: DeliveryCartProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)

  if (cart.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/20">
        <ShoppingCart className="h-16 w-16 text-muted-foreground/50" />
        <p className="mt-4 text-lg font-medium text-muted-foreground">
          Carrinho vazio
        </p>
        <p className="mt-2 text-sm text-muted-foreground/70">
          Adicione produtos para começar a montar o pedido
        </p>
        <div className="mt-6 flex flex-col gap-2 text-xs text-muted-foreground/60">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>Busque produtos pelo nome ou código</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col border rounded-lg bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          <h3 className="font-semibold">
            Carrinho ({cart.length} {cart.length === 1 ? "item" : "itens"})
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {cart.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearCart}
              className="text-destructive hover:text-destructive"
            >
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {cart.map((item) => (
            <div
              key={item.productId}
              className="space-y-2 rounded-lg border border-border/50 bg-muted/5 p-3 transition-colors hover:bg-muted/10"
            >
              {/* Item Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{item.name}</h4>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    <Package className="h-3 w-3 mr-1" />
                    Estoque: {item.stock}
                  </Badge>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveItem(item.productId)}
                  className="h-6 text-destructive hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              {/* Price and Quantity */}
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Preço: </span>
                  <span className="font-semibold">{formatCurrency(item.price)}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <div className="flex h-8 w-12 items-center justify-center rounded-md border bg-background text-sm font-medium">
                    {item.quantity}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Subtotal */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-bold text-primary">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>

              {/* Discount Input (Optional) */}
              {onUpdateDiscount && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Desconto"
                    value={item.discount || ""}
                    onChange={(e) =>
                      onUpdateDiscount(item.productId, parseFloat(e.target.value) || 0)
                    }
                    className="h-8 text-sm"
                    step="0.01"
                    min="0"
                  />
                </div>
              )}

              {/* Notes Input (Optional) */}
              {onUpdateNotes && (
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-2" />
                  <Input
                    placeholder="Observações do item"
                    value={item.notes || ""}
                    onChange={(e) => onUpdateNotes(item.productId, e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              )}

              {item.quantity >= item.stock && (
                <p className="text-xs text-amber-600">
                  ⚠️ Estoque máximo atingido
                </p>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer - Totals */}
      <div className="border-t border-border p-4 space-y-2 bg-muted/10">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal:</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>

        {totalDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Desconto:</span>
            <span className="font-medium text-green-600">
              -{formatCurrency(totalDiscount)}
            </span>
          </div>
        )}

        {deliveryFee > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Taxa de entrega:</span>
            <span className="font-medium">{formatCurrency(deliveryFee)}</span>
          </div>
        )}

        <Separator />

        <div className="flex justify-between items-center pt-2">
          <span className="text-lg font-bold">Total:</span>
          <span className="text-2xl font-bold text-primary">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  )
}
