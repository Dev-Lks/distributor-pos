import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { ProductFormState, FieldChangeHandler } from "../../../products/types"

interface BasicTabProps {
  formData: ProductFormState
  onFieldChange: FieldChangeHandler
  errors?: Partial<Record<keyof ProductFormState, string>>
  categorySuggestions?: string[]
  brandSuggestions?: string[]
  onQuickFill?: FieldChangeHandler
  showSuggestions?: boolean
}

const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null
  return <p className="text-xs text-destructive">{message}</p>
}

export function BasicTab({
  formData,
  onFieldChange,
  errors,
  categorySuggestions = [],
  brandSuggestions = [],
  onQuickFill,
  showSuggestions = false,
}: BasicTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="product-name">Nome oficial</Label>
          <Input
            id="product-name"
            value={formData.name}
            onChange={(event) => onFieldChange("name", event.target.value)}
            placeholder="Ex: Distribuidora Lager 600ml"
          />
          <FieldError message={errors?.name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-brand">Marca</Label>
          <Input
            id="product-brand"
            value={formData.brand}
            onChange={(event) => onFieldChange("brand", event.target.value)}
            placeholder="Ex: Distribuidora"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="product-size">Volume / Tamanho</Label>
          <Input
            id="product-size"
            value={formData.size}
            onChange={(event) => onFieldChange("size", event.target.value)}
            placeholder="Ex: 600ml, Barril 50L"
          />
          <FieldError message={errors?.size} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-category">Categoria</Label>
          <Input
            id="product-category"
            value={formData.category}
            onChange={(event) => onFieldChange("category", event.target.value)}
            placeholder="Cerveja, Vinho, Gin..."
          />
        </div>
      </div>

      {showSuggestions && (categorySuggestions.length > 0 || brandSuggestions.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {categorySuggestions.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Categorias frequentes
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {categorySuggestions.map((category) => (
                  <Button
                    key={category}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onQuickFill?.("category", category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {brandSuggestions.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Marcas já cadastradas
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {brandSuggestions.map((brand) => (
                  <Button
                    key={brand}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onQuickFill?.("brand", brand)}
                  >
                    {brand}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
