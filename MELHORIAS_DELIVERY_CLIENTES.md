# 🚀 Melhorias para Sistema de Delivery e Sincronização de Clientes

## 📦 SISTEMA DE DELIVERY - Sugestões de Melhoria

### 1. **Rastreamento em Tempo Real**
```typescript
// Adicionar WebSocket ou Server-Sent Events para tracking
// lib/useDeliveryTracking.ts
export function useDeliveryTracking(deliveryId: string) {
  // Atualização em tempo real da posição do entregador
  // Status: Em preparo → Saiu para entrega → A caminho → Entregue
}
```

**Benefícios:**
- Cliente acompanha entrega em tempo real
- Notificações push quando entregador está próximo
- Mapa interativo com posição do entregador

### 2. **Sistema de Agendamento Inteligente**
```typescript
// Sugestão: Criar slots de horário com limite de entregas
interface DeliverySchedule {
  date: Date
  timeSlot: string // "08:00-10:00", "10:00-12:00"
  maxDeliveries: number
  currentDeliveries: number
  zones: string[] // Zonas atendidas nesse horário
}
```

**Implementar:**
- Calendário de agendamento
- Limite de entregas por horário
- Priorização automática de zonas próximas
- Sugestão de melhor horário baseado em demanda

### 3. **Otimização de Rotas**
```typescript
// Integrar com Google Maps Directions API ou similar
export function useRouteOptimization() {
  // Agrupa entregas próximas
  // Calcula rota mais eficiente
  // Considera trânsito em tempo real
}
```

**Features:**
- Agrupar múltiplas entregas na mesma rota
- Calcular tempo estimado considerando trânsito
- Sugerir ordem de entrega otimizada
- Reduzir custos com combustível

### 4. **Sistema de Avaliação e Feedback**
```prisma
// Adicionar ao schema.prisma
model DeliveryRating {
  id          String   @id @default(cuid())
  deliveryId  String   @unique
  delivery    Delivery @relation(fields: [deliveryId], references: [id])
  
  // Avaliações
  overallRating    Int     @default(5) // 1-5 estrelas
  timeRating       Int?    // Pontualidade
  qualityRating    Int?    // Qualidade
  driverRating     Int?    // Entregador
  
  // Feedback
  comment          String?
  tags             String[] // ["pontual", "educado", "produto ok"]
  
  // Problemas
  hadIssue         Boolean  @default(false)
  issueType        String?  // "atraso", "produto errado", "danificado"
  issueDescription String?
  
  createdAt DateTime @default(now())
}
```

### 5. **Notificações Automatizadas**
```typescript
// Implementar sistema de notificações progressivas
const deliveryNotifications = {
  CONFIRMED: "Pedido confirmado! Preparando para entrega...",
  PREPARING: "Seu pedido está sendo preparado",
  READY: "Pedido pronto! Aguardando motorista",
  PICKED_UP: "Motorista a caminho do seu endereço",
  NEARBY: "Entregador está próximo (5min)",
  DELIVERED: "Pedido entregue! Obrigado pela preferência",
}
```

**Canais:**
- WhatsApp (via API oficial)
- SMS
- Push Notifications
- Email

### 6. **Dashboard do Entregador (App Mobile)**
```typescript
// Criar app/tela dedicada para entregadores
interface DriverDashboard {
  pendingDeliveries: Delivery[]
  currentDelivery: Delivery | null
  todayStats: {
    completed: number
    earnings: number
    rating: number
  }
  navigation: {
    nextAddress: string
    estimatedTime: number
    distance: number
  }
}
```

### 7. **Cálculo Dinâmico de Taxa**
```typescript
// Melhorar useCalculateDeliveryFee
export function useSmartDeliveryFee() {
  // Considerar:
  // - Distância real (não apenas zona)
  // - Horário (pico = +taxa)
  // - Clima (chuva = +taxa)
  // - Demanda atual
  // - Promoções ativas
}
```

### 8. **Sistema de Prioridades**
```prisma
enum DeliveryPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

// Adicionar ao modelo Delivery
priority DeliveryPriority @default(NORMAL)
isPremium Boolean @default(false) // Cliente premium
```

