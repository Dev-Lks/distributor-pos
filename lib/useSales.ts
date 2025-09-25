import { useQueryClient, useQuery } from '@tanstack/react-query'
import { useProducts } from './useProducts'
import type { Product } from './useProducts'
import { sheetsBackup, type SaleData } from './googleSheets'

export interface SaleItem {
  productId: string
  quantity: number
  productName?: string
  price?: number
  cost?: number
  discount?: number
}

export interface CreateSaleParams {
  items: SaleItem[]
  paymentMethod?: 'cash' | 'card' | 'pix' | 'other'
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  customerDocument?: string
  channel?: string
  discountValue?: number
  taxValue?: number
  serviceCharge?: number
  notes?: string
}

interface SaleItemResponse {
  productId: string
  quantity: number
  price: number
  unitCost?: number | null
  discount?: number | null
  product?: {
    id: string
    name: string
  } | null
}

interface SalePaymentResponse {
  id: string
  amount: number
  method: string
  receivedAt?: string | null
  reference?: string | null
}

export interface SaleRecord {
  id: string
  date: string
  total: number
  paymentMethod?: string | null
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  customerDocument?: string | null
  channel?: string | null
  subtotal?: number | null
  discountValue?: number | null
  taxValue?: number | null
  serviceCharge?: number | null
  costOfGoods?: number | null
  grossMargin?: number | null
  notes?: string | null
  pointOfSale?: {
    id: string
    name: string
    channel?: string | null
  } | null
  payments?: SalePaymentResponse[]
  items: SaleItemResponse[]
}

