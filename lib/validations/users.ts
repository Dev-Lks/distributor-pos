/**
 * Validações Zod para Usuários
 * 
 * Schemas de validação para operações de CRUD de usuários do sistema.
 */

import { z } from 'zod'
import { emailSchema, cpfSchema } from './common'

/**
 * Schema para criar novo usuário
 */
export const createUserSchema = z.object({
  fullName: z.string()
    .trim()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  
  email: emailSchema,
  
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  
  phone: z.string()
    .trim()
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .optional()
    .nullable(),
  
  cpf: cpfSchema.optional().nullable(),
  
  isAdmin: z.boolean().default(false),
  
  pointsOfSaleIds: z.array(z.string().uuid('ID de ponto de venda inválido'))
    .min(1, 'Selecione pelo menos um ponto de venda')
    .max(10, 'Máximo de 10 pontos de venda'),
  
  permissions: z.array(z.string()).optional(),
})

/**
 * Schema para atualizar usuário existente
 */
export const updateUserSchema = z.object({
  id: z.string().uuid('ID do usuário inválido'),
  
  fullName: z.string()
    .trim()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .optional(),
  
  email: emailSchema.optional(),
  
  phone: z.string()
    .trim()
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .optional()
    .nullable(),
  
  cpf: cpfSchema.optional().nullable(),
  
  isAdmin: z.boolean().optional(),
  
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  
  pointsOfSaleIds: z.array(z.string().uuid('ID de ponto de venda inválido'))
    .min(1, 'Selecione pelo menos um ponto de venda')
    .max(10, 'Máximo de 10 pontos de venda')
    .optional(),
  
  permissions: z.array(z.string()).optional(),
})

/**
 * Schema para deletar usuário
 */
export const deleteUserSchema = z.object({
  id: z.string().uuid('ID do usuário inválido'),
})

/**
 * Schema para alterar senha de usuário
 */
export const changePasswordSchema = z.object({
  id: z.string().uuid('ID do usuário inválido'),
  
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  
  newPassword: z.string()
    .min(8, 'Nova senha deve ter no mínimo 8 caracteres')
    .max(100, 'Nova senha deve ter no máximo 100 caracteres')
    .regex(/[A-Z]/, 'Nova senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Nova senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Nova senha deve conter pelo menos um número'),
  
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

/**
 * Schema para buscar usuários
 */
export const searchUsersSchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  isAdmin: z.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

/**
 * Tipos inferidos dos schemas
 */
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type DeleteUserInput = z.infer<typeof deleteUserSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type SearchUsersInput = z.infer<typeof searchUsersSchema>
