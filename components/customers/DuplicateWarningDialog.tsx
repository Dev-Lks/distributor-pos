"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Phone, FileText, MapPin } from "lucide-react"
import type { DuplicateMatch } from "@/hooks/useCheckDuplicates"
import type { CustomerSummary } from "@/hooks/useCustomers"

interface DuplicateWarningDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  duplicates: DuplicateMatch[]
  onSelectExisting: (customer: CustomerSummary) => void
  onCreateAnyway: () => void
}

export function DuplicateWarningDialog({
  open,
  onOpenChange,
  duplicates,
  onSelectExisting,
  onCreateAnyway,
}: DuplicateWarningDialogProps) {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'phone': return '📱 Mesmo telefone'
      case 'document': return '📄 Mesmo CPF/CNPJ'
      case 'name': return '👤 Nome similar'
      default: return ''
    }
  }

  const getTypeVariant = (confidence: number): "default" | "secondary" | "outline" => {
    if (confidence >= 0.95) return "default"
    if (confidence >= 0.85) return "secondary"
    return "outline"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>⚠️ Cliente possivelmente já cadastrado</DialogTitle>
          </div>
          <DialogDescription>
            Encontramos <strong>{duplicates.length}</strong> cliente(s) com dados similares.
            Para evitar duplicatas, selecione um existente ou confirme para cadastrar um novo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-4">
          {duplicates.map(({ type, customer, confidence }) => (
            <Card key={customer.id} className="p-4 hover:bg-accent/50 transition-colors border-2">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-base">{customer.name}</h4>
                    <Badge variant={getTypeVariant(confidence)} className="text-xs">
                      {getTypeLabel(type)}
                    </Badge>
                    {confidence < 1.0 && (
                      <Badge variant="outline" className="text-xs">
                        {Math.round(confidence * 100)}% similar
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {customer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    {customer.document && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        <span>{customer.document}</span>
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">{customer.address}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    onSelectExisting(customer)
                    onOpenChange(false)
                  }}
                  className="shrink-0"
                >
                  Usar este
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onCreateAnyway()
              onOpenChange(false)
            }}
            className="w-full sm:w-auto"
          >
            Tenho certeza, cadastrar novo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
