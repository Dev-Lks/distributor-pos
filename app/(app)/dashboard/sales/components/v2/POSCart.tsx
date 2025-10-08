"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  User,
  Scan,
  Package,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CartItem {
  id: string
  name: string
  size: string
  salePrice: number
  quantity: number
  stock: number
  addedVia: "manual" | "barcode"
}

interface POSCartProps {
  cart: CartItem[]
  onUpdateQuantity: (id: string, delta: number) => void
  onRemoveItem: (id: string) => void
  onClearCart: () => void
  customer: any
  onCustomerClick: () => void
}

export function POSCart({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  customer,
  onCustomerClick,
}: POSCartProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)

  if (cart.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <ShoppingCart className="h-16 w-16 text-muted-foreground/50" />
        <p className="mt-4 text-lg font-medium text-muted-foreground">
          Carrinho vazio
        </p>
        <p className="mt-2 text-sm text-muted-foreground/70">
          Escaneie produtos ou selecione manualmente
        </p>
        <div className="mt-6 flex flex-col gap-2 text-xs text-muted-foreground/60">
          <div className="flex items-center gap-2">
            <kbd className="rounded bg-muted px-2 py-1">F2</kbd>
            <span>Focar no scanner</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="rounded bg-muted px-2 py-1">F3</kbd>
            <span>Mostrar/ocultar produtos</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          <h3 className="font-semibold">
            Carrinho ({cart.length} {cart.length === 1 ? "item" : "itens"})
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCustomerClick}
            className="gap-2"
          >
            <User className="h-4 w-4" />
            {customer ? customer.name : "Adicionar cliente"}
          </Button>
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
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/50"
            >
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.size}</p>
                  </div>
                  <Badge
                    variant={item.addedVia === "barcode" ? "default" : "secondary"}
                    className="shrink-0 h-5 text-xs"
                  >
                    {item.addedVia === "barcode" ? (
                      <>
                        <Scan className="h-3 w-3 mr-1" />
                        Scanner
                      </>
                    ) : (
                      <>
                        <Package className="h-3 w-3 mr-1" />
                        Manual
                      </>
                    )}
                  </Badge>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {formatCurrency(item.salePrice)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    × {item.quantity}
                  </span>
                  <span className="text-sm font-bold text-primary">
                    = {formatCurrency(item.salePrice * item.quantity)}
                  </span>
                </div>

                {item.quantity >= item.stock && (
                  <p className="mt-1 text-xs text-amber-600">
                    ⚠️ Estoque máximo atingido
                  </p>
                )}
              </div>

              {/* Quantity Controls */}
              <div className="flex shrink-0 flex-col gap-1">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onUpdateQuantity(item.id, -1)}
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
                    onClick={() => onUpdateQuantity(item.id, 1)}
                    disabled={item.quantity >= item.stock}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveItem(item.id)}
                  className="h-6 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
