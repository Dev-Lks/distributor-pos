import { useState } from 'react'

export interface SaleItem {
  productId: string
  quantity: number
}

export function useSales() {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const createSale = async (items: SaleItem[]) => {
    setLoading(true)
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const sale = await res.json()
      setSales(prev => [sale, ...prev])
      return sale
    } finally {
      setLoading(false)
    }
  }

  const fetchSales = async () => {
    const res = await fetch('/api/sales')
    const data = await res.json()
    setSales(data)
  }

  return { sales, createSale, fetchSales, loading }
}