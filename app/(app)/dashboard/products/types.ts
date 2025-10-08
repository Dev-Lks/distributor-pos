export type TabKey = "basic" | "pricing" | "identity"

export type ProductFormState = {
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
  barcode: string
  packaging: string
  origin: string
  abv: string
  ibu: string
  shelfLifeDays: string
}

export type FieldChangeHandler = (field: keyof ProductFormState, value: string) => void

export const initialFormState: ProductFormState = {
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
  barcode: "",
  packaging: "",
  origin: "",
  abv: "",
  ibu: "",
  shelfLifeDays: "",
}

export const fieldTabMap: Record<keyof ProductFormState, TabKey> = {
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
  barcode: "identity",
  packaging: "identity",
  origin: "identity",
  abv: "identity",
  ibu: "identity",
  shelfLifeDays: "identity",
}
