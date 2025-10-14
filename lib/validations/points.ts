/**
 * Validações Zod para Pontos de Venda
 */

import { z } from 'zod'

export const createPointOfSaleSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  
  isActive: z.boolean().default(true),
  
  address: z.string()
    .trim()
    .max(200, 'Endereço deve ter no máximo 200 caracteres')
    .optional()
    .nullable(),
  
  city: z.string()
    .trim()
    .max(100, 'Cidade deve ter no máximo 100 caracteres')
    .optional()
    .nullable(),
  
  state: z.string()
    .trim()
    .length(2, 'Estado deve ter 2 caracteres (UF)')
    .toUpperCase()
    .optional()
    .nullable(),
})

export const updatePointOfSaleSchema = z.object({
  id: z.string().uuid('ID do ponto de venda inválido'),
  
  name: z.string()
    .trim()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .optional(),
  
  isActive: z.boolean().optional(),
  
  address: z.string()
    .trim()
    .max(200, 'Endereço deve ter no máximo 200 caracteres')
    .optional()
    .nullable(),
  
  city: z.string()
    .trim()
    .max(100, 'Cidade deve ter no máximo 100 caracteres')
    .optional()
    .nullable(),
  
  state: z.string()
    .trim()
    .length(2, 'Estado deve ter 2 caracteres (UF)')
    .toUpperCase()
    .optional()
    .nullable(),
})

export const deletePointOfSaleSchema = z.object({
  id: z.string().uuid('ID do ponto de venda inválido'),
})

export type CreatePointOfSaleInput = z.infer<typeof createPointOfSaleSchema>
export type UpdatePointOfSaleInput = z.infer<typeof updatePointOfSaleSchema>
export type DeletePointOfSaleInput = z.infer<typeof deletePointOfSaleSchema>
