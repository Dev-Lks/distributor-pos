/**
 * Utilitários para sanitização de inputs
 * 
 * Previne XSS, SQL injection e outros ataques
 */

/**
 * Remove caracteres perigosos de strings de busca
 */
export function sanitizeSearchTerm(term: string): string {
  if (!term) return ''
  
  return term
    .trim()
    .replace(/[<>]/g, '') // Remove < >
    .substring(0, 200) // Limita tamanho
}

/**
 * Valida e sanitiza email
 */
export function sanitizeEmail(email: string): string {
  return email
    .toLowerCase()
    .trim()
    .substring(0, 255)
}

/**
 * Remove caracteres não numéricos
 */
export function sanitizeNumericString(str: string): string {
  return str.replace(/\D/g, '')
}

/**
 * Sanitiza string genérica removendo caracteres perigosos
 */
export function sanitizeString(str: string, maxLength: number = 1000): string {
  if (!str) return ''
  
  return str
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, maxLength)
}
