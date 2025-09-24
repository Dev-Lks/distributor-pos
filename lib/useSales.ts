import { useQueryClient, useQuery } from '@tanstack/react-query'
import { useProducts } from './useProducts'
import type { Product } from './useProducts'
import { sheetsBackup, type SaleData } from './googleSheets'

export interface SaleItem {
  productId: string
  quantity: number
  productName?: string
  price?: number
}

export interface CreateSaleParams {
  items: SaleItem[]
  paymentMethod?: 'cash' | 'card' | 'pix' | 'other'
  customerName?: string
}

export function useSales(pointOfSale?: string) {
  const queryClient = useQueryClient()
  const { data: products = [] } = useProducts()

  const createSale = async ({ items, paymentMethod, customerName }: CreateSaleParams) => {
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
      let availableStock = 0

      // Find the point of sale by ID and get the stock for this product
      const productPointOfSale = product?.productPointsOfSale?.find(
        (pps: any) => pps.pointOfSale.id === pointOfSale
      )

      if (productPointOfSale) {
        availableStock = productPointOfSale.quantity
      } else {
        // Fallback to general sale point quantity if no specific point stock found
        availableStock = product?.inventory?.salePointQuantity ?? 0
      }

      if (availableStock < item.quantity) {
        throw new Error(`Estoque insuficiente para ${product?.name}. Disponível: ${availableStock}, Solicitado: ${item.quantity}`)
      }
    }

    // Create sale data
    const saleData: SaleData = {
      id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date(),
      total,
      paymentMethod,
      customerName,
      items: enrichedItems
    }

    // Save to database
    const response = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: enrichedItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod,
        customerName,
        pointOfSaleId: pointOfSale
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to save sale: ${error}`)
    }

    const newSale = await response.json()

    // Try to backup to Google Sheets (async, don't block)
    try {
      const backupSuccess = await sheetsBackup.saveSale(saleData, pointOfSale || 'default')
      if (backupSuccess) {
        console.log('✅ Venda backupada no Google Sheets')
      } else {
        console.warn('⚠️ Falha no backup do Google Sheets (dados seguros no banco)')
      }
    } catch (error) {
      console.warn('⚠️ Erro no backup do Google Sheets:', error)
    }

    // Invalidate caches
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey: ['sales-metrics'] })

    return newSale
  }

  const backupAllSales = async () => {
    try {
      const response = await fetch('/api/sales')
      if (!response.ok) throw new Error('Failed to fetch sales')
      const dbSales = await response.json()
      let successCount = 0
      let errorCount = 0

      for (const sale of dbSales) {
        try {
          const saleData: SaleData = {
            id: sale.id,
            date: new Date(sale.date),
            total: sale.total,
            paymentMethod: sale.paymentMethod || 'Não informado',
            customerName: sale.customerName,
            items: sale.items.map((item: any) => ({
              productId: item.productId,
              productName: item.product?.name || 'Produto',
              quantity: item.quantity,
              price: item.price
            }))
          }

          const success = await sheetsBackup.saveSale(saleData, pointOfSale || 'default')
          if (success) successCount++
          else errorCount++
        } catch (error) {
          errorCount++
          console.error('Erro ao backupar venda:', sale.id, error)
        }
      }

      return { successCount, errorCount, total: dbSales.length }
    } catch (error) {
      console.error('Erro no backup geral:', error)
      throw error
    }
  }

  const getSheetsSummary = async () => {
    try {
      return await sheetsBackup.getSalesSummary()
    } catch (error) {
      console.error('Erro ao buscar resumo do Sheets:', error)
      return { totalSales: 0, totalRevenue: 0, todaySales: 0, todayRevenue: 0 }
    }
  }

  return { createSale, backupAllSales, getSheetsSummary }
}

export function useSalesMetrics(period: 'today' | 'week' | 'month' | 'year' = 'today', pointOfSale: string = 'all') {
  return useQuery({
    queryKey: ['sales-metrics', period, pointOfSale],
    queryFn: async () => {
      const sales = await sheetsBackup.getAllSales(pointOfSale)

      // Calculate date range based on period
      const now = new Date()
      let startDate: Date

      switch (period) {
        case 'today':
          startDate = new Date(now)
          startDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          startDate = new Date(now)
          startDate.setDate(now.getDate() - 7)
          startDate.setHours(0, 0, 0, 0)
          break
        case 'month':
          startDate = new Date(now)
          startDate.setMonth(now.getMonth() - 1)
          startDate.setHours(0, 0, 0, 0)
          break
        case 'year':
          startDate = new Date(now)
          startDate.setFullYear(now.getFullYear() - 1)
          startDate.setHours(0, 0, 0, 0)
          break
        default:
          startDate = new Date(now)
          startDate.setHours(0, 0, 0, 0)
      }

      // Filter sales by period
      const periodSales = sales.filter((sale: any) => new Date(sale.date) >= startDate)
      const totalToday = periodSales.reduce((sum: number, sale: any) => sum + sale.total, 0)

      // Sales by hour (last 24 hours for today, or aggregated for longer periods)
      const hourlyData = []
      if (period === 'today') {
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
      } else {
        // For longer periods, aggregate by day
        const days = period === 'week' ? 7 : period === 'month' ? 30 : 365
        for (let i = days - 1; i >= 0; i--) {
          const day = new Date(now)
          day.setDate(now.getDate() - i)
          day.setHours(0, 0, 0, 0)
          const dayEnd = new Date(day)
          dayEnd.setDate(day.getDate() + 1)

          const daySales = periodSales.filter((sale: any) => {
            const saleDate = new Date(sale.date)
            return saleDate >= day && saleDate < dayEnd
          })

          hourlyData.push({
            hour: day.getDate(), // Use day for x-axis
            sales: daySales.length,
            revenue: daySales.reduce((sum: number, sale: any) => sum + sale.total, 0)
          })
        }
      }

      // Top products
      const productCount: { [key: string]: { name: string; count: number; revenue: number } } = {}
      periodSales.forEach((sale: any) => {
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
        salesCount: periodSales.length,
        hourlyData,
        topProducts
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}