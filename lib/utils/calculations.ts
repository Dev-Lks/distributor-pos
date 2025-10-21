/**
 * Generic helper to sum numeric values from a collection using an accessor.
 * Guards against NaN values so downstream calculations stay reliable.
 */
export function sumBy<T>(collection: ReadonlyArray<T>, accessor: (item: T) => number): number {
  if (!Array.isArray(collection) || collection.length === 0) {
    return 0
  }

  return collection.reduce((total, item) => {
    const value = Number(accessor(item))
    if (Number.isFinite(value)) {
      return total + value
    }
    return total
  }, 0)
}

export interface QuantityLike {
  quantity: number
}

export interface PricedItem extends QuantityLike {
  price: number
}

export interface DiscountedItem extends PricedItem {
  discount?: number | null
}

export function calculateCartSubtotal<T extends PricedItem>(items: ReadonlyArray<T>): number {
  return sumBy(items, (item) => item.price * item.quantity)
}

export function calculateCartItemCount<T extends QuantityLike>(items: ReadonlyArray<T>): number {
  return sumBy(items, (item) => item.quantity)
}

export function calculateCartDiscount<T extends DiscountedItem>(items: ReadonlyArray<T>): number {
  return sumBy(items, (item) => (item.discount && Number.isFinite(item.discount) ? Number(item.discount) : 0))
}

export function calculateCartSummary<T extends DiscountedItem>(items: ReadonlyArray<T>) {
  const subtotal = calculateCartSubtotal(items)
  const totalDiscount = calculateCartDiscount(items)
  const itemCount = calculateCartItemCount(items)

  return {
    subtotal,
    totalDiscount,
    itemCount,
    total: subtotal - totalDiscount,
  }
}

export function average(values: ReadonlyArray<number>, fallback = 0): number {
  if (!Array.isArray(values) || values.length === 0) {
    return fallback
  }

  const total = sumBy(values, (value) => value)
  return values.length > 0 ? total / values.length : fallback
}

