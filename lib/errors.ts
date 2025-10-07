/**
 * Sistema de tratamento de erros personalizado
 * 
 * Uso:
 * ```typescript
 * import { AppError, ValidationError, NotFoundError, handleError } from '@/lib/errors'
 * 
 * // Lançar erro
 * throw new ValidationError('Email inválido')
 * throw new NotFoundError('Produto')
 * 
 * // Tratar erro
 * try {
 *   // ...
 * } catch (error) {
 *   const { message, code } = handleError(error)
 *   return { error: message }
 * }
 * ```
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'INTERNAL_ERROR',
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
    
    // Mantém o stack trace correto
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
    
    if (field) {
      this.code = `VALIDATION_ERROR:${field}`
    }
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} não encontrado`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Não autorizado') {
    super(message, 'UNAUTHORIZED', 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado') {
    super(message, 'FORBIDDEN', 403)
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409)
    this.name = 'ConflictError'
  }
}

/**
 * Helper para tratar erros de forma consistente
 * Converte qualquer erro em um formato padronizado
 */
export function handleError(error: unknown): { 
  message: string
  code: string
  statusCode?: number
} {
  // Erro customizado da aplicação
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    }
  }

  // Erro padrão do JavaScript
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
    }
  }

  // Erro desconhecido (string, objeto, etc)
  return {
    message: 'Erro desconhecido',
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
  }
}

/**
 * Helper para verificar se é um erro conhecido
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}