### 9. **Histórico e Analytics**
```typescript
// Dashboard com métricas
interface DeliveryAnalytics {
  avgDeliveryTime: number
  onTimeRate: number // % entregas no prazo
  customerSatisfaction: number
  topZones: Zone[]
  peakHours: string[]
  driverPerformance: DriverStats[]
  revenue: {
    total: number
    byZone: Record<string, number>
    byDriver: Record<string, number>
  }
}
```

### 10. **Integração com Pedidos**
```typescript
// Fluxo automático: Venda → Pedido → Delivery
// Quando venda é criada com "delivery", criar automaticamente:
export async function createSaleWithDelivery(data) {
  const sale = await createSale(data)
  const delivery = await createDelivery({
    saleId: sale.id,
    customerId: sale.customerId,
    // Auto-detectar zona baseado no endereço
    // Auto-calcular taxa
    // Auto-sugerir entregador disponível mais próximo
  })
}
```

---

## 👥 SINCRONIZAÇÃO DE CLIENTES - Melhorias

### 1. **Sistema de Cache Global com React Query**
```typescript
// lib/customerCache.ts
import { QueryClient } from '@tanstack/react-query'

export const customerQueryConfig = {
  staleTime: 1000 * 60 * 5, // 5 minutos - dados considerados frescos
  cacheTime: 1000 * 60 * 30, // 30 minutos - quanto tempo manter em cache
  refetchOnMount: false, // Não refazer query se dados ainda estão frescos
  refetchOnWindowFocus: true, // Atualizar quando usuário voltar à aba
}

// Pré-carregar clientes ao entrar no sistema
export function usePrefetchCustomers() {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    // Pré-carregar clientes recentes e frequentes
    queryClient.prefetchQuery({
      queryKey: ['customers', 'recent'],
      queryFn: fetchRecentCustomers,
    })
  }, [])
}
```

### 2. **Context Provider Global de Clientes**
```typescript
// components/providers/CustomerProvider.tsx
"use client"

import { createContext, useContext, ReactNode } from 'react'
import { useCustomers } from '@/lib/useCustomers'

interface CustomerContextValue {
  customers: CustomerSummary[]
  isLoading: boolean
  refetch: () => void
  findCustomer: (id: string) => CustomerSummary | undefined
  searchCustomer: (query: string) => CustomerSummary[]
}

const CustomerContext = createContext<CustomerContextValue | null>(null)

export function CustomerProvider({ children }: { children: ReactNode }) {
  const { data: customers = [], isLoading, refetch } = useCustomers()

  const findCustomer = (id: string) => {
    return customers.find(c => c.id === id)
  }

  const searchCustomer = (query: string) => {
    const q = query.toLowerCase()
    return customers.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.document?.includes(q)
    )
  }

  return (
    <CustomerContext.Provider value={{
      customers,
      isLoading,
      refetch,
      findCustomer,
      searchCustomer,
    }}>
      {children}
    </CustomerContext.Provider>
  )
}

export function useCustomerContext() {
  const context = useContext(CustomerContext)
  if (!context) throw new Error('useCustomerContext must be used within CustomerProvider')
  return context
}
```

### 3. **Hook Unificado para Busca de Clientes**
```typescript
// lib/useUnifiedCustomerSearch.ts
export function useUnifiedCustomerSearch() {
  const queryClient = useQueryClient()
  
  // Buscar em cache primeiro, depois no servidor
  const searchCustomer = async (query: string) => {
    // 1. Buscar no cache
    const cachedCustomers = queryClient.getQueryData<CustomerSummary[]>(['customers'])
    
    if (cachedCustomers) {
      const localResults = cachedCustomers.filter(c => 
        matchesQuery(c, query)
      )
      
      // Se encontrou no cache, retorna imediatamente
      if (localResults.length > 0) {
        return localResults
      }
    }
    
    // 2. Se não encontrou no cache, busca no servidor
    const serverResults = await fetchCustomers(query)
    
    // 3. Atualiza cache
    queryClient.setQueryData(['customers', query], serverResults)
    
    return serverResults
  }
  
  return { searchCustomer }
}
```

