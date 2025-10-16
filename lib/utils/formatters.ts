import { formatDocument as baseFormatDocument } from "../documents"

const DEFAULT_PLACEHOLDER = "—"

export interface FormatNumberOptions extends Intl.NumberFormatOptions {
  fallback?: string
  locale?: string
}

export type FormatCurrencyOptions = FormatNumberOptions

export interface FormatPercentageOptions extends FormatNumberOptions {
  multiplyBy100?: boolean
}

export interface FormatDateOptions extends Intl.DateTimeFormatOptions {
  fallback?: string
  locale?: string
}

const defaultCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const defaultNumberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
})

const defaultPercentFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 1,
})

const defaultDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
})

const defaultDateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  hour: "2-digit",
  minute: "2-digit",
})

function resolveNumberFormatter(
  options: FormatNumberOptions | undefined,
  defaults: () => Intl.NumberFormat,
  fallbackStyle: Intl.NumberFormatOptions,
) {
  if (!options) return defaults()
  const { fallback, locale = "pt-BR", ...intlOptions } = options
  return new Intl.NumberFormat(locale, { ...fallbackStyle, ...intlOptions })
}

function resolveDateFormatter(options: FormatDateOptions | undefined, defaults: () => Intl.DateTimeFormat) {
  if (!options) return defaults()
  const { fallback, locale = "pt-BR", ...intlOptions } = options
  return new Intl.DateTimeFormat(locale, { timeZone: "UTC", ...intlOptions })
}

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (!value && value !== 0) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatCurrency(value: number | null | undefined, options?: FormatCurrencyOptions) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return options?.fallback ?? DEFAULT_PLACEHOLDER
  }

  if (!options) {
    return defaultCurrencyFormatter.format(value)
  }

  const formatter = resolveNumberFormatter(options, () => defaultCurrencyFormatter, {
    style: "currency",
    currency: "BRL",
  })

  return formatter.format(value)
}

export function formatNumber(value: number | null | undefined, options?: FormatNumberOptions) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return options?.fallback ?? DEFAULT_PLACEHOLDER
  }

  if (!options) {
    return defaultNumberFormatter.format(value)
  }

  const formatter = resolveNumberFormatter(options, () => defaultNumberFormatter, {})
  return formatter.format(value)
}

export function formatPercentage(value: number | null | undefined, options?: FormatPercentageOptions) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return options?.fallback ?? DEFAULT_PLACEHOLDER
  }

  const shouldDivideBy100 = options?.multiplyBy100 ?? false
  const numericValue = shouldDivideBy100 ? value / 100 : value

  if (!options) {
    return defaultPercentFormatter.format(numericValue)
  }

  const formatter = resolveNumberFormatter(options, () => defaultPercentFormatter, {
    style: "percent",
  })

  return formatter.format(numericValue)
}

export function formatDate(value: Date | string | number | null | undefined, options?: FormatDateOptions) {
  const date = toDate(value)
  if (!date) {
    return options?.fallback ?? DEFAULT_PLACEHOLDER
  }

  if (!options) {
    return defaultDateFormatter.format(date)
  }

  const formatter = resolveDateFormatter(options, () => defaultDateFormatter)
  return formatter.format(date)
}

export function formatDateTime(value: Date | string | number | null | undefined, options?: FormatDateOptions) {
  const date = toDate(value)
  if (!date) {
    return options?.fallback ?? DEFAULT_PLACEHOLDER
  }

  if (!options) {
    return defaultDateTimeFormatter.format(date)
  }

  const formatter = resolveDateFormatter(options, () => defaultDateTimeFormatter)
  return formatter.format(date)
}

export function formatPhone(phone: string | null | undefined, placeholder = DEFAULT_PLACEHOLDER) {
  if (!phone) return placeholder
  const digits = phone.replace(/\D/g, "")

  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  }

  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
  }

  return phone
}

export function formatCEP(cep: string | null | undefined, placeholder = DEFAULT_PLACEHOLDER) {
  if (!cep) return placeholder
  const digits = cep.replace(/\D/g, "")
  if (digits.length !== 8) return cep
  return digits.replace(/(\d{5})(\d{3})/, "$1-$2")
}

export function formatInitials(name: string | null | undefined, placeholder = "") {
  if (!name) return placeholder
  const parts = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
  if (parts.length === 0) return placeholder
  return parts.map((part) => part[0]?.toUpperCase()).join("")
}

export function formatDocumentDisplay(document: string | null | undefined, placeholder = DEFAULT_PLACEHOLDER) {
  const formatted = baseFormatDocument(document)
  return formatted || placeholder
}
