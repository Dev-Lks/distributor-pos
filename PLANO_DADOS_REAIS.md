# 📊 PLANO: CONECTAR WIDGETS AO BANCO DE DADOS REAL

## 🎯 OBJETIVO

Remover todos os dados mockados dos widgets e conectá-los às APIs e banco de dados real do sistema.

---

## 📋 ANÁLISE ATUAL

### Widgets com Dados Mockados (8/10)

| Widget | Status | Dados Mockados | Dados Reais Disponíveis |
|--------|--------|----------------|-------------------------|
| ✅ KPIsWidget | Parcial | Alguns valores | useSalesMetrics ✓ |
| ✅ SalesChartWidget | Mock | Gráficos demo | useSalesMetrics ✓ |
| ❌ TopProductsWidget | Mock | Top 5 produtos | Sale + SaleItem ✓ |
| ❌ StockAlertsWidget | Mock | Alertas fake | Inventory ✓ |
| ❌ RecentOrdersWidget | Mock | Encomendas fake | Order model ✓ |
| ✅ CashFlowWidget | Parcial | Valores demo | useCashSession ✓ |
| ❌ CalendarWidget | Mock | Eventos fake | Order + Audit ✓ |
| ❌ QuickInsightsWidget | Mock | Insights fake | Análises ✓ |
| ❌ RecentActivityWidget | Mock | Timeline fake | CashTransaction ✓ |
| ❌ TeamPerformanceWidget | Mock | Equipe fake | Sale + User ✓ |

### Hooks Disponíveis

✅ **Já existem:**
- `useSalesMetrics(period)` - Vendas por período
- `useProducts()` - Produtos
- `useCashSession()` - Sessão de caixa atual
- `useSession()` - Usuário logado (NextAuth)
- `useInventory()` - Inventário básico
- `useCustomers()` - Clientes

❌ **Precisam ser criados:**
- `useOrders()` - Encomendas (Order model)
- `useTopProducts(period)` - Top produtos vendidos
- `useStockAlerts()` - Alertas de estoque
- `useRecentActivity(limit)` - Atividades recentes
- `useTeamPerformance(period)` - Performance da equipe
- `useUpcomingEvents()` - Eventos próximos

### APIs Necessárias

✅ **Já existem:**
- `/api/sales` - Vendas
- `/api/products` - Produtos
- `/api/inventory` - Inventário
- `/api/cash-sessions/current` - Sessão atual

❌ **Precisam ser criadas:**
- `/api/orders` - CRUD de encomendas
- `/api/analytics/top-products?period=` - Top produtos
- `/api/analytics/stock-alerts` - Alertas de estoque
- `/api/analytics/recent-activity?limit=` - Atividades
- `/api/analytics/team-performance?period=` - Performance equipe
- `/api/analytics/upcoming-events` - Eventos próximos

---

## 🗺️ PLANO DE IMPLEMENTAÇÃO

### **FASE 1: APIs de Analytics** (30 min)

Criar endpoints de analytics para agregar dados do banco.

#### 1.1 Top Products API
**Arquivo:** `app/api/analytics/top-products/route.ts`

```typescript
// GET /api/analytics/top-products?period=today|week|month
// 
// Query:
// SELECT 
//   p.id, p.name, p.image,
//   SUM(si.quantity) as sold,
//   SUM(si.price * si.quantity) as revenue,
//   (current revenue - previous revenue) as trend
// FROM SaleItem si
// JOIN Product p ON si.productId = p.id
// JOIN Sale s ON si.saleId = s.id
// WHERE s.date >= [period_start]
// GROUP BY p.id
// ORDER BY revenue DESC
// LIMIT 5
```

#### 1.2 Stock Alerts API
**Arquivo:** `app/api/analytics/stock-alerts/route.ts`

```typescript
// GET /api/analytics/stock-alerts
//
// Query:
// SELECT 
//   p.id, p.name, p.sku,
//   i.coldRoomQuantity + i.houseQuantity + i.salePointQuantity as totalStock,
//   i.coldRoomMinStock + i.houseMinStock + i.salePointMinStock as minStock,
//   CASE 
//     WHEN total = 0 THEN 'critical'
//     WHEN total < minStock * 0.5 THEN 'low'
//     ELSE 'ok'
//   END as level
// FROM Product p
// JOIN Inventory i ON p.id = i.productId
// WHERE (total = 0 OR total < minStock)
// ORDER BY level DESC, total ASC
```

