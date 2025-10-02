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
import { DoorClosed, AlertTriangle, CheckCircle2 } from "lucide-react"
import type { CashSessionSnapshot } from "@/types/cash"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
})

interface CloseSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (closingAmount: number, notes?: string) => void
  session: CashSessionSnapshot | null
  loading?: boolean
}

/**
 * Diálogo para fechamento de sessão de caixa
 */
export function CloseSessionDialog({
  open,
  onOpenChange,
  onConfirm,
  session,
  loading = false,
}: CloseSessionDialogProps) {
  const [closingAmount, setClosingAmount] = useState("")
  const [notes, setNotes] = useState("")

  const expectedAmount = session?.expectedClosingAmount ?? 0
  const countedAmount = parseFloat(closingAmount) || 0
  const difference = countedAmount - expectedAmount

  const hasDifference = Math.abs(difference) > 0.01
  const isShort = difference < 0
  const isOver = difference > 0

  const handleConfirm = () => {
    if (closingAmount === "" || countedAmount < 0) return

    onConfirm(countedAmount, notes.trim() || undefined)
    
    // Reset
    setClosingAmount("")
    setNotes("")
  }

  const handleCancel = () => {
    onOpenChange(false)
    setClosingAmount("")
    setNotes("")
  }

  // Quick fill with expected amount
  const handleUseExpected = () => {
    setClosingAmount(expectedAmount.toFixed(2))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DoorClosed className="h-5 w-5" />
            Fechar Caixa
          </DialogTitle>
          <DialogDescription>
            Conte o dinheiro no caixa e informe o valor total
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Resumo da Sessão */}
          {session && (
            <div className="space-y-3 p-4 rounded-lg bg-muted/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Abertura</span>
                <span className="font-medium">
                  {currencyFormatter.format(session.openingAmount)}
                </span>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vendas (Dinheiro)</span>
                  <span>{currencyFormatter.format(session.totals.cashPayments)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Suprimentos</span>
                  <span className="text-green-600">
                    +{currencyFormatter.format(session.totals.supplies)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sangrias</span>
                  <span className="text-red-600">
                    -{currencyFormatter.format(session.totals.withdrawals)}
                  </span>
                </div>
                {session.totals.adjustments !== 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ajustes</span>
                    <span className={session.totals.adjustments > 0 ? "text-green-600" : "text-red-600"}>
                      {session.totals.adjustments > 0 ? "+" : ""}
                      {currencyFormatter.format(session.totals.adjustments)}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="font-medium">Esperado no Caixa</span>
                <span className="text-lg font-bold">
                  {currencyFormatter.format(expectedAmount)}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleUseExpected}
                className="w-full text-xs"
              >
                Usar valor esperado
              </Button>
            </div>
          )}

          {/* Valor Contado */}
          <div className="space-y-2">
            <Label htmlFor="closing-amount">
              Valor Contado <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                R$
              </span>
              <Input
                id="closing-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={closingAmount}
                onChange={(e) => setClosingAmount(e.target.value)}
                className="pl-10 text-lg"
                autoFocus
              />
            </div>
            
            {countedAmount > 0 && (
              <p className="text-sm text-muted-foreground">
                {currencyFormatter.format(countedAmount)}
              </p>
            )}
          </div>

          {/* Diferença */}
          {hasDifference && closingAmount !== "" && (
            <div className={`p-4 rounded-lg border ${
              isShort 
                ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                : "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800"
            }`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${
                  isShort ? "text-red-600" : "text-orange-600"
                }`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {isShort ? "Falta no Caixa" : "Sobra no Caixa"}
                    </span>
                    <Badge variant={isShort ? "destructive" : "default"}>
                      {isShort ? "" : "+"}{currencyFormatter.format(difference)}
                    </Badge>
                  </div>
                  <p className="text-xs mt-1 text-muted-foreground">
                    {isShort 
                      ? "O caixa está com menos dinheiro do que o esperado"
                      : "O caixa está com mais dinheiro do que o esperado"
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {!hasDifference && closingAmount !== "" && countedAmount > 0 && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-900 dark:text-green-100">
                  Caixa confere! Valores batem perfeitamente.
                </span>
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Observações {hasDifference && <span className="text-orange-600">(recomendado)</span>}
            </Label>
            <Input
              id="notes"
              placeholder="Ex: Motivo da diferença, observações gerais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={closingAmount === "" || countedAmount < 0 || loading}
            variant={hasDifference ? "destructive" : "default"}
          >
            {loading ? "Fechando..." : hasDifference ? "Fechar com Diferença" : "Fechar Caixa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
