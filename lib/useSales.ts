import { useQueryClient, useQuery } from '@tanstack/react-query'
import { addSale, getAllSales } from './salesDB'
import { useProducts } from './useProducts'
import type { Product } from './useProducts'

export interface SaleItem {
  productId: string
  quantity: number
  productName?: string
  price?: number
}

export function useSales() {
  const queryClient = useQueryClient()
  const { data: products = [] } = useProducts()

  const createSale = async (items: SaleItem[]) => {
    // Enrich items with product data
    const enrichedItems = items.map(item => {
      const product = products.find((p: Product) => p.id === item.productId)
      return {
        ...item,
        productName: product?.name || 'Unknown',
        price: product?.salePrice || 0
      }
    })

    // Calculate total
    const total = enrichedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // Check stock (client-side validation)
    for (const item of enrichedItems) {
      const product = products.find((p: Product) => p.id === item.productId)
      const availableStock = product?.inventory?.salePointQuantity ?? 0
      if (availableStock < item.quantity) {
        throw new Error(`Estoque insuficiente para ${product?.name}. Disponível: ${availableStock}, Solicitado: ${item.quantity}`)
      }
    }

    // Save to IndexedDB
    const id = await addSale({
      date: new Date(),
      total,
      items: enrichedItems
    })

    // Invalidate caches
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey: ['sales-metrics'] })

    return { id, total, items: enrichedItems }
  }

  return { createSale }
}

export function useSalesMetrics() {
  return useQuery({
    queryKey: ['sales-metrics'],
    queryFn: async () => {
      const sales = await getAllSales()

      // Calculate metrics
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todaySales = sales.filter((sale: any) => new Date(sale.date) >= today)
      const totalToday = todaySales.reduce((sum: number, sale: any) => sum + sale.total, 0)

      // Sales by hour (last 24 hours)
      const hourlyData = []
      for (let i = 23; i >= 0; i--) {
        const hour = new Date()
        hour.setHours(hour.getHours() - i, 0, 0, 0)
        const hourEnd = new Date(hour)
        hourEnd.setHours(hour.getHours() + 1)

        const hourSales = sales.filter((sale: any) => {
          const saleDate = new Date(sale.date)
          return saleDate >= hour && saleDate < hourEnd
        })

        hourlyData.push({
          hour: hour.getHours(),
          sales: hourSales.length,
          revenue: hourSales.reduce((sum: number, sale: any) => sum + sale.total, 0)
        })
      }

      // Top products
      const productCount: { [key: string]: { name: string; count: number; revenue: number } } = {}
      sales.forEach((sale: any) => {
        sale.items.forEach((item: any) => {
          if (!productCount[item.productId]) {
            productCount[item.productId] = {
              name: item.productName || 'Unknown',
              count: 0,
              revenue: 0
            }
          }
          productCount[item.productId].count += item.quantity
          productCount[item.productId].revenue += (item.price || 0) * item.quantity
        })
      })

      const topProducts = Object.values(productCount)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5)

      return {
        totalToday,
        salesCount: sales.length,
        hourlyData,
        topProducts
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}