### 4. **Prevenção de Duplicatas Melhorada**
```typescript
// lib/customerDuplicateChecker.ts
export function useCustomerDuplicateChecker() {
  const { searchCustomer } = useUnifiedCustomerSearch()
  
  const checkForDuplicates = async (data: {
    name?: string
    phone?: string
    document?: string
    email?: string
  }) => {
    const possibleDuplicates: CustomerSummary[] = []
    
    // Buscar por telefone (mais preciso)
    if (data.phone) {
      const byPhone = await searchCustomer(data.phone)
      possibleDuplicates.push(...byPhone)
    }
    
    // Buscar por documento
    if (data.document) {
      const byDoc = await searchCustomer(data.document)
      possibleDuplicates.push(...byDoc)
    }
    
    // Buscar por nome similar (fuzzy match)
    if (data.name) {
      const byName = await searchCustomer(data.name)
      const similarNames = byName.filter(c => 
        similarity(c.name, data.name!) > 0.8 // 80% similar
      )
      possibleDuplicates.push(...similarNames)
    }
    
    // Remover duplicatas da lista
    return Array.from(new Set(possibleDuplicates.map(c => c.id)))
      .map(id => possibleDuplicates.find(c => c.id === id)!)
  }
  
  return { checkForDuplicates }
}
```

### 5. **Modal de Confirmação de Duplicatas**
```typescript
// components/customers/DuplicateWarningModal.tsx
export function DuplicateWarningModal({
  possibleDuplicates,
  newCustomerData,
  onConfirmNew,
  onSelectExisting,
}: Props) {
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>⚠️ Possíveis clientes duplicados</DialogTitle>
          <DialogDescription>
            Encontramos clientes cadastrados com dados similares:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {possibleDuplicates.map(customer => (
            <Card key={customer.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{customer.name}</h4>
                  {customer.phone && <p className="text-sm">📱 {customer.phone}</p>}
                  {customer.document && <p className="text-sm">📄 {customer.document}</p>}
                  {customer.address && <p className="text-sm text-muted-foreground">{customer.address}</p>}
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => onSelectExisting(customer)}
                >
                  Usar este
                </Button>
              </div>
            </Card>
          ))}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onConfirmNew}>
            Cadastrar como novo cliente mesmo assim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### 6. **Sincronização Automática entre Telas**
```typescript
// Usar React Query para invalidação automática
export function useCreateCustomer() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createCustomerAPI,
    onSuccess: (newCustomer) => {
      // Invalida TODAS as queries de clientes
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      
      // Atualiza cache otimisticamente
      queryClient.setQueryData<CustomerSummary[]>(
        ['customers'],
        (old = []) => [newCustomer, ...old]
      )
      
      // Atualiza lista de recentes
      queryClient.setQueryData<CustomerSummary[]>(
        ['customers', 'recent'],
        (old = []) => [newCustomer, ...old.slice(0, 9)]
      )
    }
  })
}
```

### 7. **Broadcast de Mudanças (para múltiplas abas)**
```typescript
// lib/customerBroadcast.ts
const customerChannel = new BroadcastChannel('customer-updates')

// Quando criar/atualizar cliente
customerChannel.postMessage({
  type: 'CUSTOMER_UPDATED',
  customer: updatedCustomer,
  timestamp: Date.now(),
})

// Em outros componentes/abas
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.data.type === 'CUSTOMER_UPDATED') {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
  }
  
  customerChannel.addEventListener('message', handleMessage)
  return () => customerChannel.removeEventListener('message', handleMessage)
}, [])
```

### 8. **IndexedDB para Cache Offline**
```typescript
// lib/customerOfflineCache.ts
import { openDB } from 'idb'

const dbPromise = openDB('customer-cache', 1, {
  upgrade(db) {
    db.createObjectStore('customers', { keyPath: 'id' })
    db.createObjectStore('search-index', { keyPath: 'key' })
  },
})

export async function cacheCustomers(customers: CustomerSummary[]) {
  const db = await dbPromise
  const tx = db.transaction('customers', 'readwrite')
  
  await Promise.all(
    customers.map(customer => tx.store.put(customer))
  )
  
  await tx.done
}

export async function getCustomerFromCache(id: string) {
  const db = await dbPromise
  return db.get('customers', id)
}

