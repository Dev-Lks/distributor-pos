import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calculator } from "lucide-react"
import { formatCurrency } from "@/lib/utils/formatters"
import type { ProductFormState, FieldChangeHandler } from "../../../products/types"

interface MarginPreview {
  cost?: number
  salePrice?: number
  marginValue?: number
  marginPercent?: number
}

interface PricingTabProps {
  formData: ProductFormState
  onFieldChange: FieldChangeHandler
  errors?: Partial<Record<keyof ProductFormState, string>>
  marginPreview: MarginPreview
}

const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null
  return <p className="text-xs text-destructive">{message}</p>
}

export function PricingTab({ formData, onFieldChange, errors, marginPreview }: PricingTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="product-cost">Custo unitário (R$)</Label>
          <Input
            id="product-cost"
            type="number"
            inputMode="decimal"
            value={formData.cost}
            onChange={(event) => onFieldChange("cost", event.target.value)}
            placeholder="0.00"
          />
          <FieldError message={errors?.cost} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-sale-price">Preço de venda sugerido (R$)</Label>
          <Input
            id="product-sale-price"
            type="number"
            inputMode="decimal"
            value={formData.salePrice}
            onChange={(event) => onFieldChange("salePrice", event.target.value)}
            placeholder="0.00"
          />
          <FieldError message={errors?.salePrice} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="product-supplier">Fornecedor</Label>
          <Input
            id="product-supplier"
            value={formData.supplier}
            onChange={(event) => onFieldChange("supplier", event.target.value)}
            placeholder="Quem entrega esse produto?"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-bonifications">Bonificações disponíveis</Label>
          <Input
            id="product-bonifications"
            type="number"
            inputMode="numeric"
            value={formData.bonifications}
            onChange={(event) => onFieldChange("bonifications", event.target.value)}
            placeholder="0"
          />
          <FieldError message={errors?.bonifications} />
        </div>
      </div>

      <div className="rounded-xl border border-dashed bg-muted/40 p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Calculator className="h-4 w-4 text-primary" />
          Painel de margem estimada
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs uppercase text-muted-foreground">Custo</p>
            <p className="text-lg font-semibold">{formatCurrency(marginPreview.cost)}</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs uppercase text-muted-foreground">Preço venda</p>
            <p className="text-lg font-semibold">{formatCurrency(marginPreview.salePrice)}</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs uppercase text-muted-foreground">Margem</p>
            <p className="text-lg font-semibold">
              {marginPreview.marginValue !== undefined
                ? `${formatCurrency(marginPreview.marginValue)} (${marginPreview.marginPercent !== undefined ? `${marginPreview.marginPercent.toFixed(1)}%` : "--"})`
                : "--"}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Use as bonificações para controlar brindes e cortesias sem impactar o estoque físico.
        </p>
      </div>
    </div>
  )
}
