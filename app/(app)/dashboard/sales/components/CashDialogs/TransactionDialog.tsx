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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpCircle, ArrowDownCircle, DollarSign } from "lucide-react"
import type { CashTransactionTypeLiteral } from "@/types/cash"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
})

interface TransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (type: Exclude<CashTransactionTypeLiteral, "OPENING">, amount: number, description?: string) => void
  loading?: boolean
}

/**
 * Diálogo para registrar transações de caixa (suprimento, sangria, ajuste)
 */
export function TransactionDialog({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: TransactionDialogProps) {
  const [transactionType, setTransactionType] = useState<Exclude<CashTransactionTypeLiteral, "OPENING">>("SUPPLY")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")

  const handleConfirm = () => {
    const value = parseFloat(amount) || 0
    if (value <= 0) return

    onConfirm(transactionType, value, description.trim() || undefined)
    
    // Reset
    setAmount("")
    setDescription("")
  }

  const handleCancel = () => {
    onOpenChange(false)
    setAmount("")
    setDescription("")
  }

  const value = parseFloat(amount) || 0

  const transactionTypes = [
    {
      id: "SUPPLY" as const,
      label: "Suprimento",
      description: "Adicionar dinheiro ao caixa",
      icon: ArrowUpCircle,
      color: "text-green-600",
    },
    {
      id: "WITHDRAWAL" as const,
      label: "Sangria",
      description: "Retirar dinheiro do caixa",
      icon: ArrowDownCircle,
      color: "text-red-600",
    },
    {
      id: "ADJUSTMENT" as const,
      label: "Ajuste",
      description: "Correção de valor",
      icon: DollarSign,
      color: "text-blue-600",
    },
  ]

  const selectedType = transactionTypes.find(t => t.id === transactionType)
  const Icon = selectedType?.icon || DollarSign

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${selectedType?.color}`} />
            Registrar Transação
          </DialogTitle>
          <DialogDescription>
            {selectedType?.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="transaction-type">Tipo de Transação</Label>
            <Select
              value={transactionType}
              onValueChange={(value) => setTransactionType(value as Exclude<CashTransactionTypeLiteral, "OPENING">)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {transactionTypes.map((type) => {
                  const TypeIcon = type.icon
                  return (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <TypeIcon className={`h-4 w-4 ${type.color}`} />
                        {type.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">
              Valor <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                R$
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 text-lg"
                autoFocus
              />
            </div>
            
            {value > 0 && (
              <p className="text-sm text-muted-foreground">
                {currencyFormatter.format(value)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              placeholder="Ex: Pagamento de fornecedor"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Atalhos de valor */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Valores rápidos</Label>
            <div className="grid grid-cols-4 gap-2">
              {[50, 100, 200, 500].map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(preset.toString())}
                  className="text-xs"
                >
                  R$ {preset}
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
            disabled={amount === "" || value <= 0 || loading}
          >
            {loading ? "Registrando..." : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
