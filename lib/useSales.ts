import { useQueryClient } from '@tanstack/react-query'

export interface SaleItem {
  productId: string
  quantity: number
}

export function useSales() {
  const queryClient = useQueryClient()

  const createSale = async (items: SaleItem[]) => {
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
    const sale = await res.json()
    // Invalidate products cache to refresh inventory
    queryClient.invalidateQueries({ queryKey: ['products'] })
    return sale
  }

  return { createSale }
}