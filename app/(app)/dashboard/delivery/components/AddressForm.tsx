"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2, MapPin } from "lucide-react"
import { toast } from "sonner"

interface AddressFields {
  postalCode?: string
  deliveryAddress?: string
  addressNumber?: string
  addressComplement?: string
  district?: string
  city?: string
  state?: string
  referencePoint?: string
  deliveryInstructions?: string
}

interface AddressFormProps {
  values: AddressFields
  onChange: (field: keyof AddressFields, value: string) => void
  errors?: Partial<Record<keyof AddressFields, string>>
}

export function AddressForm({ values, onChange, errors }: AddressFormProps) {
  const [isLoadingCep, setIsLoadingCep] = useState(false)

  const handleCepChange = (cep: string) => {
    // Formatar CEP automaticamente
    const numbers = cep.replace(/\D/g, "")
    let formatted = numbers
    
    if (numbers.length > 5) {
      formatted = `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
    }
    
    onChange("postalCode", formatted)
  }

  const handleCepBlur = async () => {
    const cep = values.postalCode?.replace(/\D/g, "")
    
    if (!cep || cep.length !== 8) return

    setIsLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      
      if (!response.ok) {
        throw new Error("Erro na requisição")
      }
      
      const data = await response.json()

      if (data.erro) {
        toast.error("CEP não encontrado")
        setIsLoadingCep(false)
        return
      }

      // Contador de campos preenchidos
      let preenchidos = 0

      // Preencher campos automaticamente
      if (data.logradouro) {
        onChange("deliveryAddress", data.logradouro)
        preenchidos++
      }
      
      if (data.bairro) {
        onChange("district", data.bairro)
        preenchidos++
      }
      
      if (data.localidade) {
        onChange("city", data.localidade)
        preenchidos++
      }
      
      if (data.uf) {
        onChange("state", data.uf)
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Endereço de Entrega</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* CEP */}
        <div className="sm:col-span-2">
          <Label htmlFor="postalCode">CEP</Label>
          <div className="flex gap-2">
            <Input
              id="postalCode"
              value={values.postalCode || ""}
              onChange={(e) => handleCepChange(e.target.value)}
              onBlur={handleCepBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleCepBlur()
                }
              }}
              placeholder="00000-000"
              maxLength={9}
              className={errors?.postalCode ? "border-red-500" : ""}
            />
            {isLoadingCep && (
              <Button type="button" disabled size="icon" variant="outline" tabIndex={-1}>
                <Loader2 className="h-4 w-4 animate-spin" />
              </Button>
            )}
          </div>
          {errors?.postalCode && (
            <p className="text-xs text-red-500 mt-1">{errors.postalCode}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Digite o CEP e pressione Enter ou Tab para buscar
          </p>
        </div>

        {/* Rua/Endereço */}
        <div className="sm:col-span-2">
          <Label htmlFor="deliveryAddress">
            Rua/Endereço <span className="text-red-500">*</span>
          </Label>
          <Input
            id="deliveryAddress"
            value={values.deliveryAddress || ""}
            onChange={(e) => onChange("deliveryAddress", e.target.value)}
            placeholder="Rua exemplo"
            className={errors?.deliveryAddress ? "border-red-500" : ""}
          />
          {errors?.deliveryAddress && (
            <p className="text-xs text-red-500 mt-1">{errors.deliveryAddress}</p>
          )}
        </div>

        {/* Número */}
        <div>
          <Label htmlFor="addressNumber">Número</Label>
          <Input
            id="addressNumber"
            value={values.addressNumber || ""}
            onChange={(e) => onChange("addressNumber", e.target.value)}
            placeholder="123"
            className={errors?.addressNumber ? "border-red-500" : ""}
          />
          {errors?.addressNumber && (
            <p className="text-xs text-red-500 mt-1">{errors.addressNumber}</p>
          )}
        </div>

        {/* Complemento */}
        <div>
          <Label htmlFor="addressComplement">Complemento</Label>
          <Input
            id="addressComplement"
            value={values.addressComplement || ""}
            onChange={(e) => onChange("addressComplement", e.target.value)}
            placeholder="Apto 101, Bloco B"
          />
        </div>

        {/* Bairro */}
        <div>
          <Label htmlFor="district">
            Bairro <span className="text-red-500">*</span>
          </Label>
          <Input
            id="district"
            value={values.district || ""}
            onChange={(e) => onChange("district", e.target.value)}
            placeholder="Centro"
            className={errors?.district ? "border-red-500" : ""}
          />
          {errors?.district && (
            <p className="text-xs text-red-500 mt-1">{errors.district}</p>
          )}
        </div>

        {/* Cidade */}
        <div>
          <Label htmlFor="city">
            Cidade <span className="text-red-500">*</span>
          </Label>
          <Input
            id="city"
            value={values.city || ""}
            onChange={(e) => onChange("city", e.target.value)}
            placeholder="São Paulo"
            className={errors?.city ? "border-red-500" : ""}
          />
          {errors?.city && (
            <p className="text-xs text-red-500 mt-1">{errors.city}</p>
          )}
        </div>

        {/* Estado */}
        <div>
          <Label htmlFor="state">
            Estado <span className="text-red-500">*</span>
          </Label>
          <Input
            id="state"
            value={values.state || ""}
            onChange={(e) => onChange("state", e.target.value.toUpperCase())}
            placeholder="SP"
            maxLength={2}
            className={errors?.state ? "border-red-500" : ""}
          />
          {errors?.state && (
            <p className="text-xs text-red-500 mt-1">{errors.state}</p>
          )}
        </div>

        {/* Ponto de Referência */}
        <div className="sm:col-span-2">
          <Label htmlFor="referencePoint">Ponto de Referência</Label>
          <Input
            id="referencePoint"
            value={values.referencePoint || ""}
            onChange={(e) => onChange("referencePoint", e.target.value)}
            placeholder="Próximo ao mercado, em frente à praça..."
          />
        </div>

        {/* Instruções de Entrega */}
        <div className="sm:col-span-2">
          <Label htmlFor="deliveryInstructions">Instruções para o Entregador</Label>
          <Textarea
            id="deliveryInstructions"
            value={values.deliveryInstructions || ""}
            onChange={(e) => onChange("deliveryInstructions", e.target.value)}
            rows={3}
            placeholder="Tocar a campainha, cuidado com o cachorro, etc..."
          />
        </div>
      </div>
    </div>
  )
}
