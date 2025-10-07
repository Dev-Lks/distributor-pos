import { useState } from "react"
import { ResponsiveDialog } from "@/components/ResponsiveDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { UserPlus, UserX } from "lucide-react"

interface CustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: { name: string; phone: string; address: string }) => void
  onSkip: () => void
  promptEnabled: boolean
  onPromptEnabledChange: (enabled: boolean) => void
}

/**
 * Diálogo para cadastro opcional de cliente durante a venda
 */
export function CustomerDialog({
  open,
  onOpenChange,
  onSave,
  onSkip,
  promptEnabled,
  onPromptEnabledChange,
}: CustomerDialogProps) {
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")

  const handleSave = () => {
    if (!customerName.trim()) {
      return
    }

    onSave({
      name: customerName.trim(),
      phone: customerPhone.trim(),
      address: customerAddress.trim(),
    })

    // Reset
    setCustomerName("")
    setCustomerPhone("")
    setCustomerAddress("")
  }

  const handleSkip = () => {
    onSkip()
    // Reset
    setCustomerName("")
    setCustomerPhone("")
    setCustomerAddress("")
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cadastrar Cliente"
      description="Deseja registrar os dados do cliente para esta venda?"
      footer={
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="flex items-center gap-2"
          >
            <UserX className="h-4 w-4" />
            Pular
          </Button>
          <Button
            onClick={handleSave}
            disabled={!customerName.trim()}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Salvar e Continuar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customer-name">
            Nome <span className="text-destructive">*</span>
          </Label>
          <Input
            id="customer-name"
            placeholder="Nome do cliente"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer-phone">Telefone</Label>
          <Input
            id="customer-phone"
            placeholder="(00) 00000-0000"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer-address">Endereço</Label>
          <Input
            id="customer-address"
            placeholder="Rua, número, bairro"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Switch
              id="prompt-enabled"
              checked={promptEnabled}
              onCheckedChange={onPromptEnabledChange}
            />
            <Label htmlFor="prompt-enabled" className="text-sm cursor-pointer">
              Sempre perguntar
            </Label>
          </div>
        </div>
      </div>
    </ResponsiveDialog>
  )
}

