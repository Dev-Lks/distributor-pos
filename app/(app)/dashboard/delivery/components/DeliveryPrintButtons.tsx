"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Printer, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

interface DeliveryPrintButtonsProps {
  deliveryId: string
  deliveryData?: any
}

export function DeliveryPrintButtons({ deliveryId, deliveryData }: DeliveryPrintButtonsProps) {
  const [isPrinting, setIsPrinting] = useState(false)

  const handlePrint = async (type: 'driver' | 'customer' | 'organizer' | 'all') => {
    setIsPrinting(true)
    
    try {
      // Se for "all", imprime as 3 vias
      const types = type === 'all' 
        ? ['delivery-driver', 'delivery-customer', 'delivery-organizer'] 
        : [`delivery-${type}`]
      
      for (const receiptType of types) {
        const response = await fetch('/api/hardware/printer/print', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            data: deliveryData || { id: deliveryId }, 
            type: receiptType,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Erro ao imprimir')
        }
      }

      const recipientNames: Record<string, string> = {
        driver: 'do Entregador',
        customer: 'do Cliente',
        organizer: 'do Organizador',
        all: 'de Todas as Vias'
      }

      toast.success(`Via ${recipientNames[type]} impressa com sucesso!`)
    } catch (error: any) {
      console.error('Erro ao imprimir:', error)
      toast.error(error.message || 'Erro ao imprimir')
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={isPrinting}
          className="gap-2"
        >
          {isPrinting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Imprimindo...
            </>
          ) : (
            <>
              <Printer className="h-4 w-4" />
              Imprimir
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Imprimir Via</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handlePrint('driver')}>
          <Printer className="h-4 w-4 mr-2" />
          Via do Entregador
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlePrint('customer')}>
          <Printer className="h-4 w-4 mr-2" />
          Via do Cliente
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlePrint('organizer')}>
          <Printer className="h-4 w-4 mr-2" />
          Via do Organizador
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handlePrint('all')}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir Todas as Vias
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
