/**
 * Tipos para respostas da API
 */

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  hasMore: boolean
}

export interface ApiError {
  error: string
  code?: string
  statusCode?: number
  details?: unknown
}