// Busca offline quando sem internet
export async function searchCustomersOffline(query: string) {
  const db = await dbPromise
  const allCustomers = await db.getAll('customers')
  
  return allCustomers.filter(c => 
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.phone?.includes(query) ||
    c.document?.includes(query)
  )
}
```

### 9. **Componente Selector Unificado Melhorado**
```typescript
// components/customers/UnifiedCustomerSelector.tsx
export function UnifiedCustomerSelector({
  value,
  onSelect,
  context = 'sale', // 'sale', 'delivery', 'order', etc
}: Props) {
  const { customers, searchCustomer } = useCustomerContext()
  const { checkForDuplicates } = useCustomerDuplicateChecker()
  const [duplicates, setDuplicates] = useState<CustomerSummary[]>([])
  
  // Busca inteligente com debounce
  const debouncedSearch = useDebounce(searchQuery, 300)
  
  // Filtros específicos por contexto
  const contextFilters = {
    sale: (c: CustomerSummary) => !c.isBlocked,
    delivery: (c: CustomerSummary) => !!c.address,
    order: (c: CustomerSummary) => true,
  }
  
  // Busca com cache + servidor
  const results = useQuery({
    queryKey: ['customer-search', debouncedSearch, context],
    queryFn: () => searchCustomer(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
  })
  
  // Verificar duplicatas antes de criar
  const handleBeforeCreate = async (data: CustomerFormData) => {
    const possibleDuplicates = await checkForDuplicates(data)
    
    if (possibleDuplicates.length > 0) {
      setDuplicates(possibleDuplicates)
      return // Mostrar modal de aviso
    }
    
    // Se não há duplicatas, criar normalmente
    await createCustomer(data)
  }
  
  return (
    <>
      <CustomerSelectorUI
        results={results.data?.filter(contextFilters[context])}
        onSelect={onSelect}
        onCreateNew={handleBeforeCreate}
      />
      
      {duplicates.length > 0 && (
        <DuplicateWarningModal
          possibleDuplicates={duplicates}
          onSelectExisting={onSelect}
          onConfirmNew={() => {/* criar mesmo assim */}}
        />
      )}
    </>
  )
}
```

### 10. **Mesclar Clientes Duplicados**
```typescript
// lib/useMergeCustomers.ts
export function useMergeCustomers() {
  return useMutation({
    mutationFn: async ({
      primaryId,
      duplicateIds,
    }: {
      primaryId: string
      duplicateIds: string[]
    }) => {
      // API endpoint que:
      // 1. Transfere todas as vendas/pedidos/deliveries dos duplicados para o principal
      // 2. Mescla informações (pegar as mais completas)
      // 3. Deleta duplicados
      // 4. Atualiza estatísticas
      
      return await fetch('/api/customers/merge', {
        method: 'POST',
        body: JSON.stringify({ primaryId, duplicateIds }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
  })
}
```

---

## 🎯 PRIORIDADES DE IMPLEMENTAÇÃO

### Delivery (em ordem):
1. ✅ Sistema de avaliação e feedback (mais simples)
2. ✅ Notificações automatizadas (WhatsApp/SMS)
3. ✅ Cálculo dinâmico de taxa melhorado
4. 🔄 Agendamento inteligente
5. 🔄 Dashboard do entregador
6. 🔄 Otimização de rotas
7. 📊 Rastreamento em tempo real (mais complexo)

### Clientes (em ordem):
1. ✅ Context Provider Global (implementar hoje!)
2. ✅ Hook unificado de busca
3. ✅ Prevenção de duplicatas melhorada
4. ✅ Modal de confirmação de duplicatas
5. 🔄 Broadcast para múltiplas abas
6. 🔄 IndexedDB para cache offline
7. 🔄 Sistema de merge de duplicados

---

## 📝 PRÓXIMOS PASSOS

### Para começar agora:
1. Implementar `CustomerProvider` no `app/layout.tsx`
2. Criar `useUnifiedCustomerSearch` 
3. Adicionar verificação de duplicatas no `CreateCustomerModal`
4. Melhorar `staleTime` e `cacheTime` nos hooks de clientes
5. Adicionar sistema de avaliação de delivery no schema

**Quer que eu implemente alguma dessas melhorias específicas no código?**
