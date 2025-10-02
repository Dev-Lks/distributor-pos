import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tag as TagIcon } from "lucide-react"
import type { ProductFormState, FieldChangeHandler } from "../../../products/types"

interface IdentityTabProps {
  formData: ProductFormState
  onFieldChange: FieldChangeHandler
  packagingSuggestions?: string[]
  errors?: Partial<Record<keyof ProductFormState, string>>
  onQuickFill?: FieldChangeHandler
}

const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null
  return <p className="text-xs text-destructive">{message}</p>
}

export function IdentityTab({
  formData,
  onFieldChange,
  packagingSuggestions = [],
  errors,
  onQuickFill,
}: IdentityTabProps) {
  const tagList = formData.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="product-sku">SKU / Código interno</Label>
          <Input
            id="product-sku"
            value={formData.sku}
            onChange={(event) => onFieldChange("sku", event.target.value)}
            placeholder="Ex: NB-LAGER-600"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-packaging">Embalagem</Label>
          <Input
            id="product-packaging"
            value={formData.packaging}
            onChange={(event) => onFieldChange("packaging", event.target.value)}
            placeholder="Long neck, Barril, Lata..."
          />
          {packagingSuggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {packagingSuggestions.map((packaging) => (
                <Button
                  key={packaging}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onQuickFill?.("packaging", packaging)}
                >
                  {packaging}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="product-origin">Origem</Label>
          <Input
            id="product-origin"
            value={formData.origin}
            onChange={(event) => onFieldChange("origin", event.target.value)}
            placeholder="Ex: Nacional, EUA, Alemanha"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-abv">ABV (%)</Label>
          <Input
            id="product-abv"
            type="number"
            inputMode="decimal"
            value={formData.abv}
            onChange={(event) => onFieldChange("abv", event.target.value)}
            placeholder="Teor alcoólico"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="product-ibu">IBU</Label>
          <Input
            id="product-ibu"
            type="number"
            inputMode="numeric"
            value={formData.ibu}
            onChange={(event) => onFieldChange("ibu", event.target.value)}
            placeholder="Intensidade do amargor"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-shelf-life">Validade (dias)</Label>
          <Input
            id="product-shelf-life"
            type="number"
            inputMode="numeric"
            value={formData.shelfLifeDays}
            onChange={(event) => onFieldChange("shelfLifeDays", event.target.value)}
            placeholder="Opcional"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-tags">Tags para busca e cardápio</Label>
        <Input
          id="product-tags"
          value={formData.tags}
          onChange={(event) => onFieldChange("tags", event.target.value)}
          placeholder="Ex: lupulado, leve, sazonal"
        />
        <p className="text-xs text-muted-foreground">Separe por vírgulas. Ex: lager, refrescante, best seller</p>
        {tagList.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {tagList.map((tag) => (
              <Badge key={tag} variant="outline" className="flex items-center gap-1">
                <TagIcon className="h-3 w-3" />
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Defina tags para facilitar buscas e ofertas inteligentes.</p>
        )}
      </div>

      <div className="space-y-2">
        <FieldError message={errors?.tags} />
      </div>
    </div>
  )
}
