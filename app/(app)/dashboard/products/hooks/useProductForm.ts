import { useState, useMemo, useCallback } from "react"
import { toast } from "sonner"
import type { Product } from "@/hooks/useProducts"
import { type ProductFormState, type TabKey, initialFormState, fieldTabMap } from "../types"

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

export const buildProductPayload = (form: ProductFormState) => {
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
    barcode: form.barcode.trim() || undefined,
    bonifications,
    isBonified: bonifications > 0,
    packaging: form.packaging.trim() || undefined,
    origin: form.origin.trim() || undefined,
    abv: abv ?? undefined,
    ibu: ibu ?? undefined,
    shelfLifeDays: shelfLifeDays ?? undefined,
  }
}

export const validateProductForm = (form: ProductFormState) => {
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
  
  // Validação do código de barras
  if (form.barcode.trim()) {
    const barcode = form.barcode.trim()
    // Verificar se contém apenas números
    if (!/^\d+$/.test(barcode)) {
      errors.barcode = "Código de barras deve conter apenas números."
    }
    // Verificar comprimento (EAN-8, EAN-13, UPC-A, etc)
    else if (barcode.length < 8) {
      errors.barcode = "Código de barras deve ter pelo menos 8 dígitos."
    }
    else if (barcode.length > 13 && barcode.length !== 14) {
      errors.barcode = "Código de barras inválido (use EAN-8, EAN-13 ou GTIN-14)."
    }
  }
  
  return errors
}

export const getMarginPreview = (form: ProductFormState) => {
  const cost = parseNumber(form.cost)
  const salePrice = parseNumber(form.salePrice)
  
  if (cost === undefined || salePrice === undefined) {
    return { 
      cost, 
      salePrice, 
      marginValue: undefined as number | undefined, 
      marginPercent: undefined as number | undefined 
    }
  }
  
  const marginValue = salePrice - cost
  const marginPercent = cost > 0 ? (marginValue / cost) * 100 : undefined
  
  return { cost, salePrice, marginValue, marginPercent }
}

export const mapProductToForm = (product: Product): ProductFormState => ({
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
  barcode: product.barcode ?? "",
  packaging: product.packaging ?? "",
  origin: product.origin ?? "",
  abv: product.abv !== null && product.abv !== undefined ? product.abv.toString() : "",
  ibu: product.ibu !== null && product.ibu !== undefined ? product.ibu.toString() : "",
  shelfLifeDays:
    product.shelfLifeDays !== null && product.shelfLifeDays !== undefined
      ? product.shelfLifeDays.toString()
      : "",
})

interface UseProductFormProps {
  initialData?: Product
  onSuccess?: () => void
}

export function useProductForm({ initialData, onSuccess }: UseProductFormProps = {}) {
  const [formData, setFormData] = useState<ProductFormState>(
    initialData ? mapProductToForm(initialData) : initialFormState
  )
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormState, string>>>({})
  const [activeTab, setActiveTab] = useState<TabKey>("basic")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const marginPreview = useMemo(() => getMarginPreview(formData), [formData])

  const handleFieldChange = useCallback((field: keyof ProductFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }, [errors])

  const resetForm = useCallback(() => {
    setFormData(initialFormState)
    setErrors({})
    setActiveTab("basic")
  }, [])

  const validateForm = useCallback(() => {
    const validationErrors = validateProductForm(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      // Navigate to the first tab with an error
      const firstErrorKey = Object.keys(validationErrors)[0] as keyof ProductFormState
      if (firstErrorKey) {
        setActiveTab(fieldTabMap[firstErrorKey])
      }
      return false
    }
    return true
  }, [formData])

  const submitForm = useCallback(
    async (apiEndpoint: string, method: "POST" | "PATCH", productId?: string) => {
      if (!validateForm()) {
        return false
      }

      setIsSubmitting(true)
      try {
        const payload = buildProductPayload(formData)
        const body = productId ? { id: productId, ...payload } : payload

        const response = await fetch(apiEndpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string }
          throw new Error(data?.error || "Não foi possível processar o produto.")
        }

        const successMessage = method === "POST" ? "Produto cadastrado com sucesso!" : "Produto atualizado!"
        toast.success(successMessage)
        onSuccess?.()
        return true
      } catch (error) {
        console.error("Error submitting product:", error)
        toast.error(error instanceof Error ? error.message : "Falha ao processar produto.")
        return false
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, validateForm, onSuccess]
  )

  return {
    formData,
    errors,
    activeTab,
    isSubmitting,
    marginPreview,
    handleFieldChange,
    setActiveTab,
    resetForm,
    validateForm,
    submitForm,
  }
}
