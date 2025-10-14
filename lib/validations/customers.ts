import { z } from 'zod'
import {
  cuidSchema,
  emailSchema,
  phoneSchema,
  cpfSchema,
  cnpjSchema,
  moneySchema,
  nameSchema,
  notesSchema,
} from './common'

// Tipo de cliente
export const customerTypeSchema = z.enum(['INDIVIDUAL', 'BUSINESS'])

// Schema simplificado para o sistema atual (sem CPF/CNPJ validation aqui)
export const createCustomerCurrentSchema = z.object({
  name: nameSchema,
  phone: z.string().trim().max(20).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  document: z.string().trim().max(20).optional().nullable(),
  email: emailSchema.optional().nullable(),
})

export const updateCustomerCurrentSchema = z.object({
  id: cuidSchema,
  name: nameSchema.optional(),
  phone: z.string().trim().max(20).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  document: z.string().trim().max(20).optional().nullable(),
  email: emailSchema.optional().nullable(),
})

export const deleteCustomerCurrentSchema = z.object({
  id: cuidSchema,
})

// Schema de endereço
export const addressSchema = z.object({
  street: z.string().trim().min(3, 'Logradouro obrigatório').max(200),
  number: z.string().trim().max(20),
  complement: z.string().trim().max(100).optional(),
  neighborhood: z.string().trim().max(100, 'Bairro muito longo').optional(),
  city: z.string().trim().min(2, 'Cidade obrigatória').max(100),
  state: z.string().trim().length(2, 'Estado deve ter 2 caracteres (ex: SP)').toUpperCase(),
  zipCode: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido (formato: 99999-999)'),
  country: z.string().trim().default('Brasil'),
}).optional()

// Schema base para cliente
const createCustomerSchemaBase = z.object({
  type: customerTypeSchema.default('INDIVIDUAL'),
  name: nameSchema,
  tradeName: nameSchema.optional(), // Nome fantasia para empresas
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  alternativePhone: phoneSchema.optional(),
  cpf: cpfSchema.optional(),
  cnpj: cnpjSchema.optional(),
  rg: z.string().trim().max(20).optional(),
  birthDate: z.coerce.date().optional(),
  address: addressSchema,
  creditLimit: moneySchema.default(0),
  notes: notesSchema,
  isActive: z.boolean().default(true),
  tags: z.array(z.string().max(50)).max(10, 'Máximo 10 tags').optional(),
})

// Schema para criar cliente com validações
export const createCustomerSchema = createCustomerSchemaBase
  .refine(
    (data) => {
      // Se for pessoa física, CPF é obrigatório
      if (data.type === 'INDIVIDUAL' && !data.cpf) {
        return false
      }
      return true
    },
    {
      message: 'CPF obrigatório para pessoa física',
      path: ['cpf'],
    }
  ).refine(
    (data) => {
      // Se for pessoa jurídica, CNPJ é obrigatório
      if (data.type === 'BUSINESS' && !data.cnpj) {
        return false
      }
      return true
    },
    {
      message: 'CNPJ obrigatório para pessoa jurídica',
      path: ['cnpj'],
    }
  ).refine(
    (data) => {
      // Pessoa física não pode ter CNPJ
      if (data.type === 'INDIVIDUAL' && data.cnpj) {
        return false
      }
      return true
    },
    {
      message: 'Pessoa física não pode ter CNPJ',
      path: ['cnpj'],
    }
  ).refine(
    (data) => {
      // Pessoa jurídica não pode ter CPF ou RG
      if (data.type === 'BUSINESS' && (data.cpf || data.rg)) {
        return false
      }
      return true
    },
    {
      message: 'Pessoa jurídica não pode ter CPF/RG',
      path: ['type'],
    }
  ).refine(
    (data) => {
      // Validar data de nascimento (deve ser passada e pessoa deve ter pelo menos 16 anos)
      if (data.birthDate) {
        const today = new Date()
        const age = today.getFullYear() - data.birthDate.getFullYear()
        const monthDiff = today.getMonth() - data.birthDate.getMonth()
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < data.birthDate.getDate())) {
          return age > 16
        }
        
        return age >= 16
      }
      return true
    },
    {
      message: 'Cliente deve ter pelo menos 16 anos',
      path: ['birthDate'],
    }
  )

