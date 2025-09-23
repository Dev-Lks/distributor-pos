import { useQueryClient, useQuery } from '@tanstack/react-query'

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
    // Invalidate sales metrics
    queryClient.invalidateQueries({ queryKey: ['sales-metrics'] })
    return sale
  }

  return { createSale }
}

export function useSalesMetrics() {
  return useQuery({
    queryKey: ['sales-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/sales')
      const sales = await res.json()

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
          if (!productCount[item.product.id]) {
            productCount[item.product.id] = {
              name: item.product.name,
              count: 0,
              revenue: 0
            }
          }
          productCount[item.product.id].count += item.quantity
          productCount[item.product.id].revenue += item.price * item.quantity
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