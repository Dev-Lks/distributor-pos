import { useCustomerContext } from '@/components/providers/CustomerProvider'
import type { CustomerSummary } from './useCustomers'

export interface DuplicateMatch {
  type: 'phone' | 'document' | 'name'
  customer: CustomerSummary
  confidence: number // 0-1
}

export function useCheckDuplicates() {
  const { findByPhone, findByDocument, search } = useCustomerContext()
  
  const checkDuplicates = (data: {
    name?: string
    phone?: string
    document?: string
  }): DuplicateMatch[] => {
    const duplicates: DuplicateMatch[] = []
    const foundIds = new Set<string>()
    
    // 1. Verifica telefone (mais preciso - 100% confiança)
    if (data.phone && data.phone.replace(/\D/g, '').length >= 10) {
      const byPhone = findByPhone(data.phone)
      if (byPhone) {
        duplicates.push({ 
          type: 'phone', 
          customer: byPhone,
          confidence: 1.0 
        })
        foundIds.add(byPhone.id)
      }
    }
    
    // 2. Verifica documento (muito preciso - 100% confiança)
    if (data.document && data.document.replace(/\D/g, '').length >= 11) {
      const byDoc = findByDocument(data.document)
      if (byDoc && !foundIds.has(byDoc.id)) {
        duplicates.push({ 
          type: 'document', 
          customer: byDoc,
          confidence: 1.0 
        })
        foundIds.add(byDoc.id)
      }
    }
    
    // 3. Verifica nome muito similar (menos preciso)
    if (data.name && data.name.trim().length >= 3) {
      const byName = search(data.name)
      
      byName.forEach(customer => {
        if (!foundIds.has(customer.id)) {
          const simScore = similarity(
            customer.name.toLowerCase(), 
            data.name!.toLowerCase()
          )
          
          // Só considera se similaridade > 85%
          if (simScore > 0.85) {
            duplicates.push({ 
              type: 'name', 
              customer,
              confidence: simScore
            })
            foundIds.add(customer.id)
          }
        }
      })
    }
    
    // Ordenar por confiança (mais confiável primeiro)
    return duplicates.sort((a, b) => b.confidence - a.confidence)
  }
  
  return { checkDuplicates }
}

/**
 * Calcula similaridade entre duas strings usando Levenshtein Distance
 * Retorna valor entre 0 (totalmente diferente) e 1 (idêntico)
 */
function similarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1
  
  if (longer.length === 0) return 1.0
  
  const editDistance = getEditDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Calcula Levenshtein Distance entre duas strings
 */
function getEditDistance(s1: string, s2: string): number {
  const costs: number[] = []
  
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j
      } else if (j > 0) {
        let newValue = costs[j - 1]
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
        }
        costs[j - 1] = lastValue
        lastValue = newValue
      }
    }
    if (i > 0) costs[s2.length] = lastValue
  }
  
  return costs[s2.length]
}
