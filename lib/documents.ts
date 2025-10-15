import { PersonType } from "@prisma/client"

export function sanitizeDocument(document?: string | null): string | undefined {
  if (!document) return undefined
  const sanitized = document.replace(/\D+/g, "")
  return sanitized.length > 0 ? sanitized : undefined
}

export function detectPersonType(document?: string | null): PersonType {
  const sanitized = sanitizeDocument(document)
  if (!sanitized) return PersonType.INDIVIDUAL
  return sanitized.length > 11 ? PersonType.COMPANY : PersonType.INDIVIDUAL
}

export function validateCpfCnpj(document?: string | null): boolean {
  const sanitized = sanitizeDocument(document)
  if (!sanitized) return true
  if (sanitized.length <= 11) {
    return validateCPF(sanitized)
  }
  return validateCNPJ(sanitized)
}

function validateCPF(value: string): boolean {
  if (!/\d{11}/.test(value)) return false
  if (/^(\d)\1+$/.test(value)) return false
  const digits = value.split("").map(Number)
  for (let j = 9; j < 11; j++) {
    let sum = 0
    for (let i = 0; i < j; i++) {
      sum += digits[i] * (j + 1 - i)
    }
    const calc = (sum * 10) % 11
    if ((calc === 10 ? 0 : calc) !== digits[j]) {
      return false
    }
  }
  return true
}

function validateCNPJ(value: string): boolean {
  if (!/\d{14}/.test(value)) return false
  if (/^(\d)\1+$/.test(value)) return false
  const digits = value.split("").map(Number)
  const validators = [
    { length: 12, weights: [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] },
    { length: 13, weights: [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] },
  ]

  for (const validator of validators) {
    let sum = 0
    for (let i = 0; i < validator.length; i++) {
      sum += digits[i] * validator.weights[i]
    }
    const remainder = sum % 11
    const calc = remainder < 2 ? 0 : 11 - remainder
    if (calc !== digits[validator.length]) {
      return false
    }
  }

  return true
}

export function formatDocument(document?: string | null): string {
  const sanitized = sanitizeDocument(document)
  if (!sanitized) return ""
  
  // CPF: 000.000.000-00
  if (sanitized.length === 11) {
    return sanitized.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }
  
  // CNPJ: 00.000.000/0000-00
  if (sanitized.length === 14) {
    return sanitized.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  }
  
  return sanitized
}
