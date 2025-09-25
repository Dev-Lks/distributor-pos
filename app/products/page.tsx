"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useProducts, type Product } from "@/lib/useProducts"
import { SidebarLayout } from "@/components/SidebarLayout"
import { Plus, Edit, Trash2, Search, Package, Sparkles, X, Calculator, Tag as TagIcon, Loader2 } from "lucide-react"

type TabKey = "basic" | "pricing" | "identity"

type ProductFormState = {
  name: string
  size: string
  category: string
  brand: string
  tags: string
  cost: string
  salePrice: string
  supplier: string
  bonifications: string
  sku: string
  packaging: string
  origin: string
  abv: string
  ibu: string
  shelfLifeDays: string
}

const initialFormState: ProductFormState = {
  name: "",
  size: "",
  category: "",
  brand: "",
  tags: "",
  cost: "",
  salePrice: "",
  supplier: "",
  bonifications: "0",
  sku: "",
  packaging: "",
  origin: "",
  abv: "",
  ibu: "",
  shelfLifeDays: "",
}

const fieldTabMap: Record<keyof ProductFormState, TabKey> = {
  name: "basic",
  size: "basic",
  category: "basic",
  brand: "basic",
  tags: "identity",
  cost: "pricing",
  salePrice: "pricing",
  supplier: "pricing",
  bonifications: "pricing",
  sku: "identity",
  packaging: "identity",
  origin: "identity",
  abv: "identity",
  ibu: "identity",
  shelfLifeDays: "identity",
}

const parseNumber = (value: string): number | undefined => {
  if (!value?.toString().trim()) return undefined
  const normalized = value.replace(/\s/g, "").replace(",", ".")
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

const parseInteger = (value: string): number | undefined => {
  if (!value?.toString().trim()) return undefined
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

const formatCurrency = (value?: number) =>
  value !== undefined ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "--"

const buildProductPayload = (form: ProductFormState) => {
  const cost = parseNumber(form.cost) ?? 0
  const salePrice = parseNumber(form.salePrice) ?? 0
  const bonifications = parseInteger(form.bonifications) ?? 0
  const abv = parseNumber(form.abv)
  const ibu = parseInteger(form.ibu)
  const shelfLifeDays = parseInteger(form.shelfLifeDays)
  const tags = form.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)

  return {
    name: form.name.trim(),
    size: form.size.trim(),
    cost,
    salePrice,
    category: form.category.trim() || undefined,
    brand: form.brand.trim() || undefined,
    tags,
    supplier: form.supplier.trim() || undefined,
    sku: form.sku.trim() || undefined,
    bonifications,
    isBonified: bonifications > 0,
    packaging: form.packaging.trim() || undefined,
    origin: form.origin.trim() || undefined,
    abv: abv ?? undefined,
    ibu: ibu ?? undefined,
    shelfLifeDays: shelfLifeDays ?? undefined,
  }
}

const validateProductForm = (form: ProductFormState) => {
  const errors: Partial<Record<keyof ProductFormState, string>> = {}
  if (!form.name.trim()) {
    errors.name = "Informe o nome do produto."
  }
  if (!form.size.trim()) {
    errors.size = "Defina o volume ou tamanho."
  }
  const cost = parseNumber(form.cost)
  if (cost === undefined || cost <= 0) {
    errors.cost = "Informe um custo válido."
  }
  const salePrice = parseNumber(form.salePrice)
  if (salePrice === undefined || salePrice <= 0) {
    errors.salePrice = "Informe um preço de venda válido."
  }
  if (cost !== undefined && salePrice !== undefined && salePrice < cost) {
    errors.salePrice = "O preço de venda deve ser maior que o custo."
  }
  const bonifications = parseInteger(form.bonifications)
  if (bonifications !== undefined && bonifications < 0) {
    errors.bonifications = "Bonificações não podem ser negativas."
  }
  return errors
}

const getMarginPreview = (form: ProductFormState) => {
  const cost = parseNumber(form.cost)
  const salePrice = parseNumber(form.salePrice)
  if (cost === undefined || salePrice === undefined) {
    return { cost, salePrice, marginValue: undefined as number | undefined, marginPercent: undefined as number | undefined }
  }
  const marginValue = salePrice - cost
  const marginPercent = cost > 0 ? (marginValue / cost) * 100 : undefined
  return { cost, salePrice, marginValue, marginPercent }
}

const mapProductToForm = (product: Product): ProductFormState => ({
  ...initialFormState,
  name: product.name ?? "",
  size: product.size ?? "",
  category: product.category ?? "",
  brand: product.brand ?? "",
  tags: Array.isArray(product.tags) ? product.tags.join(", ") : "",
  cost: product.cost?.toString() ?? "",
  salePrice: product.salePrice?.toString() ?? "",
  supplier: product.supplier ?? "",
  bonifications: product.bonifications?.toString() ?? "0",
  sku: product.sku ?? "",
  packaging: product.packaging ?? "",
  origin: product.origin ?? "",
  abv: product.abv !== null && product.abv !== undefined ? product.abv.toString() : "",
  ibu: product.ibu !== null && product.ibu !== undefined ? product.ibu.toString() : "",
  shelfLifeDays:
    product.shelfLifeDays !== null && product.shelfLifeDays !== undefined
      ? product.shelfLifeDays.toString()
      : "",
})

const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null
  return <p className="text-xs text-destructive">{message}</p>
}

