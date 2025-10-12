"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateCustomer } from "@/lib/useCustomers"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface CustomerFormData {
  name: string
  phone: string
  document?: string
  address?: string
  addressNumber?: string
  addressComplement?: string
  district?: string
  city?: string
  state?: string
  postalCode?: string
}

interface CreateCustomerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (customer: any) => void
  initialData?: Partial<CustomerFormData>
}

export function CreateCustomerModal({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: CreateCustomerModalProps) {
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const createCustomer = useCreateCustomer()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CustomerFormData>({
    defaultValues: initialData,
  })

  const postalCode = watch("postalCode")

  // Buscar endereço pelo CEP
  const handleCepBlur = async () => {
    if (!postalCode || postalCode.length < 8) return

    const cep = postalCode.replace(/\D/g, "")
    if (cep.length !== 8) return

    setIsLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      
      if (!response.ok) {
        throw new Error("Erro ao buscar CEP")
      }
      
      const data = await response.json()

      if (data.erro) {
        toast.error("CEP não encontrado")
        setIsLoadingCep(false)
        return
      }

      // Contador de campos preenchidos
      let preenchidos = 0

      // Preencher campos (alguns CEPs podem não ter logradouro)
      if (data.logradouro) {
        setValue("address", data.logradouro, { shouldValidate: true })
        preenchidos++
      }
      
      if (data.bairro) {
        setValue("district", data.bairro, { shouldValidate: true })
        preenchidos++
      }
      
      if (data.localidade) {
        setValue("city", data.localidade, { shouldValidate: true })
        preenchidos++
      }
      
      if (data.uf) {
        setValue("state", data.uf, { shouldValidate: true })
        preenchidos++
      }
      
      if (preenchidos > 0) {
        toast.success(`${preenchidos} campo(s) preenchido(s) automaticamente!`)
      } else {
        toast.warning("CEP encontrado, mas sem dados de endereço. Preencha manualmente.")
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
      toast.error("Erro ao buscar CEP. Verifique sua conexão.")
    } finally {
      setIsLoadingCep(false)
    }
  }

  const onSubmit = async (data: CustomerFormData) => {
    try {
      // Montar endereço completo
      const addressParts = [
        data.address,
        data.addressNumber,
        data.addressComplement,
        data.district,
        data.city,
        data.state,
        data.postalCode,
      ].filter(Boolean)
      
      const fullAddress = addressParts.length > 0 ? addressParts.join(", ") : null

      const customer = await createCustomer.mutateAsync({
        name: data.name,
        phone: data.phone || null,
        document: data.document || null,
        address: fullAddress,
      })

      toast.success("Cliente criado com sucesso!")
      onSuccess(customer)
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar cliente")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
          {/* Informações Básicas */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  {...register("name", { required: "Nome é obrigatório" })}
                  placeholder="João da Silva"
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  {...register("phone", { required: "Telefone é obrigatório" })}
                  placeholder="(11) 99999-9999"
                />
                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="document">CPF/CNPJ</Label>
                <Input
                  id="document"
                  {...register("document")}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Endereço</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label htmlFor="postalCode">CEP</Label>
                <div className="flex gap-2">
                  <Input
                    id="postalCode"
                    {...register("postalCode")}
                    placeholder="00000-000"
                    maxLength={9}
                    onBlur={handleCepBlur}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleCepBlur()
                      }
                    }}
                  />
                  {isLoadingCep && (
                    <Button type="button" disabled size="icon" variant="outline">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Digite o CEP e pressione Enter ou Tab
                </p>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="address">Rua/Endereço</Label>
                <Input
                  id="address"
                  {...register("address")}
                  placeholder="Rua exemplo"
                />
              </div>

              <div>
                <Label htmlFor="addressNumber">Número</Label>
                <Input
                  id="addressNumber"
                  {...register("addressNumber")}
                  placeholder="123"
                />
              </div>

              <div>
                <Label htmlFor="addressComplement">Complemento</Label>
                <Input
                  id="addressComplement"
                  {...register("addressComplement")}
                  placeholder="Apto 101"
                />
              </div>

              <div>
                <Label htmlFor="district">Bairro</Label>
                <Input
                  id="district"
                  {...register("district")}
                  placeholder="Centro"
                />
              </div>

              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  {...register("city")}
                  placeholder="São Paulo"
                />
              </div>

              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  {...register("state")}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createCustomer.isPending}>
              {createCustomer.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Cliente"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

