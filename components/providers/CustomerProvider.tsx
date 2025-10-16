"use client"

import { createContext, useContext, ReactNode, useCallback } from 'react'
import { useCustomers, type CustomerSummary } from '@/hooks/useCustomers'
import { useQueryClient } from '@tanstack/react-query'

interface CustomerContextValue {
  // Dados
  customers: CustomerSummary[]
  isLoading: boolean
  
  // Métodos de busca
  findById: (id: string) => CustomerSummary | undefined
  findByPhone: (phone: string) => CustomerSummary | undefined
  findByDocument: (document: string) => CustomerSummary | undefined
  search: (query: string) => CustomerSummary[]
  
  // Métodos de ação
  refresh: () => Promise<void>
}

const CustomerContext = createContext<CustomerContextValue | null>(null)

export function CustomerProvider({ children }: { children: ReactNode }) {
  const { data: customers = [], isLoading, refetch } = useCustomers()
  const queryClient = useQueryClient()

  const findById = useCallback((id: string) => {
    return customers.find(c => c.id === id)
  }, [customers])

  const findByPhone = useCallback((phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    if (!cleanPhone) return undefined
    return customers.find(c => 
      c.phone?.replace(/\D/g, '') === cleanPhone
    )
  }, [customers])

  const findByDocument = useCallback((document: string) => {
    const cleanDoc = document.replace(/\D/g, '')
    if (!cleanDoc) return undefined
    return customers.find(c => 
      c.document?.replace(/\D/g, '') === cleanDoc
    )
  }, [customers])

  const search = useCallback((query: string) => {
    if (!query || query.trim().length < 2) return []
    
    const q = query.toLowerCase().replace(/\D/g, '')
    const queryLower = query.toLowerCase()
    
    return customers.filter(c => {
      const name = c.name.toLowerCase()
      const phone = c.phone?.replace(/\D/g, '') || ''
      const document = c.document?.replace(/\D/g, '') || ''
      const address = c.address?.toLowerCase() || ''
      
      return name.includes(queryLower) ||
             phone.includes(q) ||
             document.includes(q) ||
             address.includes(queryLower)
    })
  }, [customers])

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['customers'] })
    await refetch()
  }, [queryClient, refetch])

  return (
    <CustomerContext.Provider value={{
      customers,
      isLoading,
      findById,
      findByPhone,
      findByDocument,
      search,
      refresh,
    }}>
      {children}
    </CustomerContext.Provider>
  )
}

export function useCustomerContext() {
  const context = useContext(CustomerContext)
  if (!context) {
    throw new Error('useCustomerContext must be used within CustomerProvider')
  }
  return context
}
