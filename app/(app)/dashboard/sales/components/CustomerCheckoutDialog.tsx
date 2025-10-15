"use client"

import { useState, useCallback } from "react"
import { ResponsiveDialog } from "@/components/ResponsiveDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription } from "@/components/ui/card"
import { User, UserPlus, Search, Loader2, Phone, MapPin, FileText, Building } from "lucide-react"
import { toast } from "sonner"
import { sanitizeDocument, validateCpfCnpj, formatDocument } from "@/lib/documents"

interface Customer {
  id: string
  name: string
  document: string | null
  phone: string | null
  address: string | null
  type?: "INDIVIDUAL" | "BUSINESS"
}

interface CustomerCheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveWithCustomer: (customer: Customer) => void
  onSaveWithNewCustomer: (data: { name: string; phone: string; address: string; document?: string }) => void
  onSaveWithoutCustomer: () => void
}

/**
 * Novo diálogo de checkout que pergunta se o cliente tem cadastro
 */
export function CustomerCheckoutDialog({
  open,
  onOpenChange,
  onSaveWithCustomer,
  onSaveWithNewCustomer,
  onSaveWithoutCustomer,
}: CustomerCheckoutDialogProps) {
  const [step, setStep] = useState<"choice" | "search" | "register">("choice")
  const [hasCustomer, setHasCustomer] = useState<"yes" | "no" | null>(null)
  const [wantsToRegister, setWantsToRegister] = useState<"yes" | "no" | null>(null)
  
  // Estados para busca
  const [cpfSearch, setCpfSearch] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null)
  
  // Estados para cadastro
  const [newCustomerName, setNewCustomerName] = useState("")
  const [newCustomerPhone, setNewCustomerPhone] = useState("")
  const [newCustomerAddress, setNewCustomerAddress] = useState("")
  const [newCustomerDocument, setNewCustomerDocument] = useState("")

  // Reset states
  const resetStates = useCallback(() => {
    setStep("choice")
    setHasCustomer(null)
    setWantsToRegister(null)
    setCpfSearch("")
    setFoundCustomer(null)
    setIsSearching(false)
    setNewCustomerName("")
    setNewCustomerPhone("")
    setNewCustomerAddress("")
    setNewCustomerDocument("")
  }, [])

  // Buscar cliente por CPF/CNPJ
  const handleSearchCustomer = useCallback(async () => {
    const sanitized = sanitizeDocument(cpfSearch)
    
    if (!sanitized) {
      toast.error("Digite um CPF ou CNPJ válido")
      return
    }

    if (!validateCpfCnpj(sanitized)) {
      toast.error("CPF ou CNPJ inválido")
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/customers?search=${encodeURIComponent(sanitized)}`)
      
      if (!response.ok) {
        throw new Error("Erro ao buscar cliente")
      }

      const customers = await response.json() as Customer[]
      
      if (customers.length === 0) {
        toast.error("Cliente não encontrado", {
          description: "Cadastre um novo cliente ou finalize sem cadastro"
        })
        setFoundCustomer(null)
      } else {
        const customer = customers[0]
        setFoundCustomer(customer)
        toast.success("Cliente encontrado!")
      }
    } catch (error) {
      console.error("Erro ao buscar cliente:", error)
      toast.error("Erro ao buscar cliente")
    } finally {
      setIsSearching(false)
    }
  }, [cpfSearch])

  // Confirmar cliente encontrado
  const handleConfirmCustomer = useCallback(() => {
    if (foundCustomer) {
      onSaveWithCustomer(foundCustomer)
      resetStates()
    }
  }, [foundCustomer, onSaveWithCustomer, resetStates])

  // Salvar novo cliente
  const handleSaveNewCustomer = useCallback(() => {
    if (!newCustomerName.trim()) {
      toast.error("Nome é obrigatório")
      return
    }

    const sanitized = newCustomerDocument ? sanitizeDocument(newCustomerDocument) : undefined
    if (sanitized && !validateCpfCnpj(sanitized)) {
      toast.error("CPF ou CNPJ inválido")
      return
    }

    onSaveWithNewCustomer({
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim(),
      address: newCustomerAddress.trim(),
      document: sanitized || undefined,
    })
    resetStates()
  }, [newCustomerName, newCustomerPhone, newCustomerAddress, newCustomerDocument, onSaveWithNewCustomer, resetStates])

  // Finalizar sem cliente
  const handleSkipCustomer = useCallback(() => {
    onSaveWithoutCustomer()
    resetStates()
  }, [onSaveWithoutCustomer, resetStates])

  // Navegação entre steps
  const handleChoiceNext = useCallback(() => {
    if (hasCustomer === "yes") {
      setStep("search")
    } else if (hasCustomer === "no" && wantsToRegister === "yes") {
      setStep("register")
    } else if (hasCustomer === "no" && wantsToRegister === "no") {
      handleSkipCustomer()
    }
  }, [hasCustomer, wantsToRegister, handleSkipCustomer])

  const handleBack = useCallback(() => {
    if (step === "search" || step === "register") {
      setStep("choice")
      setFoundCustomer(null)
    }
  }, [step])

  const renderChoice = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-base font-semibold">O cliente já tem cadastro?</Label>
        <RadioGroup value={hasCustomer || ""} onValueChange={(value: string) => setHasCustomer(value as "yes" | "no")}>
          <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent" onClick={() => setHasCustomer("yes")}>
            <RadioGroupItem value="yes" id="has-customer-yes" />
            <Label htmlFor="has-customer-yes" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium">Sim, já é cadastrado</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Vou buscar pelo CPF/CNPJ</p>
            </Label>
          </div>

          <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent" onClick={() => setHasCustomer("no")}>
            <RadioGroupItem value="no" id="has-customer-no" />
            <Label htmlFor="has-customer-no" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <span className="font-medium">Não, é novo</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Vou decidir se quero cadastrar</p>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {hasCustomer === "no" && (
        <div className="space-y-4 pt-4 border-t">
          <Label className="text-base font-semibold">Deseja cadastrar o cliente?</Label>
          <RadioGroup value={wantsToRegister || ""} onValueChange={(value: string) => setWantsToRegister(value as "yes" | "no")}>
            <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent" onClick={() => setWantsToRegister("yes")}>
              <RadioGroupItem value="yes" id="wants-register-yes" />
              <Label htmlFor="wants-register-yes" className="flex-1 cursor-pointer">
                <span className="font-medium">Sim, vou cadastrar agora</span>
                <p className="text-sm text-muted-foreground mt-1">Cadastro rápido de cliente</p>
              </Label>
            </div>

            <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent" onClick={() => setWantsToRegister("no")}>
              <RadioGroupItem value="no" id="wants-register-no" />
              <Label htmlFor="wants-register-no" className="flex-1 cursor-pointer">
                <span className="font-medium">Não, finalizar sem cadastro</span>
                <p className="text-sm text-muted-foreground mt-1">Venda sem identificação de cliente</p>
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="outline"
          onClick={() => {
            resetStates()
            onOpenChange(false)
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleChoiceNext}
          disabled={!hasCustomer || (hasCustomer === "no" && !wantsToRegister)}
        >
          Continuar
        </Button>
      </div>
    </div>
  )

  const renderSearch = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label htmlFor="cpf-search" className="text-base font-semibold">
          Digite o CPF ou CNPJ do cliente
        </Label>
        <div className="flex gap-2">
          <Input
            id="cpf-search"
            placeholder="000.000.000-00 ou 00.000.000/0000-00"
            value={cpfSearch}
            onChange={(e) => setCpfSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearchCustomer()
              }
            }}
            autoFocus
          />
          <Button
            onClick={handleSearchCustomer}
            disabled={isSearching || !cpfSearch.trim()}
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {foundCustomer && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-lg">{foundCustomer.name}</p>
                  {foundCustomer.type && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {foundCustomer.type === "BUSINESS" ? "Pessoa Jurídica" : "Pessoa Física"}
                    </p>
                  )}
                </div>
              </div>
              
              {foundCustomer.document && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDocument(foundCustomer.document)}</span>
                </div>
              )}
              
              {foundCustomer.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{foundCustomer.phone}</span>
                </div>
              )}
              
              {foundCustomer.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{foundCustomer.address}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between gap-2 pt-4">
        <Button variant="outline" onClick={handleBack}>
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSkipCustomer}
          >
            Finalizar sem cliente
          </Button>
          <Button
            onClick={handleConfirmCustomer}
            disabled={!foundCustomer}
          >
            Confirmar Cliente
          </Button>
        </div>
      </div>
    </div>
  )

  const renderRegister = () => (
    <div className="space-y-6">
      <CardDescription>
        Cadastro rápido de novo cliente
      </CardDescription>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-customer-name">
            Nome <span className="text-destructive">*</span>
          </Label>
          <Input
            id="new-customer-name"
            placeholder="Nome completo"
            value={newCustomerName}
            onChange={(e) => setNewCustomerName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-customer-document">CPF/CNPJ (opcional)</Label>
          <Input
            id="new-customer-document"
            placeholder="000.000.000-00 ou 00.000.000/0000-00"
            value={newCustomerDocument}
            onChange={(e) => setNewCustomerDocument(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-customer-phone">Telefone (opcional)</Label>
          <Input
            id="new-customer-phone"
            placeholder="(00) 00000-0000"
            value={newCustomerPhone}
            onChange={(e) => setNewCustomerPhone(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-customer-address">Endereço (opcional)</Label>
          <Input
            id="new-customer-address"
            placeholder="Rua, número, bairro"
            value={newCustomerAddress}
            onChange={(e) => setNewCustomerAddress(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-between gap-2 pt-4">
        <Button variant="outline" onClick={handleBack}>
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSkipCustomer}
          >
            Finalizar sem cadastro
          </Button>
          <Button
            onClick={handleSaveNewCustomer}
            disabled={!newCustomerName.trim()}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Cadastrar e Finalizar
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetStates()
        }
        onOpenChange(isOpen)
      }}
      title={
        step === "choice"
          ? "Informações do Cliente"
          : step === "search"
          ? "Buscar Cliente"
          : "Cadastrar Novo Cliente"
      }
      description={
        step === "choice"
          ? "Antes de finalizar a venda, vamos identificar o cliente"
          : undefined
      }
    >
      {step === "choice" && renderChoice()}
      {step === "search" && renderSearch()}
      {step === "register" && renderRegister()}
    </ResponsiveDialog>
  )
}
