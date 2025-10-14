import { z } from 'zod'
import {
  cuidSchema,
  moneySchema,
  quantitySchema,
  percentageSchema,
  notesSchema,
} from './common'

// Métodos de pagamento
export const paymentMethodSchema = z.enum([
  'CASH',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'PIX',
  'TRANSFER',
  'CHECK',
  'VOUCHER',
  'OTHER'
])

// Status da venda
export const saleStatusSchema = z.enum([
  'PENDING',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
  'PARTIAL_REFUND'
])

// Item de venda
export const saleItemSchema = z.object({
  productId: cuidSchema,
  quantity: quantitySchema.min(0.01, 'Quantidade mínima: 0.01'),
  unitPrice: moneySchema,
  discount: moneySchema.default(0),
  subtotal: moneySchema,
})

// Validar que subtotal está correto
const validateSaleItem = (item: z.infer<typeof saleItemSchema>) => {
  const expectedSubtotal = (item.quantity * item.unitPrice) - item.discount
  return Math.abs(expectedSubtotal - item.subtotal) < 0.01 // Margem de 1 centavo para arredondamento
}

export const validatedSaleItemSchema = saleItemSchema.refine(
  validateSaleItem,
  {
    message: 'Subtotal não corresponde ao cálculo (quantidade × preço - desconto)',
    path: ['subtotal'],
  }
)

// Pagamento
export const paymentSchema = z.object({
  method: paymentMethodSchema,
  amount: moneySchema.min(0.01, 'Valor mínimo: R$ 0.01'),
  cardLastDigits: z.string().regex(/^\d{4}$/).optional(), // Últimos 4 dígitos do cartão
  installments: z.number().int().min(1).max(24).default(1), // Parcelas
  transactionId: z.string().max(100).optional(), // ID da transação PIX, cartão, etc
})

// Schema para criar venda
export const createSaleSchema = z.object({
  customerId: cuidSchema.optional(),
  pointOfSaleId: cuidSchema,
  items: z.array(validatedSaleItemSchema)
    .min(1, 'Venda deve ter pelo menos 1 item')
    .max(1000, 'Máximo 1000 itens por venda'),
  payments: z.array(paymentSchema)
    .min(1, 'Venda deve ter pelo menos 1 forma de pagamento'),
  subtotal: moneySchema,
  discount: moneySchema.default(0),
  discountPercentage: percentageSchema.optional(),
  tax: moneySchema.default(0),
  total: moneySchema,
  notes: notesSchema,
  cashSessionId: cuidSchema.optional(),
}).refine(
  (data) => {
    // Validar que o subtotal bate com a soma dos itens
    const itemsSubtotal = data.items.reduce((sum, item) => sum + item.subtotal, 0)
    return Math.abs(itemsSubtotal - data.subtotal) < 0.01
  },
  {
    message: 'Subtotal não corresponde à soma dos itens',
    path: ['subtotal'],
  }
).refine(
  (data) => {
    // Validar que o total bate com subtotal - desconto + taxa
    const expectedTotal = data.subtotal - data.discount + data.tax
    return Math.abs(expectedTotal - data.total) < 0.01
  },
  {
    message: 'Total não corresponde ao cálculo (subtotal - desconto + taxa)',
    path: ['total'],
  }
).refine(
  (data) => {
    // Validar que o total pago bate com o total da venda
    const totalPaid = data.payments.reduce((sum, payment) => sum + payment.amount, 0)
    return Math.abs(totalPaid - data.total) < 0.01
  },
  {
    message: 'Total pago não corresponde ao total da venda',
    path: ['payments'],
  }
).refine(
  (data) => {
    // Se discount percentage foi fornecido, validar que está correto
    if (data.discountPercentage) {
      const expectedDiscount = data.subtotal * (data.discountPercentage / 100)
      return Math.abs(expectedDiscount - data.discount) < 0.01
    }
    return true
  },
  {
    message: 'Desconto percentual não corresponde ao valor de desconto',
    path: ['discountPercentage'],
  }
)

// Schema para buscar vendas
export const searchSalesSchema = z.object({
  customerId: cuidSchema.optional(),
  pointOfSaleId: cuidSchema.optional(),
  cashSessionId: cuidSchema.optional(),
  status: saleStatusSchema.optional(),
  paymentMethod: paymentMethodSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  minTotal: moneySchema.optional(),
  maxTotal: moneySchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.enum(['createdAt', 'total', 'customer']).default('createdAt'),
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

// Schema para cancelar/reembolsar venda
export const cancelSaleSchema = z.object({
  id: cuidSchema,
  reason: z.string().min(10, 'Motivo deve ter pelo menos 10 caracteres').max(500, 'Motivo muito longo'),
  refundAmount: moneySchema.optional(), // Para reembolso parcial
  confirmCancel: z.literal(true, {
    errorMap: () => ({ message: 'Confirmação de cancelamento obrigatória' }),
  }),
})

// Schema para relatório de vendas
export const salesReportSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  groupBy: z.enum(['day', 'week', 'month', 'product', 'customer', 'pointOfSale']).default('day'),
  pointOfSaleId: cuidSchema.optional(),
  customerId: cuidSchema.optional(),
  paymentMethod: paymentMethodSchema.optional(),
  includeRefunded: z.coerce.boolean().default(false),
}).refine(
  (data) => data.endDate >= data.startDate,
  {
    message: 'Data final deve ser maior ou igual à data inicial',
    path: ['endDate'],
  }
).refine(
  (data) => {
    // Limitar período máximo a 1 ano
    const diffTime = Math.abs(data.endDate.getTime() - data.startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 365
  },
  {
    message: 'Período máximo de relatório: 1 ano',
    path: ['endDate'],
  }
)