export function useSales(pointOfSale?: string) {
  const queryClient = useQueryClient()
  const { data: products = [] } = useProducts()

  const { data: sales = [], isLoading: salesLoading, refetch: refetchSales } = useQuery<SaleRecord[]>({
    queryKey: ['sales'],
    queryFn: async () => {
      const response = await fetch('/api/sales')
      if (!response.ok) throw new Error('Failed to fetch sales')
      return (await response.json()) as SaleRecord[]
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const createSale = async ({
    items,
    paymentMethod,
    customerName,
    customerEmail,
    customerPhone,
    customerDocument,
    channel,
    discountValue = 0,
    taxValue = 0,
    serviceCharge = 0,
    notes
  }: CreateSaleParams) => {
    // Enrich items with product data
    const enrichedItems = items.map(item => {
      const product = products.find((p: Product) => p.id === item.productId)
      return {
        ...item,
        productName: product?.name || 'Unknown',
        price: product?.salePrice || 0,
        cost: product?.cost ?? 0
      }
    })

    // Calculate total
    const subtotal = enrichedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const costOfGoods = enrichedItems.reduce((sum, item) => sum + ((item.cost ?? 0) * item.quantity), 0)
    const netTotal = subtotal - discountValue + taxValue + serviceCharge
    const grossMarginValue = netTotal - costOfGoods

    // Check stock (client-side validation)
    for (const item of enrichedItems) {
      const product = products.find((p: Product) => p.id === item.productId)
      let availableStock = 0

      // Find the point of sale by ID and get the stock for this product
      const productPointOfSale = (product?.productPointsOfSale ?? []).find(
        (pps) => pps.pointOfSale?.id === pointOfSale
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
      total: netTotal,
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
        customerEmail,
        customerPhone,
        customerDocument,
        channel,
        discountValue,
        taxValue,
        serviceCharge,
        notes,
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
    queryClient.invalidateQueries({ queryKey: ['sales'] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey: ['sales-metrics'] })

    return newSale
  }

  const backupAllSales = async () => {
    try {
      const response = await fetch('/api/sales')
      if (!response.ok) throw new Error('Failed to fetch sales')
      const dbSales = (await response.json()) as SaleRecord[]
      let successCount = 0
      let errorCount = 0

      for (const sale of dbSales) {
        try {
          const saleData: SaleData = {
            id: sale.id,
            date: new Date(sale.date),
            total: sale.total,
            paymentMethod: sale.paymentMethod || 'Não informado',
            customerName: sale.customerName ?? undefined,
            items: sale.items.map((item) => ({
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

  const cancelSale = async (saleId: string) => {
    try {
      const response = await fetch(`/api/sales/${saleId}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to cancel sale: ${error}`)
      }
      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['sales-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      return true
    } catch (error) {
      console.error('Error canceling sale:', error)
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

  return { createSale, backupAllSales, getSheetsSummary, cancelSale, sales, salesLoading, refetchSales }
}

export function useSalesMetrics(period: 'today' | 'week' | 'month' | 'year' = 'today', pointOfSale: string = 'all') {
  return useQuery({
    queryKey: ['sales-metrics', period, pointOfSale],
    queryFn: async () => {
      // Fetch sales from database API
      const response = await fetch('/api/sales')
      if (!response.ok) throw new Error('Failed to fetch sales')
      const sales = (await response.json()) as SaleRecord[]

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
      const periodSales = sales.filter((sale) => new Date(sale.date) >= startDate)

      const filteredSales = pointOfSale === 'all'
        ? periodSales
        : periodSales.filter((sale) => sale.pointOfSale?.id === pointOfSale)

      const netRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total ?? 0), 0)
      const grossRevenue = filteredSales.reduce(
        (sum, sale) => sum + (sale.subtotal ?? sale.total ?? 0),
        0
      )
      const discounts = filteredSales.reduce((sum, sale) => sum + (sale.discountValue ?? 0), 0)
      const taxes = filteredSales.reduce((sum, sale) => sum + (sale.taxValue ?? 0), 0)
      const serviceCharges = filteredSales.reduce((sum, sale) => sum + (sale.serviceCharge ?? 0), 0)
      const costOfGoods = filteredSales.reduce((sum, sale) => sum + (sale.costOfGoods ?? 0), 0)
      const grossMarginValue = filteredSales.reduce(
        (sum, sale) =>
          sum + (sale.grossMargin ?? ((sale.total ?? 0) - (sale.costOfGoods ?? 0))),
        0
      )
      const grossMarginPercent = grossRevenue > 0 ? grossMarginValue / grossRevenue : 0
      const averageTicket = filteredSales.length > 0 ? netRevenue / filteredSales.length : 0
      const totalItemsSold = filteredSales.reduce(
        (sum, sale) =>
          sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0
      )
      const averageItemsPerSale = filteredSales.length > 0 ? totalItemsSold / filteredSales.length : 0

      // Sales by hour (last 24 hours for today, or aggregated for longer periods)
      const hourlyData: Array<{ hour: number; sales: number; revenue: number; margin: number }> = []
      if (period === 'today') {
        for (let i = 23; i >= 0; i--) {
          const hour = new Date()
          hour.setHours(hour.getHours() - i, 0, 0, 0)
          const hourEnd = new Date(hour)
          hourEnd.setHours(hour.getHours() + 1)

          const hourSales = filteredSales.filter((sale) => {
            const saleDate = new Date(sale.date)
            return saleDate >= hour && saleDate < hourEnd
          })

          hourlyData.push({
            hour: hour.getHours(),
            sales: hourSales.length,
            revenue: hourSales.reduce((sum, sale) => sum + (sale.total ?? 0), 0),
            margin: hourSales.reduce(
              (sum, sale) =>
                sum + (sale.grossMargin ?? ((sale.total ?? 0) - (sale.costOfGoods ?? 0))),
              0
            )
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

          const daySales = filteredSales.filter((sale) => {
            const saleDate = new Date(sale.date)
            return saleDate >= day && saleDate < dayEnd
          })

          hourlyData.push({
            hour: day.getDate(), // Use day for x-axis
            sales: daySales.length,
            revenue: daySales.reduce((sum, sale) => sum + (sale.total ?? 0), 0),
            margin: daySales.reduce(
              (sum, sale) =>
                sum + (sale.grossMargin ?? ((sale.total ?? 0) - (sale.costOfGoods ?? 0))),
              0
            )
          })
        }
      }

      // Top products
      const productCount: Record<string, { name: string; count: number; revenue: number; margin: number }> = {}
      filteredSales.forEach((sale) => {
        sale.items.forEach((item) => {
          if (!productCount[item.productId]) {
            productCount[item.productId] = {
              name: item.product?.name || 'Unknown',
              count: 0,
              revenue: 0,
              margin: 0
            }
          }
          productCount[item.productId].count += item.quantity
          productCount[item.productId].revenue += item.price * item.quantity
          const unitCost = item.unitCost ?? (item.price - (item.discount ?? 0))
          productCount[item.productId].margin += (item.price - unitCost) * item.quantity
        })
      })

      const topProducts = Object.values(productCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      const paymentMap = new Map<string, number>()
  filteredSales.forEach((sale) => {
        const payments = sale.payments && sale.payments.length > 0
          ? sale.payments
          : sale.paymentMethod
            ? [{ method: sale.paymentMethod, amount: sale.total ?? 0 }]
            : []

        payments.forEach((payment) => {
          const key = payment.method ?? 'Sem método'
          paymentMap.set(key, (paymentMap.get(key) ?? 0) + (payment.amount ?? 0))
        })
      })

      const paymentMix = Array.from(paymentMap.entries()).map(([method, amount]) => ({
        method,
        amount,
        share: netRevenue > 0 ? amount / netRevenue : 0
      }))

      const channelMap = new Map<string, { revenue: number; orders: number }>()
  filteredSales.forEach((sale) => {
        const key = sale.channel ?? 'POS'
        channelMap.set(key, {
          revenue: (channelMap.get(key)?.revenue ?? 0) + (sale.total ?? 0),
          orders: (channelMap.get(key)?.orders ?? 0) + 1,
        })
      })

      const channelBreakdown = Array.from(channelMap.entries()).map(([channel, data]) => ({
        channel,
        revenue: data.revenue,
        orders: data.orders,
      }))

      const posMap = new Map<string, { name: string; revenue: number; orders: number }>()
  filteredSales.forEach((sale) => {
        const name = sale.pointOfSale?.name ?? 'Ponto padrão'
        const id = sale.pointOfSale?.id ?? 'default'
        const key = `${id}::${name}`
        posMap.set(key, {
          name,
          revenue: (posMap.get(key)?.revenue ?? 0) + (sale.total ?? 0),
          orders: (posMap.get(key)?.orders ?? 0) + 1,
        })
      })

      const pointOfSaleBreakdown = Array.from(posMap.entries()).map(([key, data]) => {
        const [id, name] = key.split('::')
        return {
          id,
          name,
          revenue: data.revenue,
          orders: data.orders,
        }
      })

      const customerMap = new Map<string, { name: string; orders: number; revenue: number }>()
  filteredSales.forEach((sale) => {
        const name = sale.customerName?.trim() || 'Cliente padrão'
        const key = sale.customerDocument?.trim() || name
        customerMap.set(key, {
          name,
          orders: (customerMap.get(key)?.orders ?? 0) + 1,
          revenue: (customerMap.get(key)?.revenue ?? 0) + (sale.total ?? 0),
        })
      })

      const customerStats = Array.from(customerMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      const repeatCustomers = Array.from(customerMap.values()).filter((customer) => customer.orders > 1).length
      const repeatCustomerRate = customerMap.size > 0 ? repeatCustomers / customerMap.size : 0

      return {
        netRevenue,
        grossRevenue,
        salesCount: filteredSales.length,
        hourlyData,
        topProducts,
        discounts,
        taxes,
        serviceCharges,
        costOfGoods,
        grossMarginValue,
        grossMarginPercent,
        averageTicket,
        averageItemsPerSale,
        paymentMix,
        channelBreakdown,
        pointOfSaleBreakdown,
        customerLeaders: customerStats,
        repeatCustomerRate,
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}