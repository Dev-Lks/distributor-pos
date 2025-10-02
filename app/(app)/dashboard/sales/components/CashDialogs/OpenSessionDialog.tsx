import { useState } from "react"
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
import { PiggyBank } from "lucide-react"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
})

interface OpenSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (amount: number, notes?: string) => void
  loading?: boolean
}

/**
 * Diálogo para abertura de sessão de caixa
 */
export function OpenSessionDialog({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: OpenSessionDialogProps) {
  const [openingAmount, setOpeningAmount] = useState("")
  const [notes, setNotes] = useState("")

  const handleConfirm = () => {
    const amount = parseFloat(openingAmount) || 0
    if (amount < 0) return

    onConfirm(amount, notes.trim() || undefined)
    
    // Reset
    setOpeningAmount("")
    setNotes("")
  }

  const handleCancel = () => {
    onOpenChange(false)
    setOpeningAmount("")
    setNotes("")
  }

  const amount = parseFloat(openingAmount) || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            Abrir Caixa
          </DialogTitle>
          <DialogDescription>
            Informe o valor inicial do caixa para começar o turno
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="opening-amount">
              Valor Inicial <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                R$
              </span>
              <Input
                id="opening-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(e.target.value)}
                className="pl-10 text-lg"
                autoFocus
              />
            </div>
            
            {amount > 0 && (
              <p className="text-sm text-muted-foreground">
                {currencyFormatter.format(amount)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Input
              id="notes"
              placeholder="Ex: Troco inicial do cofre"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Atalhos de valor */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Valores rápidos</Label>
            <div className="grid grid-cols-4 gap-2">
              {[0, 50, 100, 200].map((value) => (
                <Button
                  key={value}
                  variant="outline"
                  size="sm"
                  onClick={() => setOpeningAmount(value.toString())}
                  className="text-xs"
                >
                  {value === 0 ? "Sem troco" : `R$ ${value}`}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={openingAmount === "" || amount < 0 || loading}
          >
            {loading ? "Abrindo..." : "Abrir Caixa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
