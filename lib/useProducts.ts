import { useState, useEffect } from 'react'

export interface Product {
  id: string
  name: string
  size: string
  cost: number
  salePrice: number
  isBonified: boolean
  inventory?: {
    quantity: number
  }
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [])

  return { products, loading }
}