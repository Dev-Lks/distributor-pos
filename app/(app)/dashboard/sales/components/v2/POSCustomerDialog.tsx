"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, X } from "lucide-react"
import { toast } from "sonner"

interface Customer {
  id?: string
  name: string
  document?: string
  phone?: string
}

interface POSCustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
  onCustomerSet: (customer: Customer | null) => void
}

export function POSCustomerDialog({
  open,
  onOpenChange,
  customer,
  onCustomerSet,
}: POSCustomerDialogProps) {
  const [name, setName] = useState(customer?.name || "")
  const [document, setDocument] = useState(customer?.document || "")
  const [phone, setPhone] = useState(customer?.phone || "")

  function handleSave() {
    if (!name.trim()) {
      toast.error("Informe o nome do cliente")
      return
    }

    onCustomerSet({
      name: name.trim(),
      document: document.trim() || undefined,
      phone: phone.trim() || undefined,
    })

    toast.success(`Cliente adicionado: ${name}`)
    onOpenChange(false)
  }

  function handleRemove() {
    onCustomerSet(null)
    setName("")
    setDocument("")
    setPhone("")
    toast.info("Cliente removido")
    onOpenChange(false)
  }

  function handleClose() {
    // Reset if not saved
    if (!customer) {
      setName("")
      setDocument("")
      setPhone("")
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {customer ? "Editar Cliente" : "Adicionar Cliente"}
          </DialogTitle>
          <DialogDescription>
            Informações do cliente para esta venda (opcional)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="customer-name">Nome *</Label>
            <Input
              id="customer-name"
              placeholder="Nome do cliente"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-document">CPF/CNPJ</Label>
            <Input
              id="customer-document"
              placeholder="000.000.000-00"
              value={document}
              onChange={(e) => setDocument(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-phone">Telefone</Label>
            <Input
              id="customer-phone"
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {customer && (
            <Button
              variant="ghost"
              onClick={handleRemove}
              className="w-full text-destructive hover:text-destructive sm:w-auto"
            >
              <X className="mr-2 h-4 w-4" />
              Remover Cliente
            </Button>
          )}
          <div className="flex w-full gap-2 sm:w-auto sm:ml-auto">
            <Button variant="outline" onClick={handleClose} className="flex-1 sm:flex-initial">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex-1 sm:flex-initial">
              {customer ? "Atualizar" : "Adicionar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
