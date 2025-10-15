import { z } from 'zod'

// Validadores reutilizáveis
export const cuidSchema = z.string().cuid('ID inválido')

export const emailSchema = z.string()
  .email('E-mail inválido')
  .toLowerCase()
  .trim()
  .max(255, 'E-mail muito longo')

export const phoneSchema = z.string()
  .regex(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$/, 'Telefone inválido')
  .transform(val => val.replace(/\D/g, ''))

/**
 * Validação de CPF com dígito verificador
 */
function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '')
  
  if (cleanCPF.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false // Todos dígitos iguais
  
  // Validar primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(cleanCPF.charAt(9))) return false
  
  // Validar segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(cleanCPF.charAt(10))) return false
  
  return true
}

/**
 * Validação de CNPJ com dígito verificador
 */
function validateCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, '')
  
  if (cleanCNPJ.length !== 14) return false
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false // Todos dígitos iguais
  
  // Validar primeiro dígito verificador
  let sum = 0
  let weight = 5
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight
    weight = weight === 2 ? 9 : weight - 1
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (digit !== parseInt(cleanCNPJ.charAt(12))) return false
  
  // Validar segundo dígito verificador
  sum = 0
  weight = 6
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight
    weight = weight === 2 ? 9 : weight - 1
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (digit !== parseInt(cleanCNPJ.charAt(13))) return false
  
  return true
}

export const cpfSchema = z.string()
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido (formato: 999.999.999-99)')
  .refine(validateCPF, 'CPF inválido')

export const cnpjSchema = z.string()
  .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido (formato: 99.999.999/9999-99)')
  .refine(validateCNPJ, 'CNPJ inválido')

export const moneySchema = z.coerce.number()
  .min(0, 'Valor não pode ser negativo')
  .max(9999999.99, 'Valor muito alto')
  .multipleOf(0.01, 'Máximo 2 casas decimais')

export const quantitySchema = z.coerce.number()
  .int('Quantidade deve ser inteira')
  .min(0, 'Quantidade não pode ser negativa')
  .max(999999, 'Quantidade excede limite')

export const percentageSchema = z.number()
  .min(0, 'Percentual não pode ser negativo')
  .max(100, 'Percentual não pode exceder 100%')

// Validações de data
export const futureDateSchema = z.coerce.date()
  .refine(date => date > new Date(), 'Data deve ser futura')

export const pastDateSchema = z.coerce.date()
  .refine(date => date < new Date(), 'Data deve ser passada')

// Paginação
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
})

// Validações de string com limites
export const nameSchema = z.string()
  .trim()
  .min(2, 'Nome deve ter no mínimo 2 caracteres')
  .max(200, 'Nome muito longo')

export const descriptionSchema = z.string()
  .trim()
  .max(5000, 'Descrição muito longa')
  .optional()

export const notesSchema = z.string()
  .trim()
  .max(1000, 'Notas muito longas')
  .optional()

// SKU / Código de barras
export const skuSchema = z.string()
  .trim()
  .min(1, 'SKU obrigatório')
  .max(100, 'SKU muito longo')
  .regex(/^[A-Z0-9\-_]+$/i, 'SKU deve conter apenas letras, números, - e _')

export const barcodeSchema = z.string()
  .trim()
  .regex(/^\d+$/, 'Código de barras deve conter apenas números')
  .min(8, 'Código de barras muito curto')
  .max(14, 'Código de barras muito longo')
  .optional()

// URLs
export const urlSchema = z.string()
  .url('URL inválida')
  .max(2000, 'URL muito longa')
  .optional()

// Coordenadas geográficas
export const latitudeSchema = z.number()
  .min(-90, 'Latitude inválida')
  .max(90, 'Latitude inválida')

export const longitudeSchema = z.number()
  .min(-180, 'Longitude inválida')
  .max(180, 'Longitude inválida')
