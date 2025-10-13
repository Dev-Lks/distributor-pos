# 🎯 Melhorias Simples e Práticas

## 🚚 DELIVERY - Melhorias Essenciais (sem complexidade)

### 1. **Tela de Gestão de Deliveries na Dashboard**
```
app/(app)/dashboard/deliveries/page.tsx
```

**Features básicas:**
- ✅ Lista de entregas (Pendente, Em Preparo, Saiu, Entregue)
- ✅ Filtros por status, data, zona, entregador
- ✅ Criar nova entrega vinculada a uma venda
- ✅ Atribuir/remover entregador
- ✅ Atualizar status manualmente
- ✅ Visualizar detalhes (endereço, itens, valores)
- ✅ Marcar como entregue/cancelada
- ✅ Histórico de mudanças de status

### 2. **Sistema de Avaliação Simples**
```prisma
// Adicionar ao schema.prisma - Modelo minimalista
model DeliveryRating {
  id         String   @id @default(cuid())
  deliveryId String   @unique
  delivery   Delivery @relation(fields: [deliveryId], references: [id])
  
  rating     Int      @default(5) // 1-5 estrelas
  comment    String?
  
  createdAt  DateTime @default(now())
}
```

**Uso:**
- Ao marcar entrega como "Entregue", pedir avaliação opcional
- Mostrar média de avaliações no perfil do entregador
- Relatório simples de satisfação

### 3. **Cálculo Inteligente de Taxa**
```typescript
// Melhorar lib/useDeliveries.ts
export function useCalculateDeliveryFee() {
  // Considerar:
  // ✅ Zona base (já tem)
  // ✅ Distância (se tiver coordenadas)
  // ✅ Valor do pedido (frete grátis acima de X)
  // ✅ Tipo de veículo (moto/carro/bicicleta)
  // ✅ Horário (noturno = acréscimo)
  // ✅ Final de semana (acréscimo)
}
```

### 4. **Dashboard de Estatísticas**
```typescript
// Adicionar cards na tela de deliveries
interface DeliveryDashboard {
  today: {
    total: number
    pending: number
    inTransit: number
    delivered: number
    cancelled: number
  }
  thisMonth: {
    total: number
    revenue: number
    avgDeliveryTime: number
    avgRating: number
  }
  byZone: { zone: string; count: number; revenue: number }[]
  byDriver: { driver: string; count: number; rating: number }[]
}
```

### 5. **Vincular Delivery à Venda**
```typescript
// Na tela de criar/editar venda
<Checkbox 
  label="Entregar este pedido"
  onChange={(checked) => {
    if (checked) {
      // Abrir modal para preencher dados de entrega
      // Auto-preencher endereço do cliente (se tiver)
      // Auto-calcular taxa
      // Sugerir zona baseada no CEP/endereço
    }
  }}
/>
```

### 6. **Gestão de Zonas e Entregadores**
```
app/(app)/dashboard/deliveries/zones/page.tsx       // Gerenciar zonas
app/(app)/dashboard/deliveries/drivers/page.tsx     // Gerenciar entregadores
```

**Zonas:**
- CRUD básico
- Definir taxa base, valor mínimo, frete grátis acima de X
- Listar bairros/CEPs atendidos
- Tempo estimado

**Entregadores:**
- CRUD básico
- Marcar como ativo/disponível
- Ver estatísticas (entregas feitas, avaliação média)
- Definir tipo de veículo

---

## 👥 CLIENTES - Sincronização Total

