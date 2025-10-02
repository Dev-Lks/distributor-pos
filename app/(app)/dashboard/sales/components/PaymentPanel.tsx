import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreditCard, DollarSign, Receipt, Banknote } from "lucide-react"
import { cn } from "@/lib/utils"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
})

interface PaymentPanelProps {
  total: number
  paymentMethod: "cash" | "card" | "pix"
  onPaymentMethodChange: (method: "cash" | "card" | "pix") => void
  onFinalizeSale: () => void
  disabled?: boolean
  loading?: boolean
}

/**
 * Painel de pagamento do PDV
 * Permite selecionar método de pagamento, calcular troco e finalizar venda
 */
export function PaymentPanel({
  total,
  paymentMethod,
  onPaymentMethodChange,
  onFinalizeSale,
  disabled = false,
  loading = false,
}: PaymentPanelProps) {
  const [receivedAmount, setReceivedAmount] = useState("")
  const [showChange, setShowChange] = useState(false)

  const change = receivedAmount
    ? parseFloat(receivedAmount) - total
    : 0

  // Reset received amount when payment method changes or total changes
  useEffect(() => {
    if (paymentMethod !== "cash") {
      setReceivedAmount("")
      setShowChange(false)
    }
  }, [paymentMethod])

  // Auto-calculate change when amount is entered
  useEffect(() => {
    if (paymentMethod === "cash" && receivedAmount) {
      const amount = parseFloat(receivedAmount)
      if (amount >= total) {
        setShowChange(true)
      } else {
        setShowChange(false)
      }
    }
  }, [receivedAmount, total, paymentMethod])

  const handleFinalize = () => {
    if (paymentMethod === "cash" && receivedAmount) {
      const amount = parseFloat(receivedAmount)
      if (amount < total) {
        return // Não permitir finalizar se valor recebido é menor
      }
    }
    onFinalizeSale()
  }

  const paymentMethods = [
    {
      id: "cash" as const,
      label: "Dinheiro",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      id: "card" as const,
      label: "Cartão",
      icon: CreditCard,
      color: "text-blue-600",
    },
    {
      id: "pix" as const,
      label: "PIX",
      icon: Banknote,
      color: "text-purple-600",
    },
  ]

  const isValid = () => {
    if (disabled || total <= 0) return false
    if (paymentMethod === "cash" && receivedAmount) {
      const amount = parseFloat(receivedAmount)
      return amount >= total
    }
    return true
  }

  return (
    <Card>
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Receipt className="h-5 w-5" />
          Pagamento
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Método de Pagamento */}
        <div className="space-y-2">
          <Label>Método de Pagamento</Label>
          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.map((method) => {
              const Icon = method.icon
              const isSelected = paymentMethod === method.id

              return (
                <Button
                  key={method.id}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "flex-col gap-1 h-auto py-3",
                    !isSelected && "hover:border-primary"
                  )}
                  onClick={() => onPaymentMethodChange(method.id)}
                >
                  <Icon className={cn("h-5 w-5", isSelected ? "text-primary-foreground" : method.color)} />
                  <span className="text-xs font-medium">{method.label}</span>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Valor Recebido (apenas para dinheiro) */}
        {paymentMethod === "cash" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="received">Valor Recebido</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="received"
                  type="number"
                  step="0.01"
                  min={total}
                  placeholder="0,00"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="pl-10 text-lg"
                  autoFocus
                />
              </div>

              {/* Atalhos de valor */}
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 150, 200].map((value) => (
                  <Button
                    key={value}
                    variant="outline"
                    size="sm"
                    onClick={() => setReceivedAmount(value.toString())}
                    className="text-xs"
                  >
                    R$ {value}
                  </Button>
                ))}
              </div>
            </div>

            {/* Troco */}
            {showChange && change >= 0 && (
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">
                    Troco
                  </span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {currencyFormatter.format(change)}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        <Separator />

        {/* Total e Finalizar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total a Pagar</span>
            <span className="text-3xl font-bold text-primary">
              {currencyFormatter.format(total)}
            </span>
          </div>

          <Button
            size="lg"
            className="w-full text-lg"
            onClick={handleFinalize}
            disabled={!isValid() || loading}
          >
            {loading ? (
              <>Processando...</>
            ) : (
              <>
                <Receipt className="h-5 w-5 mr-2" />
                Finalizar Venda
              </>
            )}
          </Button>

          {paymentMethod === "cash" && !receivedAmount && (
            <p className="text-xs text-center text-muted-foreground">
              Informe o valor recebido ou pressione Enter para valor exato
            </p>
          )}
        </div>

        {/* Atalho do teclado */}
        <div className="text-xs text-center text-muted-foreground">
          <kbd className="px-2 py-1 bg-muted rounded">Ctrl + Enter</kbd> para finalizar
        </div>
      </CardContent>
    </Card>
  )
}