#### 1.3 Recent Activity API
**Arquivo:** `app/api/analytics/recent-activity/route.ts`

```typescript
// GET /api/analytics/recent-activity?limit=10
//
// Query: Union de múltiplas tabelas
// - CashTransaction (últimas transações de caixa)
// - Sale (últimas vendas)
// - InventoryMovement (últimas movimentações)
// - Order (últimas encomendas)
// 
// Ordenar por timestamp DESC
// Formatar com tipo, usuário, descrição
```

#### 1.4 Team Performance API
**Arquivo:** `app/api/analytics/team-performance/route.ts`

```typescript
// GET /api/analytics/team-performance?period=today|week|month
//
// Query:
// SELECT 
//   u.id, u.name, u.email,
//   COUNT(DISTINCT s.id) as salesCount,
//   SUM(s.total) as revenue,
//   RANK() OVER (ORDER BY SUM(s.total) DESC) as rank
// FROM User u
// LEFT JOIN CashSession cs ON u.id = cs.userId
// LEFT JOIN Sale s ON cs.id = s.cashSessionId
// WHERE s.date >= [period_start]
// GROUP BY u.id
// ORDER BY revenue DESC
```

#### 1.5 Upcoming Events API
**Arquivo:** `app/api/analytics/upcoming-events/route.ts`

```typescript
// GET /api/analytics/upcoming-events?days=7
//
// Query: Union de:
// - Order (promisedAt nos próximos X dias)
// - InventoryAudit (scheduledFor nos próximos X dias)
// - DailyReport (próximos fechamentos)
// 
// Retorna: { date, type, title, priority, relatedId }
```

---

### **FASE 2: Hooks Customizados** (20 min)

Criar hooks React Query para consumir as novas APIs.

#### 2.1 useTopProducts Hook
**Arquivo:** `lib/useTopProducts.ts`

```typescript
import { useQuery } from '@tanstack/react-query'

export interface TopProduct {
  id: string
  name: string
  image?: string
  sold: number
  revenue: number
  trend: 'up' | 'down' | 'neutral'
  trendPercentage: number
}

export function useTopProducts(period: 'today' | 'week' | 'month' = 'today') {
  return useQuery<TopProduct[]>({
    queryKey: ['top-products', period],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/top-products?period=${period}`)
      if (!res.ok) throw new Error('Failed to fetch top products')
      return res.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}
```

#### 2.2 useStockAlerts Hook
**Arquivo:** `lib/useStockAlerts.ts`

```typescript
export interface StockAlert {
  productId: string
  productName: string
  sku?: string
  totalStock: number
  minStock: number
  level: 'critical' | 'low'
}