// Schema para atualizar cliente
export const updateCustomerSchema = createCustomerSchemaBase.partial()

// Schema para buscar clientes
export const searchCustomersSchema = z.object({
  search: z.string().max(200).optional(), // Busca por nome, email, CPF, CNPJ
  type: customerTypeSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  hasDebt: z.coerce.boolean().optional(), // Clientes com débito
  tag: z.string().max(50).optional(), // Filtrar por tag
  city: z.string().max(100).optional(),
  state: z.string().length(2).toUpperCase().optional(),
  minCreditLimit: moneySchema.optional(),
  maxCreditLimit: moneySchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.enum(['name', 'createdAt', 'creditLimit', 'totalPurchases']).default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
})

// Schema para ajuste de limite de crédito
export const creditLimitAdjustmentSchema = z.object({
  customerId: cuidSchema,
  newLimit: moneySchema.max(1000000, 'Limite máximo: R$ 1.000.000'),
  reason: z.string().min(10, 'Motivo obrigatório (mín. 10 caracteres)').max(500),
  approvedBy: cuidSchema.optional(), // ID do usuário que aprovou
})

// Schema para bonificação/desconto de cliente
export const customerBonificationSchema = z.object({
  customerId: cuidSchema,
  type: z.enum(['DISCOUNT_PERCENTAGE', 'DISCOUNT_FIXED', 'CASHBACK', 'POINTS']),
  value: z.number().min(0),
  description: z.string().trim().min(5).max(200),
  validFrom: z.coerce.date().default(() => new Date()),
  validUntil: z.coerce.date().optional(),
  isActive: z.boolean().default(true),
  applicableProducts: z.array(cuidSchema).optional(), // Se vazio, vale para todos
  applicableCategories: z.array(z.string()).optional(),
  minPurchaseAmount: moneySchema.optional(), // Valor mínimo de compra para aplicar
}).refine(
  (data) => {
    if (data.validUntil) {
      return data.validUntil > data.validFrom
    }
    return true
  },
  {
    message: 'Data final deve ser maior que a data inicial',
    path: ['validUntil'],
  }
).refine(
  (data) => {
    // Se for desconto percentual, limite a 100%
    if (data.type === 'DISCOUNT_PERCENTAGE') {
      return data.value <= 100
    }
    return true
  },
  {
    message: 'Desconto percentual não pode exceder 100%',
    path: ['value'],
  }
)

// Schema para relatório de clientes
export const customerReportSchema = z.object({
  type: customerTypeSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  includeInactive: z.coerce.boolean().default(false),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  reportType: z.enum(['summary', 'detailed', 'purchases', 'debt', 'loyalty']).default('summary'),
  city: z.string().max(100).optional(),
  state: z.string().length(2).toUpperCase().optional(),
})

// Schema para importação de clientes
export const importCustomerSchema = z.array(
  z.object({
    type: customerTypeSchema,
    name: nameSchema,
    email: emailSchema.optional(),
    phone: z.string().optional(), // Será validado e formatado na importação
    cpf: z.string().optional(),
    cnpj: z.string().optional(),
    creditLimit: z.number().default(0),
    notes: z.string().max(1000).optional(),
  })
).min(1, 'Importe pelo menos um cliente').max(500, 'Máximo 500 clientes por importação')

// Schema para deletar cliente (com verificação)
export const deleteCustomerSchema = z.object({
  id: cuidSchema,
  transferSalesTo: cuidSchema.optional(), // Para transferir vendas antigas para outro cliente
  confirmDelete: z.literal(true, {
    errorMap: () => ({ message: 'Confirmação de exclusão obrigatória' }),
  }),
})

// Schema para histórico de compras do cliente
export const customerPurchaseHistorySchema = z.object({
  customerId: cuidSchema,
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  minAmount: moneySchema.optional(),
  maxAmount: moneySchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.enum(['date', 'amount']).default('date'),
  order: z.enum(['asc', 'desc']).default('desc'),
})
