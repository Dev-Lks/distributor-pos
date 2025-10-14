/**
 * Limites de segurança para validação de dados
 * 
 * Estes limites previnem overflow, DoS e garantem integridade dos dados
 */
export const LIMITS = {
  // Quantidades
  MAX_QUANTITY: 999999,
  MAX_PRICE: 9999999.99,
  MAX_DISCOUNT_PERCENTAGE: 100,
  MAX_DISCOUNT_VALUE: 999999.99,
  
  // Strings
  MAX_NAME_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_NOTES_LENGTH: 1000,
  
  // Arrays
  MAX_ITEMS_PER_SALE: 1000,
  MAX_BULK_UPDATE: 100,
  
  // Monetário
  MAX_CREDIT_LIMIT: 1000000,
  MAX_CASH_SESSION_AMOUNT: 100000,
} as const