### 1. **Context Provider Global** ⭐ PRIORIDADE #1
```typescript
// components/providers/CustomerProvider.tsx
"use client"

import { createContext, useContext, ReactNode, useCallback } from 'react'
import { useCustomers, type CustomerSummary } from '@/lib/useCustomers'
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
    return customers.find(c => 
      c.phone?.replace(/\D/g, '') === cleanPhone
    )
  }, [customers])

  const findByDocument = useCallback((document: string) => {
    const cleanDoc = document.replace(/\D/g, '')
    return customers.find(c => 
      c.document?.replace(/\D/g, '') === cleanDoc
    )
  }, [customers])

  const search = useCallback((query: string) => {
    const q = query.toLowerCase().replace(/\D/g, '')
    return customers.filter(c => {
      const name = c.name.toLowerCase()
      const phone = c.phone?.replace(/\D/g, '') || ''
      const document = c.document?.replace(/\D/g, '') || ''
      const address = c.address?.toLowerCase() || ''
      
      return name.includes(query.toLowerCase()) ||
             phone.includes(q) ||
             document.includes(q) ||
             address.includes(query.toLowerCase())
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
```

### 2. **Hook de Verificação de Duplicatas**
```typescript
// lib/useCheckDuplicates.ts
import { useCustomerContext } from '@/components/providers/CustomerProvider'

export function useCheckDuplicates() {
  const { findByPhone, findByDocument, search } = useCustomerContext()
  
  const checkDuplicates = (data: {
    name?: string
    phone?: string
    document?: string
  }) => {
    const duplicates: {
      type: 'phone' | 'document' | 'name'
      customer: CustomerSummary
    }[] = []
    
    // Verifica telefone (mais preciso)
    if (data.phone) {
      const byPhone = findByPhone(data.phone)
      if (byPhone) {
        duplicates.push({ type: 'phone', customer: byPhone })
      }
    }
    
    // Verifica documento
    if (data.document) {
      const byDoc = findByDocument(data.document)
      if (byDoc && !duplicates.find(d => d.customer.id === byDoc.id)) {
        duplicates.push({ type: 'document', customer: byDoc })
      }
    }
    
    // Verifica nome muito similar (opcional)
    if (data.name && data.name.length >= 3) {
      const byName = search(data.name)
      byName.forEach(customer => {
        if (
          !duplicates.find(d => d.customer.id === customer.id) &&
          similarity(customer.name, data.name!) > 0.85 // 85% similar
        ) {
          duplicates.push({ type: 'name', customer })
        }
      })
    }
    
    return duplicates
  }
  
  return { checkDuplicates }
}

// Função simples de similaridade (Levenshtein simplificado)
function similarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1
  
  if (longer.length === 0) return 1.0
  
  const editDistance = getEditDistance(longer.toLowerCase(), shorter.toLowerCase())
  return (longer.length - editDistance) / longer.length
}

function getEditDistance(s1: string, s2: string): number {
  s1 = s1.toLowerCase()
  s2 = s2.toLowerCase()

  const costs = []
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
```

### 3. **Modal de Aviso de Duplicatas**
```typescript
// components/customers/DuplicateWarningDialog.tsx
"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Phone, FileText, MapPin, User } from "lucide-react"
import type { CustomerSummary } from "@/lib/useCustomers"

interface DuplicateWarningDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  duplicates: {
    type: 'phone' | 'document' | 'name'
    customer: CustomerSummary
  }[]
  onSelectExisting: (customer: CustomerSummary) => void
  onCreateAnyway: () => void
}

export function DuplicateWarningDialog({
  open,
  onOpenChange,
  duplicates,
  onSelectExisting,
  onCreateAnyway,
}: DuplicateWarningDialogProps) {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'phone': return '📱 Mesmo telefone'
      case 'document': return '📄 Mesmo CPF/CNPJ'
      case 'name': return '👤 Nome similar'
      default: return ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>Cliente já cadastrado?</DialogTitle>
          </div>
          <DialogDescription>
            Encontramos {duplicates.length} cliente(s) com dados similares.
            Selecione um existente ou confirme para cadastrar um novo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {duplicates.map(({ type, customer }) => (
            <Card key={customer.id} className="p-4 hover:bg-accent/50 transition-colors">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-base">{customer.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {getTypeLabel(type)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {customer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    {customer.document && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        <span>{customer.document}</span>
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">{customer.address}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    onSelectExisting(customer)
                    onOpenChange(false)
                  }}
                >
                  Usar este
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onCreateAnyway()
              onOpenChange(false)
            }}
          >
            Cadastrar novo mesmo assim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### 4. **Atualizar CreateCustomerModal**
```typescript
// Modificar components/customers/CreateCustomerModal.tsx
// Adicionar verificação antes de criar