type FieldChangeHandler = (field: keyof ProductFormState, value: string) => void

const BasicFields = ({
  formData,
  onFieldChange,
  errors,
  categorySuggestions = [],
  brandSuggestions = [],
  onQuickFill,
  showSuggestions = false,
}: {
  formData: ProductFormState
  onFieldChange: FieldChangeHandler
  errors?: Partial<Record<keyof ProductFormState, string>>
  categorySuggestions?: string[]
  brandSuggestions?: string[]
  onQuickFill?: FieldChangeHandler
  showSuggestions?: boolean
}) => (
  <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="product-name">Nome oficial</Label>
        <Input
          id="product-name"
          value={formData.name}
          onChange={(event) => onFieldChange("name", event.target.value)}
          placeholder="Ex: NitroBeer Lager 600ml"
        />
        <FieldError message={errors?.name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="product-brand">Marca</Label>
        <Input
          id="product-brand"
          value={formData.brand}
          onChange={(event) => onFieldChange("brand", event.target.value)}
          placeholder="Ex: NitroBeer"
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
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categorias frequentes</p>
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
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Marcas já cadastradas</p>
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

const PricingFields = ({
  formData,
  onFieldChange,
  errors,
  marginPreview,
}: {
  formData: ProductFormState
  onFieldChange: FieldChangeHandler
  errors?: Partial<Record<keyof ProductFormState, string>>
  marginPreview: ReturnType<typeof getMarginPreview>
}) => (
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

const IdentityFields = ({
  formData,
  onFieldChange,
  packagingSuggestions = [],
  errors,
  onQuickFill,
}: {
  formData: ProductFormState
  onFieldChange: FieldChangeHandler
  packagingSuggestions?: string[]
  errors?: Partial<Record<keyof ProductFormState, string>>
  onQuickFill?: FieldChangeHandler
}) => {
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

export default function ProductsPage() {
  const { data: products = [], isLoading, refetch } = useProducts()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedSize, setSelectedSize] = useState("all")
  const [showCreatePanel, setShowCreatePanel] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [createForm, setCreateForm] = useState<ProductFormState>(initialFormState)
  const [editForm, setEditForm] = useState<ProductFormState>(initialFormState)
  const [createErrors, setCreateErrors] = useState<Partial<Record<keyof ProductFormState, string>>>({})
  const [editErrors, setEditErrors] = useState<Partial<Record<keyof ProductFormState, string>>>({})
  const [activeCreateTab, setActiveCreateTab] = useState<TabKey>("basic")
  const [activeEditTab, setActiveEditTab] = useState<TabKey>("basic")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))] as string[],
    [products]
  )
  const sizes = useMemo(
    () => ["all", ...Array.from(new Set(products.map((p) => p.size)))],
    [products]
  )
  const brandSuggestions = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand).filter(Boolean))) as string[],
    [products]
  )
  const packagingSuggestions = useMemo(
    () => Array.from(new Set(products.map((p) => p.packaging).filter(Boolean))) as string[],
    [products]
  )

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    const matchesSize = selectedSize === "all" || product.size === selectedSize
    return matchesSearch && matchesCategory && matchesSize
  })

  const createMarginPreview = useMemo(() => getMarginPreview(createForm), [createForm])
  const editMarginPreview = useMemo(() => getMarginPreview(editForm), [editForm])

  const handleCreateFieldChange: FieldChangeHandler = (field, value) => {
    setCreateForm((previous) => ({ ...previous, [field]: value }))
    if (createErrors[field]) {
      setCreateErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleEditFieldChange: FieldChangeHandler = (field, value) => {
    setEditForm((previous) => ({ ...previous, [field]: value }))
    if (editErrors[field]) {
      setEditErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const resetCreateExperience = () => {
    setCreateForm(initialFormState)
    setCreateErrors({})
    setActiveCreateTab("basic")
  }

  const handleAddProduct = async () => {
    const errors = validateProductForm(createForm)
    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors)
      const firstKey = Object.keys(errors)[0] as keyof ProductFormState
      if (firstKey) {
        setActiveCreateTab(fieldTabMap[firstKey])
      }
      return
    }

    setIsSubmitting(true)
    try {
      const payload = buildProductPayload(createForm)
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(data?.error || "Não foi possível criar o produto.")
      }

      toast.success("Produto cadastrado com sucesso!")
      await refetch()
      setShowCreatePanel(false)
      resetCreateExperience()
    } catch (error) {
      console.error("Error adding product:", error)
      toast.error(error instanceof Error ? error.message : "Falha ao criar produto.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditProduct = async () => {
    if (!editingProduct) return

    const errors = validateProductForm(editForm)
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors)
      const firstKey = Object.keys(errors)[0] as keyof ProductFormState
      if (firstKey) {
        setActiveEditTab(fieldTabMap[firstKey])
      }
      return
    }

    setIsSavingEdit(true)
    try {
      const payload = buildProductPayload(editForm)
      const response = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingProduct.id, ...payload }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(data?.error || "Não foi possível atualizar o produto.")
      }

      toast.success("Produto atualizado!")
      await refetch()
      setIsEditDialogOpen(false)
      setEditingProduct(null)
    } catch (error) {
      console.error("Error updating product:", error)
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar produto.")
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
      const response = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(data?.error || "Não foi possível excluir o produto.")
      }

      toast.success("Produto removido")
      await refetch()
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error(error instanceof Error ? error.message : "Falha ao excluir produto.")
    }
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setEditForm(mapProductToForm(product))
    setEditErrors({})
    setActiveEditTab("basic")
    setIsEditDialogOpen(true)
  }

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg">Carregando produtos...</div>
        </div>
      </SidebarLayout>
    )
  }

  const quickTags = createForm.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Produtos</h1>
            <p className="text-muted-foreground">Gerencie e evolua seu portfólio com cadastros inteligentes</p>
          </div>
          <div className="flex items-center gap-2">
            {showCreatePanel ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreatePanel(false)
                  resetCreateExperience()
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Fechar estúdio de produtos
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  resetCreateExperience()
                  setShowCreatePanel(true)
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Criar novo produto
              </Button>
            )}
          </div>
        </div>

        {showCreatePanel && (
          <Card className="border-dashed border-primary/40">
            <CardHeader>
              <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Estúdio de produtos
                  </CardTitle>
                  <CardDescription>
                    Estruture o lançamento com etapas guiadas, visualize margens em tempo real e documente identidade de catálogo.
                  </CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  Campos essenciais primeiro, detalhes gourmet depois. Tudo sem travar o time.
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <div className="space-y-6">
                  <Tabs value={activeCreateTab} onValueChange={(value) => setActiveCreateTab(value as TabKey)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="basic">Fundamentos</TabsTrigger>
                      <TabsTrigger value="pricing">Financeiro</TabsTrigger>
                      <TabsTrigger value="identity">Identidade</TabsTrigger>
                    </TabsList>
                    <TabsContent value="basic" className="mt-4">
                      <BasicFields
                        formData={createForm}
                        onFieldChange={handleCreateFieldChange}
                        errors={createErrors}
                        categorySuggestions={categories.slice(1)}
                        brandSuggestions={brandSuggestions}
                        onQuickFill={handleCreateFieldChange}
                        showSuggestions
                      />
                    </TabsContent>
                    <TabsContent value="pricing" className="mt-4">
                      <PricingFields
                        formData={createForm}
                        onFieldChange={handleCreateFieldChange}
                        errors={createErrors}
                        marginPreview={createMarginPreview}
                      />
                    </TabsContent>
                    <TabsContent value="identity" className="mt-4">
                      <IdentityFields
                        formData={createForm}
                        onFieldChange={handleCreateFieldChange}
                        packagingSuggestions={packagingSuggestions}
                        errors={createErrors}
                        onQuickFill={handleCreateFieldChange}
                      />
                    </TabsContent>
                  </Tabs>
                </div>

                <aside className="flex flex-col gap-4">
                  <div className="rounded-2xl border bg-muted/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Snapshot</p>
                    <div className="mt-3 space-y-2">
                      <p className="text-xl font-semibold">
                        {createForm.name ? createForm.name : "Nome do produto"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {createForm.brand || "Marca a definir"} • {createForm.size || "Volume"}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border bg-background p-3">
                          <p className="text-xs uppercase text-muted-foreground">Preço</p>
                          <p className="text-lg font-semibold">{formatCurrency(createMarginPreview.salePrice)}</p>
                        </div>
                        <div className="rounded-lg border bg-background p-3">
                          <p className="text-xs uppercase text-muted-foreground">Margem</p>
                          <p className="text-lg font-semibold">
                            {createMarginPreview.marginValue !== undefined
                              ? `${formatCurrency(createMarginPreview.marginValue)}${
                                  createMarginPreview.marginPercent !== undefined
                                    ? ` • ${createMarginPreview.marginPercent.toFixed(1)}%`
                                    : ""
                                }`
                              : "--"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Tags & narrativa</p>
                      {quickTags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {quickTags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1 text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Defina tags para sugerir o produto em combos, promoções e buscas.
                        </p>
                      )}
                    </div>
                  </div>
                </aside>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowCreatePanel(false)
                  resetCreateExperience()
                }}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={handleAddProduct} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Publicar produto
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <Input
                  id="search"
                  placeholder="Nome, SKU ou tags..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-filter">Categoria</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category-filter">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.slice(1).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="size-filter">Tamanho</Label>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger id="size-filter">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tamanhos</SelectItem>
                    {sizes.slice(1).map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedCategory("all")
                    setSelectedSize("all")
                  }}
                >
                  Limpar filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Catálogo ({filteredProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead>Preço venda</TableHead>
                    <TableHead>Bonificações</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product: Product) => {
                    const tags = Array.isArray(product.tags) ? product.tags : []
                    const margin = product.salePrice - product.cost
                    const marginPercent = product.cost > 0 ? (margin / product.cost) * 100 : undefined

                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.brand || <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.size}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{product.category || "Sem categoria"}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(product.cost)}</TableCell>
                        <TableCell>
                          <div className="font-semibold">{formatCurrency(product.salePrice)}</div>
                          {marginPercent !== undefined && (
                            <p className="text-xs text-muted-foreground">
                              Margem {formatCurrency(margin)} • {marginPercent.toFixed(1)}%
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {product.bonifications > 0 ? (
                            <Badge className="bg-blue-100 text-blue-800">
                              {product.bonifications}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{product.sku || "-"}</TableCell>
                        <TableCell>
                          {tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">+{tags.length - 3}</Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sem tags</span>
                          )}
                        </TableCell>
                        <TableCell className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setProductToDelete(product)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Editar produto</DialogTitle>
            </DialogHeader>
            <Tabs value={activeEditTab} onValueChange={(value) => setActiveEditTab(value as TabKey)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Fundamentos</TabsTrigger>
                <TabsTrigger value="pricing">Financeiro</TabsTrigger>
                <TabsTrigger value="identity">Identidade</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="mt-4">
                <BasicFields
                  formData={editForm}
                  onFieldChange={handleEditFieldChange}
                  errors={editErrors}
                  categorySuggestions={categories.slice(1)}
                  brandSuggestions={brandSuggestions}
                />
              </TabsContent>
              <TabsContent value="pricing" className="mt-4">
                <PricingFields
                  formData={editForm}
                  onFieldChange={handleEditFieldChange}
                  errors={editErrors}
                  marginPreview={editMarginPreview}
                />
              </TabsContent>
              <TabsContent value="identity" className="mt-4">
                <IdentityFields
                  formData={editForm}
                  onFieldChange={handleEditFieldChange}
                  packagingSuggestions={packagingSuggestions}
                  errors={editErrors}
                />
              </TabsContent>
            </Tabs>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditProduct} disabled={isSavingEdit}>
                {isSavingEdit ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar alterações"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar exclusão</DialogTitle>
            </DialogHeader>
            <p>
              Tem certeza que deseja excluir o produto "{productToDelete?.name} {productToDelete?.size}"?
              Esta ação não pode ser desfeita.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (productToDelete) {
                    handleDeleteProduct(productToDelete.id)
                    setIsDeleteDialogOpen(false)
                    setProductToDelete(null)
                  }
                }}
              >
                Excluir
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarLayout>
  )
}