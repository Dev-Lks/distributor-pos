// Validações comuns
export * from './common'

// Validações específicas por módulo
export * from './products'
export * from './sales'
export * from './inventory'
export * from './customers'
export * from './users'
export * from './points'

// Re-exportar tipos úteis
export type { z } from 'zod'
