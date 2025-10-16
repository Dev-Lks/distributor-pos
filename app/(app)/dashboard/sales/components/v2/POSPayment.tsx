"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  Printer,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils/formatters"

interface POSPaymentProps {
  total: number
  itemCount: number
  paymentMethod: "cash" | "card" | "pix"
  onPaymentMethodChange: (method: "cash" | "card" | "pix") => void
  cashReceived: string
  onCashReceivedChange: (value: string) => void
  change: number
  isProcessing: boolean
  onFinalize: () => void
  canFinalize: boolean
  printerConnected: boolean
  onReprint: () => void
  hasLastSale: boolean
}

export function POSPayment({
  total,
  itemCount,
  paymentMethod,
  onPaymentMethodChange,
  cashReceived,
  onCashReceivedChange,
  change,
  isProcessing,
  onFinalize,
  canFinalize,
  printerConnected,
  onReprint,
  hasLastSale,
}: POSPaymentProps) {
  const quickCashValues = [20, 50, 100, 200]

  return (
    <div className="p-4 space-y-4">
      {/* Total */}
      <div className="rounded-lg bg-primary/10 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(total)}
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {itemCount} {itemCount === 1 ? "item" : "itens"}
          </Badge>
        </div>
      </div>

      {/* Payment Method */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Forma de Pagamento</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={paymentMethod === "cash" ? "default" : "outline"}
            className="flex-col gap-1 h-auto py-3"
            onClick={() => onPaymentMethodChange("cash")}
          >
            <Banknote className="h-5 w-5" />
            <span className="text-xs">Dinheiro</span>
          </Button>
          <Button
            variant={paymentMethod === "card" ? "default" : "outline"}
            className="flex-col gap-1 h-auto py-3"
            onClick={() => onPaymentMethodChange("card")}
          >
            <CreditCard className="h-5 w-5" />
            <span className="text-xs">Cartão</span>
          </Button>
          <Button
            variant={paymentMethod === "pix" ? "default" : "outline"}
            className="flex-col gap-1 h-auto py-3"
            onClick={() => onPaymentMethodChange("pix")}
          >
            <Smartphone className="h-5 w-5" />
            <span className="text-xs">PIX</span>
          </Button>
        </div>
      </div>

      {/* Cash Payment Details */}
      {paymentMethod === "cash" && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="cash-received">Valor Recebido</Label>
            <Input
              id="cash-received"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={cashReceived}
              onChange={(e) => onCashReceivedChange(e.target.value)}
              className="text-lg font-medium h-12"
            />
          </div>

          {/* Quick Values */}
          <div className="grid grid-cols-4 gap-2">
            {quickCashValues.map((value) => (
              <Button
                key={value}
                variant="outline"
                size="sm"
                onClick={() => onCashReceivedChange(value.toString())}
                className="text-xs"
              >
                R$ {value}
              </Button>
            ))}
          </div>

          {/* Change */}
          {cashReceived && parseFloat(cashReceived) > 0 && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Troco</span>
                <span
                  className={cn(
                    "text-lg font-bold",
                    change >= 0 ? "text-green-600" : "text-destructive"
                  )}
                >
                  {formatCurrency(change)}
                </span>
              </div>
              {change < 0 && (
                <p className="mt-1 text-xs text-destructive">
                  Valor insuficiente
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <Separator />

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button
          size="lg"
          className="w-full h-14 text-lg gap-2"
          onClick={onFinalize}
          disabled={!canFinalize || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" />
              Finalizar Venda (F12)
            </>
          )}
        </Button>

        {printerConnected && hasLastSale && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={onReprint}
          >
            <Printer className="h-4 w-4" />
            Reimprimir Última Venda
          </Button>
        )}
      </div>

      {/* Shortcuts Help */}
      <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium">Atalhos do Teclado:</p>
        <div className="grid grid-cols-2 gap-1">
          <div>
            <kbd className="rounded bg-background px-1.5 py-0.5 text-xs">F2</kbd>{" "}
            Scanner
          </div>
          <div>
            <kbd className="rounded bg-background px-1.5 py-0.5 text-xs">F9</kbd>{" "}
            Cliente
          </div>
          <div>
            <kbd className="rounded bg-background px-1.5 py-0.5 text-xs">F3</kbd>{" "}
            Produtos
          </div>
          <div>
            <kbd className="rounded bg-background px-1.5 py-0.5 text-xs">F12</kbd>{" "}
            Finalizar
          </div>
        </div>
      </div>
    </div>
  )
}