export function useStockAlerts() {
  return useQuery<StockAlert[]>({
    queryKey: ['stock-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/stock-alerts')
      if (!res.ok) throw new Error('Failed to fetch stock alerts')
      return res.json()
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}
```

#### 2.3 useRecentActivity Hook
**Arquivo:** `lib/useRecentActivity.ts`

```typescript
export interface Activity {
  id: string
  type: 'sale' | 'inventory' | 'cash' | 'order'
  description: string
  userName: string
  userAvatar: string
  timestamp: string
  relatedId?: string
}

export function useRecentActivity(limit: number = 10) {
  return useQuery<Activity[]>({
    queryKey: ['recent-activity', limit],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/recent-activity?limit=${limit}`)
      if (!res.ok) throw new Error('Failed to fetch activity')
      return res.json()
    },
    refetchInterval: 1000 * 30, // Refetch a cada 30s
  })
}
```

#### 2.4 useTeamPerformance Hook
**Arquivo:** `lib/useTeamPerformance.ts`

```typescript
export interface TeamMember {
  id: string
  name: string
  email: string
  avatar: string
  salesCount: number
  revenue: number
  rank: number
}

export function useTeamPerformance(period: 'today' | 'week' | 'month' = 'today') {
  return useQuery<TeamMember[]>({
    queryKey: ['team-performance', period],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/team-performance?period=${period}`)
      if (!res.ok) throw new Error('Failed to fetch team performance')
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
  })
}
```

#### 2.5 useUpcomingEvents Hook
**Arquivo:** `lib/useUpcomingEvents.ts`

```typescript
export interface UpcomingEvent {
  id: string
  date: string
  type: 'order' | 'audit' | 'delivery' | 'report'
  title: string
  priority: 'high' | 'medium' | 'low'
  relatedId?: string
}

export function useUpcomingEvents(days: number = 7) {
  return useQuery<UpcomingEvent[]>({
    queryKey: ['upcoming-events', days],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/upcoming-events?days=${days}`)
      if (!res.ok) throw new Error('Failed to fetch events')
      return res.json()
    },
    staleTime: 1000 * 60 * 10,
  })
}
```

#### 2.6 useOrders Hook (para Orders completo)
**Arquivo:** `lib/useOrders.ts`

```typescript
export interface Order {
  id: string
  orderNumber: string
  customer: {
    id: string
    name: string
    phone: string
  }
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  promisedAt?: string
  total: number
  depositPaid: number
  balanceDue: number
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export function useOrders(filters?: { status?: string; priority?: string }) {
  return useQuery<Order[]>({
    queryKey: ['orders', filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters as any)
      const res = await fetch(`/api/orders?${params}`)
      if (!res.ok) throw new Error('Failed to fetch orders')
      return res.json()
    },
    staleTime: 1000 * 60 * 2,
  })
}
```

---

### **FASE 3: Atualizar Widgets** (40 min)

Substituir dados mockados pelos hooks reais.

#### 3.1 TopProductsWidget
```typescript
// ANTES:
const products: TopProduct[] = initialProducts || [mockData]

// DEPOIS:
const { data: products, isLoading } = useTopProducts(period)

if (isLoading) return <Skeleton />
if (!products?.length) return <EmptyState />
```

#### 3.2 StockAlertsWidget
```typescript
// ANTES:
const alerts = mockAlerts

// DEPOIS:
const { data: alerts, isLoading } = useStockAlerts()
const critical = alerts?.filter(a => a.level === 'critical') || []
const low = alerts?.filter(a => a.level === 'low') || []
```

#### 3.3 RecentOrdersWidget
```typescript
// ANTES:
const orders = mockOrders

// DEPOIS:
const { data: allOrders } = useOrders({ 
  status: 'PENDING,CONFIRMED,PREPARING,READY' 
})
const orders = allOrders?.slice(0, 5) || []

// Calcular daysRemaining de promisedAt
```

#### 3.4 CashFlowWidget
```typescript
// ANTES:
const mockChartData = [...]

// DEPOIS:
const { data: session } = useCashSession()
const { data: sales } = useSalesMetrics('today')

// Montar chartData a partir das sales agrupadas por hora
```

#### 3.5 CalendarWidget
```typescript
// ANTES:
const events = mockEvents

// DEPOIS:
const { data: events } = useUpcomingEvents(7)

// Agrupar por data
// Formatar com ícones e badges
```

#### 3.6 QuickInsightsWidget
```typescript
// ANTES:
const insights = mockInsights

// DEPOIS:
const { data: alerts } = useStockAlerts()
const { data: topProducts } = useTopProducts('today')
const { data: orders } = useOrders()

// Gerar insights baseado nos dados reais:
// - "X produtos em estoque crítico"
// - "Y tem sido o mais vendido hoje"
// - "Z encomendas próximas do deadline"
```

#### 3.7 RecentActivityWidget
```typescript
// ANTES:
const activities = mockActivities

// DEPOIS:
const { data: activities, isLoading } = useRecentActivity(10)
```

#### 3.8 TeamPerformanceWidget
```typescript
// ANTES:
const members = mockMembers

// DEPOIS:
const { data: members, isLoading } = useTeamPerformance(period)
```

#### 3.9 SalesChartWidget
```typescript
// ANTES:
const mockChartData = [...]

// DEPOIS:
const { data: metrics } = useSalesMetrics(period)

// Transformar metrics em chartData
const chartData = metrics?.dailyMetrics.map(day => ({
  date: format(new Date(day.date), 'dd/MM'),
  faturamento: day.revenue,
  quantidade: day.itemsSold,
  margem: day.margin,
})) || []
```

---

### **FASE 4: APIs de Orders (CRUD)** (30 min)

Criar sistema completo de encomendas.

#### 4.1 GET /api/orders
```typescript
// Lista encomendas com filtros
// Suporta: status, priority, customer, dateRange
```

#### 4.2 POST /api/orders
```typescript
// Criar nova encomenda
// Validar: customer, items, promisedAt
// Gerar orderNumber automático (ENC-YYYY-XXX)
```

#### 4.3 PATCH /api/orders/[id]
```typescript
// Atualizar status/dados
// Registrar em statusHistory
```

#### 4.4 DELETE /api/orders/[id]
```typescript
// Cancelar encomenda (soft delete)
```

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### APIs (5 arquivos)
- [ ] `app/api/analytics/top-products/route.ts`
- [ ] `app/api/analytics/stock-alerts/route.ts`
- [ ] `app/api/analytics/recent-activity/route.ts`
- [ ] `app/api/analytics/team-performance/route.ts`
- [ ] `app/api/analytics/upcoming-events/route.ts`
- [ ] `app/api/orders/route.ts` (GET, POST)
- [ ] `app/api/orders/[id]/route.ts` (PATCH, DELETE)

### Hooks (6 arquivos)
- [ ] `lib/useTopProducts.ts`
- [ ] `lib/useStockAlerts.ts`
- [ ] `lib/useRecentActivity.ts`
- [ ] `lib/useTeamPerformance.ts`
- [ ] `lib/useUpcomingEvents.ts`
- [ ] `lib/useOrders.ts`

### Widgets (8 arquivos)
- [ ] `components/dashboard/widgets/TopProductsWidget.tsx`
- [ ] `components/dashboard/widgets/StockAlertsWidget.tsx`
- [ ] `components/dashboard/widgets/RecentOrdersWidget.tsx`
- [ ] `components/dashboard/widgets/CashFlowWidget.tsx`
- [ ] `components/dashboard/widgets/CalendarWidget.tsx`
- [ ] `components/dashboard/widgets/QuickInsightsWidget.tsx`
- [ ] `components/dashboard/widgets/RecentActivityWidget.tsx`
- [ ] `components/dashboard/widgets/TeamPerformanceWidget.tsx`
- [ ] `components/dashboard/widgets/SalesChartWidget.tsx`

### Testes
- [ ] Verificar build sem erros
- [ ] Testar cada widget individualmente
- [ ] Validar performance das queries
- [ ] Testar em diferentes períodos
- [ ] Verificar estados de loading
- [ ] Testar estados vazios

---

## ⚡ OTIMIZAÇÕES

### Caching Strategy
```typescript
// Dados estáticos: 5-10 min
staleTime: 1000 * 60 * 5

// Dados dinâmicos: 2 min
staleTime: 1000 * 60 * 2

// Dados real-time: 30s
refetchInterval: 1000 * 30
```

### Database Indexes
```sql
-- Já existem no schema:
@@index([cashSessionId])
@@index([customerId, status])
@@index([productId, effectiveAt])

-- Adicionar se necessário:
CREATE INDEX idx_sale_date ON Sale(date DESC);
CREATE INDEX idx_saleitem_product ON SaleItem(productId, saleId);
CREATE INDEX idx_order_promised ON Order(promisedAt ASC);
```

### React Query Optimizations
```typescript
// Prefetch em dashboard mount
useEffect(() => {
  queryClient.prefetchQuery(['top-products', 'today'])
  queryClient.prefetchQuery(['stock-alerts'])
}, [])
```

---

## 🎯 RESULTADO ESPERADO

### Antes
- ❌ 80% dados mockados
- ❌ Widgets não refletem realidade
- ❌ Sem atualização automática
- ❌ Insights genéricos

### Depois
- ✅ 100% dados reais do banco
- ✅ Dashboard reflete operação atual
- ✅ Auto-refresh configurável
- ✅ Insights baseados em dados reais
- ✅ Performance otimizada (caching)
- ✅ Loading states apropriados
- ✅ Empty states quando sem dados

---

## 📊 MÉTRICAS DE SUCESSO

1. **0 dados mockados** - Todos widgets conectados ao banco
2. **< 2s load time** - Dashboard carrega rápido
3. **< 100ms query time** - Queries otimizadas
4. **Auto-refresh** - Dados atualizam sozinhos
5. **100% TypeScript** - Sem erros de tipo

---

## ⏱️ ESTIMATIVA DE TEMPO

| Fase | Tempo | Complexidade |
|------|-------|--------------|
| APIs Analytics | 30 min | Média |
| Hooks React Query | 20 min | Baixa |
| Atualizar Widgets | 40 min | Média |
| APIs Orders CRUD | 30 min | Alta |
| Testes & Ajustes | 30 min | Média |
| **TOTAL** | **~2.5h** | - |

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Revisar plano
2. ⏳ Implementar Fase 1 (APIs)
3. ⏳ Implementar Fase 2 (Hooks)
4. ⏳ Implementar Fase 3 (Widgets)
5. ⏳ Implementar Fase 4 (Orders)
6. ⏳ Testar tudo
7. ✅ Deploy!

---

**🍺 Pronto para transformar o dashboard em 100% real!**
