import { z } from 'zod'
import {
  cuidSchema,
  quantitySchema,
  notesSchema,
} from './common'

// Localizações do inventário
export const inventoryLocationSchema = z.enum([
  'coldRoom',
  'house',
  'salePoint',
  'warehouse',
  'transit'
])

// Tipo de movimentação
export const inventoryMovementTypeSchema = z.enum([
  'PURCHASE',      // Compra
  'SALE',          // Venda
  'TRANSFER',      // Transferência
  'ADJUSTMENT',    // Ajuste manual
  'LOSS',          // Perda/quebra
  'RETURN',        // Devolução
  'PRODUCTION',    // Produção
  'CONSUMPTION'    // Consumo interno
])

// Schema para adicionar/remover estoque
export const inventoryUpdateSchema = z.object({
  productId: cuidSchema,
  location: inventoryLocationSchema,
  quantity: quantitySchema,
  notes: notesSchema,
})

// Schema para ajuste de estoque (pode ser negativo)
export const inventoryAdjustmentSchema = z.object({
  productId: cuidSchema,
  location: inventoryLocationSchema,
  adjustment: z.number()
    .min(-999999, 'Ajuste mínimo: -999,999')
    .max(999999, 'Ajuste máximo: +999,999'),
  reason: z.string().min(5, 'Motivo obrigatório (mín. 5 caracteres)').max(500),
  movementType: inventoryMovementTypeSchema.default('ADJUSTMENT'),
})

// Schema para transferência entre localizações
export const inventoryTransferSchema = z.object({
  productId: cuidSchema,
  fromLocation: inventoryLocationSchema,
  toLocation: inventoryLocationSchema,
  quantity: quantitySchema.min(0.01, 'Quantidade mínima: 0.01'),
  notes: notesSchema,
}).refine(
  (data) => data.fromLocation !== data.toLocation,
  {
    message: 'Origem e destino devem ser diferentes',
    path: ['toLocation'],
  }
)

// Schema para buscar inventário
export const searchInventorySchema = z.object({
  productId: cuidSchema.optional(),
  location: inventoryLocationSchema.optional(),
  lowStock: z.coerce.boolean().optional(), // Produtos abaixo do mínimo
  outOfStock: z.coerce.boolean().optional(), // Produtos zerados
  category: z.string().max(100).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.enum(['product', 'quantity', 'location', 'updatedAt']).default('product'),
  order: z.enum(['asc', 'desc']).default('asc'),
})

// Schema para atualização em massa
export const bulkInventoryUpdateSchema = z.object({
  updates: z.array(
    z.object({
      productId: cuidSchema,
      location: inventoryLocationSchema,
      quantity: quantitySchema,
    })
  ).min(1, 'Selecione pelo menos um item').max(100, 'Máximo 100 itens por vez'),
  notes: notesSchema,
  movementType: inventoryMovementTypeSchema.default('ADJUSTMENT'),
})

// Schema para contagem de inventário
export const inventoryCountSchema = z.object({
  location: inventoryLocationSchema,
  counts: z.array(
    z.object({
      productId: cuidSchema,
      countedQuantity: quantitySchema,
      systemQuantity: quantitySchema.optional(), // Para comparação
      difference: z.number().optional(), // Diferença encontrada
    })
  ).min(1, 'Conte pelo menos um produto'),
  notes: notesSchema,
  countedBy: cuidSchema.optional(), // ID do usuário que fez a contagem
  countDate: z.coerce.date().default(() => new Date()),
})

// Schema para histórico de movimentações
export const inventoryHistorySchema = z.object({
  productId: cuidSchema.optional(),
  location: inventoryLocationSchema.optional(),
  movementType: inventoryMovementTypeSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  userId: cuidSchema.optional(), // Quem fez a movimentação
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.enum(['date', 'product', 'quantity', 'type']).default('date'),
  order: z.enum(['asc', 'desc']).default('desc'),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.endDate >= data.startDate
    }
    return true
  },
  {
    message: 'Data final deve ser maior ou igual à data inicial',
    path: ['endDate'],
  }
)

// Schema para relatório de estoque
export const inventoryReportSchema = z.object({
  location: inventoryLocationSchema.optional(),
  category: z.string().max(100).optional(),
  includeInactive: z.coerce.boolean().default(false),
  includeZeroStock: z.coerce.boolean().default(false),
  onlyLowStock: z.coerce.boolean().default(false),
  reportType: z.enum(['summary', 'detailed', 'valuation', 'turnover']).default('summary'),
  startDate: z.coerce.date().optional(), // Para cálculo de giro
  endDate: z.coerce.date().optional(),
})

// Schema para importação de inventário
export const importInventorySchema = z.array(
  z.object({
    productSku: z.string().trim().min(1, 'SKU obrigatório'),
    location: inventoryLocationSchema,
    quantity: quantitySchema,
    notes: notesSchema,
  })
).min(1, 'Importe pelo menos um item').max(1000, 'Máximo 1000 itens por importação')

// Schema para alerta de estoque baixo
export const stockAlertSchema = z.object({
  productId: cuidSchema,
  location: inventoryLocationSchema,
  minStock: quantitySchema,
  notifyUsers: z.array(cuidSchema).min(1, 'Selecione pelo menos um usuário para notificar'),
  enabled: z.boolean().default(true),
})