const handleCheckDuplicates = async (data: CustomerFormData) => {
  const duplicates = checkDuplicates({
    name: data.name,
    phone: data.phone,
    document: data.document,
  })
  
  if (duplicates.length > 0) {
    setFoundDuplicates(duplicates)
    setShowDuplicateWarning(true)
    return false // Não prosseguir
  }
  
  return true // OK para criar
}

const onSubmit = async (data: CustomerFormData) => {
  // Verificar duplicatas primeiro
  const canProceed = await handleCheckDuplicates(data)
  if (!canProceed) return
  
  // Criar normalmente
  await createCustomer.mutateAsync(data)
}
```

### 5. **Melhorar staleTime dos Hooks**
```typescript
// lib/useCustomers.ts
export function useCustomers(search?: string) {
  return useQuery<CustomerSummary[]>({
    queryKey: [...CUSTOMERS_QUERY_KEY, search?.trim() ?? ""],
    queryFn: async () => {
      const response = await fetch(buildCustomersUrl(search))
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao buscar clientes")
      }
      return data as CustomerSummary[]
    },
    staleTime: 1000 * 60 * 5, // 5 minutos (era 2)
    gcTime: 1000 * 60 * 30, // 30 minutos em cache
    refetchOnWindowFocus: true, // Atualiza quando voltar à aba
  })
}
```

### 6. **Sincronização Automática**
```typescript
// Em todos os hooks de mutação de clientes
export function useCreateCustomer() {
  const queryClient = useQueryClient()
  const { refresh } = useCustomerContext()
  
  return useMutation({
    mutationFn: createCustomerAPI,
    onSuccess: (newCustomer) => {
      // 1. Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      
      // 2. Atualizar cache otimisticamente
      queryClient.setQueryData<CustomerSummary[]>(
        ['customers', ''],
        (old = []) => [newCustomer, ...old]
      )
      
      // 3. Atualizar Context Provider
      refresh()
    }
  })
}
```

---

## 🎯 PLANO DE IMPLEMENTAÇÃO

### Fase 1: Clientes (1-2 horas) ⭐ COMEÇAR AQUI
1. ✅ Criar `CustomerProvider.tsx`
2. ✅ Adicionar no `app/layout.tsx`
3. ✅ Criar `useCheckDuplicates.ts`
4. ✅ Criar `DuplicateWarningDialog.tsx`
5. ✅ Atualizar `CreateCustomerModal.tsx`
6. ✅ Melhorar `staleTime` nos hooks

### Fase 2: Delivery Básico (2-3 horas)
1. ✅ Criar `app/(app)/dashboard/deliveries/page.tsx`
2. ✅ Componente de lista de deliveries
3. ✅ Componente de criar/editar delivery
4. ✅ Adicionar modelo `DeliveryRating` no schema
5. ✅ Criar telas de zonas e entregadores

### Fase 3: Integrações (1 hora)
1. ✅ Adicionar opção "Entregar" na tela de vendas
2. ✅ Melhorar cálculo de taxa de entrega
3. ✅ Dashboard com estatísticas

---

## ✨ BENEFÍCIOS IMEDIATOS

### Clientes:
- ✅ Nunca mais criar cliente duplicado por acidente
- ✅ Busca instantânea em qualquer tela
- ✅ Dados sempre sincronizados entre telas
- ✅ Performance melhorada (cache inteligente)
- ✅ Menos requisições ao servidor

### Delivery:
- ✅ Gestão completa em uma tela simples
- ✅ Rastreamento manual de status
- ✅ Estatísticas básicas de entregas
- ✅ Vinculação direta com vendas
- ✅ Gestão de zonas e entregadores

---

**Posso começar implementando?** Vou começar pela Fase 1 (Clientes) que é a mais importante e já vai trazer benefícios imediatos! 🚀
