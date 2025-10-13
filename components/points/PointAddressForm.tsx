"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface PointAddressFormProps {
  address?: string
  city?: string
  state?: string
  onAddressChange: (field: 'address' | 'city' | 'state', value: string) => void
}

export function PointAddressForm({ address, city, state, onAddressChange }: PointAddressFormProps) {
  const [postalCode, setPostalCode] = useState("")
  const [isLoadingCep, setIsLoadingCep] = useState(false)

  const handleCepChange = (cep: string) => {
    // Formatar CEP automaticamente
    const numbers = cep.replace(/\D/g, "")
    let formatted = numbers
    
    if (numbers.length > 5) {
      formatted = `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
    }
    
    setPostalCode(formatted)
  }

  const handleCepBlur = async () => {
    const cep = postalCode.replace(/\D/g, "")
    
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
        onAddressChange('address', data.logradouro)
        preenchidos++
      }
      
      if (data.localidade) {
        onAddressChange('city', data.localidade)
        preenchidos++
      }
      
      if (data.uf) {
        onAddressChange('state', data.uf)
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
      {/* CEP */}
      <div>
        <Label htmlFor="postalCode">CEP (opcional)</Label>
        <div className="flex gap-2">
          <Input
            id="postalCode"
            value={postalCode}
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
          />
          {isLoadingCep && (
            <Button type="button" disabled size="icon" variant="outline" tabIndex={-1}>
              <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Digite o CEP e pressione Enter para buscar
        </p>
      </div>

      {/* Endereço */}
      <div>
        <Label htmlFor="address">Endereço</Label>
        <Input
          id="address"
          value={address || ""}
          onChange={(e) => onAddressChange('address', e.target.value)}
          placeholder="Rua, Avenida..."
        />
      </div>

      {/* Cidade e Estado */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={city || ""}
            onChange={(e) => onAddressChange('city', e.target.value)}
            placeholder="São Paulo"
          />
        </div>
        <div>
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            value={state || ""}
            onChange={(e) => onAddressChange('state', e.target.value.toUpperCase())}
            placeholder="SP"
            maxLength={2}
          />
        </div>
      </div>
    </div>
  )
}
