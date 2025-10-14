import { z } from 'zod'
import {
  cuidSchema,
  nameSchema,
  descriptionSchema,
  skuSchema,
  barcodeSchema,
  moneySchema,
  quantitySchema,
  urlSchema,
} from './common'

// Schema para criar produto
export const createProductSchemaBase = z.object({
  name: nameSchema,
  sku: skuSchema,
  barcode: barcodeSchema,
  description: descriptionSchema,
  price: moneySchema,
  cost: moneySchema.optional(),
  minStock: quantitySchema.optional(),
  maxStock: quantitySchema.optional(),
  unit: z.enum(['un', 'kg', 'l', 'cx', 'm', 'pc']).default('un'),
  category: z.string().max(100, 'Categoria muito longa').optional(),
  brand: z.string().max(100, 'Marca muito longa').optional(),
  image: urlSchema,
  isActive: z.boolean().default(true),
  supplier: z.string().max(200, 'Fornecedor muito longo').optional(),
  notes: z.string().max(1000, 'Notas muito longas').optional(),
})

export const createProductSchema = createProductSchemaBase
  .refine(
    (data) => !data.cost || data.price >= data.cost,
    {
      message: 'Preço de venda não pode ser menor que o custo',
      path: ['price'],
    }
  ).refine(
    (data) => !data.minStock || !data.maxStock || data.maxStock >= data.minStock,
    {
      message: 'Estoque máximo deve ser maior ou igual ao mínimo',
      path: ['maxStock'],
    }
  )

// Schema para atualizar produto
export const updateProductSchema = createProductSchemaBase.partial()

// Schema para buscar produtos
export const searchProductsSchema = z.object({
  search: z.string().max(200, 'Busca muito longa').optional(),
  category: z.string().max(100).optional(),
  brand: z.string().max(100).optional(),
  isActive: z.coerce.boolean().optional(),
  minPrice: moneySchema.optional(),
  maxPrice: moneySchema.optional(),
  lowStock: z.coerce.boolean().optional(), // Produtos com estoque baixo
  outOfStock: z.coerce.boolean().optional(), // Produtos sem estoque
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.enum(['name', 'price', 'createdAt', 'updatedAt', 'sku']).default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
})

// Schema para ajuste de preço em massa
export const bulkPriceUpdateSchema = z.object({
  productIds: z.array(cuidSchema).min(1, 'Selecione pelo menos um produto').max(100, 'Máximo 100 produtos por vez'),
  adjustmentType: z.enum(['percentage', 'fixed']),
  adjustmentValue: z.number(),
  applyToCost: z.boolean().default(false),
}).refine(
  (data) => {
    if (data.adjustmentType === 'percentage') {
      return data.adjustmentValue >= -100 && data.adjustmentValue <= 100
    }
    return true
  },
  {
    message: 'Percentual deve estar entre -100% e +100%',
    path: ['adjustmentValue'],
  }
)

// Schema para deletar produto (simplificado para API)
export const deleteProductSchema = z.object({
  id: cuidSchema,
})

// Schema para deletar com confirmação (UI)
export const deleteProductConfirmSchema = z.object({
  id: cuidSchema,
  confirmDelete: z.literal(true, {
    errorMap: () => ({ message: 'Confirmação de exclusão obrigatória' }),
  }),
})

// Schema para importação de produtos
export const importProductSchema = z.array(
  z.object({
    sku: skuSchema,
    name: nameSchema,
    barcode: barcodeSchema,
    price: moneySchema,
    cost: moneySchema.optional(),
    category: z.string().max(100).optional(),
    brand: z.string().max(100).optional(),
    description: descriptionSchema,
    minStock: quantitySchema.optional(),
    unit: z.enum(['un', 'kg', 'l', 'cx', 'm', 'pc']).default('un'),
  })
).min(1, 'Importe pelo menos um produto').max(1000, 'Máximo 1000 produtos por importação')
